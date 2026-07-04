/**
 * POST /api/checkout/webhook
 *
 * Mollie callback bij payment status changes.
 * Body: form-encoded { id: 'tr_xxx' } — we moeten Mollie API zelf
 * raadplegen voor de actuele status (security best practice).
 *
 * Idempotent: Mollie mag deze webhook meermaals aanroepen. De
 * statusovergang (mapMollieStatus) garandeert dat een order die al
 * 'paid' is nooit een tweede voorraadaftrek of statuswissel krijgt.
 */

import type { APIRoute } from 'astro';
import { getSupabaseAdmin } from '../../../lib/supabase';
import { getMollie } from '../../../lib/mollie';
import { mapMollieStatus } from '../../../lib/checkout-logic';
import { finalizeInventory, releaseInventory } from '../../../lib/inventory';
import { sendOrderConfirmation } from '../../../lib/mail';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  const sb = getSupabaseAdmin();
  if (!sb) return new Response('', { status: 503 });

  const text = await request.text();
  const params = new URLSearchParams(text);
  const paymentId = params.get('id');
  if (!paymentId) return new Response('', { status: 400 });

  let payment;
  try {
    const mollie = getMollie();
    payment = await mollie.payments.get(paymentId);
  } catch (err) {
    console.error('[webhook] Mollie payment ophalen faalde:', err);
    // 503 zodat Mollie het later opnieuw probeert
    return new Response('', { status: 503 });
  }

  const { data: order } = await sb
    .from('orders')
    .select('*, order_items(*)')
    .eq('mollie_payment_id', paymentId)
    .single();

  if (!order) return new Response('', { status: 404 });

  const transition = mapMollieStatus(payment.status, {
    payment_status: order.payment_status,
    status: order.status,
  });

  // Niets te doen (bijv. dubbele webhook-call op een al betaalde order)
  const noChange =
    transition.action === 'none' &&
    transition.payment_status === order.payment_status &&
    transition.status === order.status;
  if (noChange) return new Response('', { status: 200 });

  if (transition.action === 'finalize') {
    // Reservering wordt verkoop: quantity en reserved beide omlaag
    for (const item of order.order_items || []) {
      const ok = await finalizeInventory(sb, item.variant_id, item.quantity);
      if (!ok) console.error('[webhook] finalize_inventory faalde voor variant', item.variant_id);
    }
  } else if (transition.action === 'release') {
    // Betaling mislukt/verlopen/geannuleerd: reservering vrijgeven
    for (const item of order.order_items || []) {
      const ok = await releaseInventory(sb, item.variant_id, item.quantity);
      if (!ok) console.error('[webhook] release_inventory faalde voor variant', item.variant_id);
    }
  }

  await sb.from('orders').update({
    payment_status: transition.payment_status,
    status: transition.status,
    paid_at: transition.markPaidAt ? new Date().toISOString() : order.paid_at,
  }).eq('id', order.id);

  if (transition.markPaidAt) {
    // Orderbevestiging (env-gated via RESEND_API_KEY; faalt nooit hard)
    await sendOrderConfirmation(order).catch((err) =>
      console.error('[webhook] orderbevestiging versturen faalde:', err),
    );
  }

  // Mollie verwacht 200 OK
  return new Response('', { status: 200 });
};
