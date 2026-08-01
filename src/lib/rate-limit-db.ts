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

function hashSleutel(bereik: string, sleutel: string): string {
  const geheim = import.meta.env.AUTH_SECRET;
  if (!geheim || geheim.length < 32) {
    throw new Error('[Villa Happ] AUTH_SECRET ontbreekt of is korter dan 32 tekens.');
  }
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
  if (!sb) {
    // Demo-modus: geen database, dus terugvallen op de instance-teller.
    const ok = geheugenLimiet(`${bereik}:${sleutel}`, maximum, vensterSeconden * 1000);
    return { toegestaan: ok, retryNaSeconden: vensterSeconden };
  }

  const { data, error } = await sb.rpc('rate_limit_hit', {
    p_bereik: bereik,
    p_sleutel_hash: hashSleutel(bereik, sleutel),
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
