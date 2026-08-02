/**
 * Villa Happ — rate limiting met een gedeelde teller (server-only)
 *
 * De oude teller stond in het geheugen van één serverless-instance. Schaalt
 * Vercel op, dan krijgt elke instance zijn eigen bucket en is de limiet te
 * omzeilen door genoeg parallelle verzoeken te doen. Deze teller staat in de
 * database en is dus gedeeld.
 *
 * Patroon uit prWize Core:
 *  - alleen een HMAC van de sleutel wordt opgeslagen, nooit het ruwe IP of
 *    e-mailadres. Er staat dus geen persoonsgegeven in de tabel.
 *  - de vensterlogica draait op de DATABASEKLOK, niet op die van de
 *    applicatieserver.
 *
 * Zonder database (demo-modus) valt hij terug op de teller in het geheugen:
 * die is zwakker, maar beter dan helemaal geen begrenzing.
 */

import { createHmac } from 'node:crypto';
import { getSupabaseAdmin } from './supabase';
import { rateLimit as geheugenLimiet } from './rate-limit';

export interface Begrenzing {
  toegestaan: boolean;
  retryNaSeconden: number;
}

/**
 * Null als AUTH_SECRET ontbreekt, in plaats van een exception.
 *
 * Dit gooide eerst, en dat is de verkeerde afweging voor een rate limiter:
 * `begrens()` is de eerste regel van /api/checkout/create, en die aanroep
 * staat niet in een try. Ontbrak het secret, dan gaf afrekenen een kale 500
 * voordat er ook maar iets gebeurd was. Een teller die de winkel kan sluiten
 * is erger dan een teller die even terugvalt op de zwakkere variant.
 *
 * De tokens in order-token.ts blijven wél gooien: een token dat met een
 * ontbrekend of zwak secret is getekend, is vervalsbaar. Daar is hard falen
 * juist de goede uitkomst.
 */
function hashSleutel(bereik: string, sleutel: string): string | null {
  const geheim = import.meta.env.AUTH_SECRET;
  if (!geheim || geheim.length < 32) return null;
  return createHmac('sha256', geheim).update(`${bereik}:${sleutel}`).digest('hex');
}

/** Client-IP uit de request. Vercel zet x-forwarded-for. */
export function clientSleutel(request: Request): string {
  const fwd = request.headers.get('x-forwarded-for');
  return fwd ? fwd.split(',')[0].trim() : 'onbekend';
}

export async function begrens(
  bereik: string,
  sleutel: string,
  maximum: number,
  vensterSeconden = 60,
): Promise<Begrenzing> {
  const sb = getSupabaseAdmin();
  const hash = hashSleutel(bereik, sleutel);

  if (!sb || !hash) {
    // Geen database of geen AUTH_SECRET: terugvallen op de instance-teller.
    // Zwakker, maar de winkel blijft open.
    if (!hash) {
      console.warn(
        `[rate-limit] AUTH_SECRET ontbreekt of is te kort; teller valt terug ` +
        `op het geheugen van deze instance. Zet AUTH_SECRET in de omgeving.`,
      );
    }
    const ok = geheugenLimiet(`${bereik}:${sleutel}`, maximum, vensterSeconden * 1000);
    return { toegestaan: ok, retryNaSeconden: vensterSeconden };
  }

  const { data, error } = await sb.rpc('rate_limit_hit', {
    p_bereik: bereik,
    p_sleutel_hash: hash,
    p_venster_seconden: vensterSeconden,
  });

  if (error || !data) {
    // Ontbreekt de functie nog of hapert de database, dan niet stil alles
    // doorlaten: de instance-teller pakt het over.
    const ok = geheugenLimiet(`${bereik}:${sleutel}`, maximum, vensterSeconden * 1000);
    return { toegestaan: ok, retryNaSeconden: vensterSeconden };
  }

  const rij = Array.isArray(data) ? data[0] : data;
  const aantal = Number(rij?.aantal ?? 1);
  const start = new Date(rij?.venster_start ?? Date.now()).getTime();
  const eindeOverSeconden = Math.max(
    1,
    Math.ceil((start + vensterSeconden * 1000 - Date.now()) / 1000),
  );

  return { toegestaan: aantal <= maximum, retryNaSeconden: eindeOverSeconden };
}

export function teVeelVerzoeken(
  begrenzing: Begrenzing,
  bericht = 'Te veel verzoeken. Probeer het over een minuut opnieuw.',
): Response {
  return new Response(JSON.stringify({ error: bericht }), {
    status: 429,
    headers: {
      'Content-Type': 'application/json',
      'Retry-After': String(begrenzing.retryNaSeconden),
      'Cache-Control': 'no-store',
    },
  });
}
