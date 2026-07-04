/**
 * POST /api/checkout/create
 *
 * Body: { items: [{ variant_id, quantity }], customer: {...}, shipping: {...} }
 *
 * Flow:
 * 1. Validate cart items + voorraad
 * 2. Calculate totals server-side (klant kan prijzen niet manipuleren)
 * 3. Reserve inventory (atomair; bij tekort alles terugdraaien)
 * 4. Create order in Supabase (status=pending, payment_status=open)
 * 5. Create Mollie payment (bij falen: reserveringen vrijgeven + order annuleren)
 * 6. Return Mollie checkout URL
 */

import type { APIRoute } from 'astro';
import { Locale } from '@mollie/api-client';
import type { Payment } from '@mollie/api-client';
import { getSupabaseAdmin } from '../../../lib/supabase';
import { getMollie } from '../../../lib/mollie';
import { CheckoutSchema, shippingCost } from '../../../lib/checkout-logic';
import { reserveInventory, releaseInventory } from '../../../lib/inventory';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  const sb = getSupabaseAdmin();
  if (!sb) {
    return new Response(JSON.stringify({ error: 'Supabase niet geconfigureerd' }), { status: 503 });
  }

  let body;
  try {
    body = CheckoutSchema.parse(await request.json());
  } catch (err: any) {
    return new Response(JSON.stringify({ error: 'Invalid request', details: err?.issues }), { status: 400 });
  }

  // 1. Haal variants + voorraad op
  const variantIds = body.items.map(i => i.variant_id);
  const { data: variants, error: vErr } = await sb
    .from('product_variants')
    .select('id, product_id, sku, size, color, price_cents, products(id, name, price_cents, status)')
    .in('id', variantIds);

  if (vErr || !variants || variants.length !== variantIds.length) {
    return new Response(JSON.stringify({ error: 'Een of meer producten zijn niet meer beschikbaar.' }), { status: 400 });
  }

  // 2. Bouw line items (voorraadcheck gebeurt atomair bij het reserveren)
  let subtotal = 0;
  const lineItems = [];
  for (const reqItem of body.items) {
    const variant = variants.find((v: any) => v.id === reqItem.variant_id);
    if (!variant || (variant.products as any)?.status !== 'published') {
      return new Response(JSON.stringify({ error: 'Product niet beschikbaar.' }), { status: 400 });
    }
    const unitPrice = variant.price_cents || (variant.products as any).price_cents;
    const lineTotal = unitPrice * reqItem.quantity;
    subtotal += lineTotal;
    lineItems.push({
      variant_id: variant.id,
      product_id: variant.product_id,
      product_name: (variant.products as any).name,
      variant_label: [variant.color, variant.size].filter(Boolean).join(' / '),
      sku: variant.sku,
      unit_price_cents: unitPrice,
      quantity: reqItem.quantity,
      total_cents: lineTotal,
    });
  }

  const shipping = shippingCost(body.shipping.country, subtotal);
  const tax = 0; // BTW is al verwerkt in prijs (Dutch BTW-inclusief gebruikelijk)
  const total = subtotal + shipping + tax;

  // 3. Reserveer voorraad atomair; bij tekort alle eerdere reserveringen terugdraaien
  const reserved: { variant_id: string; quantity: number; product_name: string }[] = [];
  const rollback = async () => {
    for (const r of reserved) {
      await releaseInventory(sb, r.variant_id, r.quantity);
    }
  };

  for (const item of lineItems) {
    const ok = await reserveInventory(sb, item.variant_id, item.quantity);
    if (!ok) {
      await rollback();
      return new Response(JSON.stringify({
        error: `Onvoldoende voorraad voor ${item.product_name}.`,
        variant_id: item.variant_id,
      }), { status: 409 });
    }
    reserved.push({ variant_id: item.variant_id, quantity: item.quantity, product_name: item.product_name });
  }

  // 4. Create order
  const { data: orderNumberData, error: onErr } = await sb.rpc('generate_order_number');
  const orderNumber = (!onErr && orderNumberData)
    || `VH-${new Date().getFullYear()}-${Date.now().toString().slice(-5)}`;

  // Upsert customer
  const { data: cust } = await sb.from('customers').upsert({
    email: body.customer.email,
    first_name: body.customer.first_name,
    last_name: body.customer.last_name,
    accepts_marketing: body.customer.accepts_marketing || false,
  }, { onConflict: 'email' }).select().single();

  const { data: order, error: orderErr } = await sb.from('orders').insert({
    order_number: orderNumber,
    customer_id: cust?.id,
    customer_email: body.customer.email,
    customer_name: `${body.customer.first_name} ${body.customer.last_name}`,
    subtotal_cents: subtotal,
    shipping_cents: shipping,
    tax_cents: tax,
    total_cents: total,
    shipping_address: body.shipping,
    billing_address: body.shipping,
  }).select().single();

  if (orderErr || !order) {
    await rollback();
    return new Response(JSON.stringify({ error: 'Kon bestelling niet aanmaken.' }), { status: 500 });
  }

  const { error: itemsErr } = await sb.from('order_items').insert(
    lineItems.map(li => ({ ...li, order_id: order.id }))
  );
  if (itemsErr) {
    await rollback();
    await sb.from('orders').update({ status: 'cancelled', payment_status: 'failed' }).eq('id', order.id);
    return new Response(JSON.stringify({ error: 'Kon bestelling niet aanmaken.' }), { status: 500 });
  }

  // 5. Mollie payment; bij falen niets gereserveerd of open laten hangen
  const siteUrl = import.meta.env.PUBLIC_SITE_URL || new URL(request.url).origin;
  let payment: Payment | undefined;
  try {
    const mollie = getMollie();
    payment = await mollie.payments.create({
      amount: { currency: 'EUR', value: (total / 100).toFixed(2) },
      description: `Villa Happ ${orderNumber}`,
      redirectUrl: `${siteUrl}/checkout/success?order=${order.order_number}`,
      cancelUrl: `${siteUrl}/checkout/cancelled?order=${order.order_number}`,
      webhookUrl: `${siteUrl}/api/checkout/webhook`,
      metadata: { order_id: order.id, order_number: order.order_number },
      locale: Locale.nl_NL,
    });
  } catch (err) {
    console.error('[checkout] Mollie payment create faalde:', err);
    await rollback();
    await sb.from('orders').update({ status: 'cancelled', payment_status: 'failed' }).eq('id', order.id);
    return new Response(JSON.stringify({ error: 'Betaling kon niet worden gestart. Probeer het opnieuw.' }), { status: 502 });
  }
  if (!payment) {
    await rollback();
    return new Response(JSON.stringify({ error: 'Betaling kon niet worden gestart. Probeer het opnieuw.' }), { status: 502 });
  }

  // 6. Save Mollie id op order
  await sb.from('orders').update({
    mollie_payment_id: payment.id,
  }).eq('id', order.id);

  return new Response(JSON.stringify({
    success: true,
    order_number: order.order_number,
    checkout_url: payment.getCheckoutUrl(),
  }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};
