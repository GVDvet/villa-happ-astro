/**
 * GET /api/checkout/status?t=<token>
 *
 * Vertelt de bedanktpagina of een betaling écht gelukt is. Mollie stuurt de
 * klant naar `redirectUrl` bij elke afloop: betaald, mislukt, verlopen of
 * afgebroken in de bankapp. Zonder deze check zou die pagina "bedankt"
 * zeggen en het mandje legen terwijl er niets betaald is.
 *
 * De status komt rechtstreeks bij Mollie vandaan, niet uit onze database:
 * de webhook en de redirect zijn een race, en direct na het betalen staat
 * onze order vaak nog op 'open'. Deze route schrijft niets; de webhook
 * blijft de enige die de order en de voorraad muteert.
 *
 * `t` is een stateless capability-token (src/lib/order-token.ts) met het
 * publiek 'status'. Het bestelnummer zit er niet meer in als losse
 * parameter: bestelnummers lopen op, en zonder token zou je met een reeks
 * nummers kunnen uitlezen welke bestellingen betaald zijn. Een portaal-
 * token past hier niet op, want dat is met een andere sleutel getekend.
 */

import type { APIRoute } from 'astro';
import { getSupabaseAdmin } from '../../../lib/supabase';
import { getMollie } from '../../../lib/mollie';
import { paymentState } from '../../../lib/checkout-logic';
import { leesOrderToken } from '../../../lib/order-token';
import { begrens, clientSleutel, teVeelVerzoeken } from '../../../lib/rate-limit-db';

export const prerender = false;

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  });

export const GET: APIRoute = async ({ request, url }) => {
  // Ruim genoeg voor het pollen op de bedanktpagina (elke 2s, ~30s lang)
  const limiet = await begrens('checkout-status', clientSleutel(request), 40);
  if (!limiet.toegestaan) return teVeelVerzoeken(limiet);

  const inhoud = leesOrderToken(url.searchParams.get('t'), 'status');
  if (!inhoud) return json({ error: 'not found' }, 404);

  const sb = getSupabaseAdmin();
  if (!sb) return json({ state: 'unknown', reason: 'no-db' });

  const { data: order } = await sb
    .from('orders')
    .select('order_number, payment_status, mollie_payment_id')
    .eq('id', inhoud.orderId)
    .maybeSingle();

  if (!order) return json({ error: 'not found' }, 404);

  // Al betaald volgens de webhook? Dan hoeft Mollie er niet aan te pas.
  if (order.payment_status === 'paid') {
    return json({ state: 'paid', order_number: order.order_number });
  }

  if (!order.mollie_payment_id) {
    return json({ state: 'pending', order_number: order.order_number });
  }

  try {
    const payment = await getMollie().payments.get(order.mollie_payment_id);
    return json({ state: paymentState(payment.status), order_number: order.order_number });
  } catch (err) {
    console.error('[checkout-status] Mollie ophalen faalde:', err);
    // Niets beweren wat we niet weten: de pagina houdt het mandje dan vast.
    return json({ state: 'unknown', order_number: order.order_number });
  }
};
