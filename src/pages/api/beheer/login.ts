/**
 * POST /api/beheer/login  — inloggen op het beheerportaal
 * POST /api/beheer/logout — uitloggen (zie logout.ts)
 *
 * Eén beheerder, dus geen gebruikerstabel: het wachtwoord staat als
 * scrypt-hash in ADMIN_PASSWORD_HASH. Bij een juist wachtwoord komt er een
 * ondertekend, httpOnly-cookie.
 *
 * Twee dingen bewust zo:
 *  - de rate limit gaat op het IP én is streng (5 per 15 minuten), want er
 *    is maar één wachtwoord te raden;
 *  - het antwoord is altijd hetzelfde bij een fout wachtwoord en bij een
 *    ontbrekende configuratie, zodat je van buiten niet kunt zien of het
 *    portaal überhaupt aanstaat.
 */

import type { APIRoute } from 'astro';
import {
  BEHEER_COOKIE, COOKIE_OPTIES, maakBeheerSessie,
  controleerBeheerWachtwoord, beheerGeconfigureerd,
} from '../../../lib/beheer-sessie';
import { begrens, clientSleutel, teVeelVerzoeken } from '../../../lib/rate-limit-db';

export const prerender = false;

const AFGEWEZEN = new Response(
  JSON.stringify({ error: 'Wachtwoord klopt niet.' }),
  { status: 401, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } },
);

export const POST: APIRoute = async ({ request, cookies }) => {
  const limiet = await begrens('beheer-login', clientSleutel(request), 5, 15 * 60);
  if (!limiet.toegestaan) return teVeelVerzoeken(limiet, 'Te veel pogingen. Probeer het later opnieuw.');

  // Cookie-mutatie alleen vanaf de eigen site (prWize-patroon).
  const origin = request.headers.get('origin');
  if (origin && new URL(origin).host !== new URL(request.url).host) {
    return AFGEWEZEN.clone();
  }

  let wachtwoord = '';
  try {
    const body = await request.json();
    wachtwoord = typeof body?.wachtwoord === 'string' ? body.wachtwoord : '';
  } catch {
    return AFGEWEZEN.clone();
  }

  if (!beheerGeconfigureerd() || !wachtwoord || !controleerBeheerWachtwoord(wachtwoord)) {
    return AFGEWEZEN.clone();
  }

  cookies.set(BEHEER_COOKIE, maakBeheerSessie(), COOKIE_OPTIES);
  return new Response(JSON.stringify({ success: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  });
};
