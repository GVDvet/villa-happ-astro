/**
 * POST /api/checkout/webhook
 *
 * Mollie callback bij payment status changes.
 * Body: form-encoded { id: 'tr_xxx' } — we moeten Mollie API zelf
 * raadplegen voor de actuele status (security best practice).
 */

import type { APIRoute } from 'astro';
import { getSupabaseAdmin } from '../../../lib/supabase';
import { getMollie } from '../../../lib/mollie';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  const sb = getSupabaseAdmin();
  if (!sb) return new Response('', { status: 503 });

  const text = await request.text();
  const params = new URLSearchParams(text);
  const paymentId = params.get('id');
  if (!paymentId) return new Response('', { status: 400 });

  const mollie = getMollie();
  const payment = await mollie.payments.get(paymentId);

  const { data: order } = await sb
    .from('orders')
    .select('*, order_items(*)')
    .eq('mollie_payment_id', paymentId)
    .single();

  if (!order) return new Response('', { status: 404 });

  let newPaymentStatus = order.payment_status;
  let newOrderStatus = order.status;
  let paidAt = order.paid_at;

  switch (payment.status) {
    case 'paid':
      newPaymentStatus = 'paid';
      newOrderStatus = 'paid';
      paidAt = new Date().toISOString();
      // Decrement voorraad echt nu (van reserved naar verkocht)
      for (const item of order.order_items || []) {
        await sb.rpc('finalize_inventory', { v_id: item.variant_id, qty: item.quantity })
          .then(() => null)
          .catch(async () => {
            // Fallback: direct update
            const { data: inv } = await sb.from('inventory').select('*').eq('variant_id', item.variant_id).single();
            if (inv) {
              await sb.from('inventory').update({
                quantity: Math.max(0, inv.quantity - item.quantity),
                reserved: Math.max(0, inv.reserved - item.quantity),
              }).eq('variant_id', item.variant_id);
            }
          });
      }
      // TODO: trigger order confirmation email
      break;
    case 'failed':
    case 'canceled':
    case 'expired':
      newPaymentStatus = payment.status === 'canceled' ? 'failed' : payment.status as any;
      newOrderStatus = 'cancelled';
      // Release reserved voorraad
      for (const item of order.order_items || []) {
        const { data: inv } = await sb.from('inventory').select('*').eq('variant_id', item.variant_id).single();
        if (inv) {
          await sb.from('inventory').update({
            reserved: Math.max(0, inv.reserved - item.quantity),
          }).eq('variant_id', item.variant_id);
        }
      }
      break;
    case 'authorized':
      newPaymentStatus = 'authorized';
      break;
    case 'pending':
    case 'open':
      newPaymentStatus = 'open';
      break;
  }

  await sb.from('orders').update({
    payment_status: newPaymentStatus,
    status: newOrderStatus,
    paid_at: paidAt,
  }).eq('id', order.id);

  // Mollie verwacht 200 OK
  return new Response('', { status: 200 });
};
