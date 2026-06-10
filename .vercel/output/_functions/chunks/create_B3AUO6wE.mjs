import { z } from 'zod';
import { g as getSupabaseAdmin } from './supabase_D6SjNLSm.mjs';
import { g as getMollie } from './mollie_D0WQo5lk.mjs';

const prerender = false;
const Schema = z.object({
  items: z.array(z.object({
    variant_id: z.string().uuid(),
    quantity: z.number().int().min(1).max(20)
  })).min(1),
  customer: z.object({
    email: z.string().email(),
    first_name: z.string().min(1),
    last_name: z.string().min(1),
    accepts_marketing: z.boolean().optional()
  }),
  shipping: z.object({
    street: z.string().min(1),
    house_number: z.string().min(1),
    postal_code: z.string().min(1),
    city: z.string().min(1),
    country: z.enum(["NL", "BE", "DE"]).default("NL"),
    phone: z.string().optional()
  })
});
function shippingCost(country, subtotalCents) {
  if (subtotalCents >= 7500) return 0;
  if (country === "NL") return 495;
  if (country === "BE") return 695;
  return 895;
}
const POST = async ({ request }) => {
  const sb = getSupabaseAdmin();
  if (!sb) {
    return new Response(JSON.stringify({ error: "Supabase niet geconfigureerd" }), { status: 503 });
  }
  let body;
  try {
    body = Schema.parse(await request.json());
  } catch (err) {
    return new Response(JSON.stringify({ error: "Invalid request", details: err?.issues }), { status: 400 });
  }
  const variantIds = body.items.map((i) => i.variant_id);
  const { data: variants, error: vErr } = await sb.from("product_variants").select("id, product_id, sku, size, color, price_cents, products(id, name, price_cents, status)").in("id", variantIds);
  if (vErr || !variants || variants.length !== variantIds.length) {
    return new Response(JSON.stringify({ error: "Een of meer producten zijn niet meer beschikbaar." }), { status: 400 });
  }
  const { data: inventoryRows } = await sb.from("inventory").select("*").in("variant_id", variantIds);
  const stockMap = Object.fromEntries((inventoryRows || []).map((r) => [r.variant_id, r]));
  let subtotal = 0;
  const lineItems = [];
  for (const reqItem of body.items) {
    const variant = variants.find((v) => v.id === reqItem.variant_id);
    if (!variant || variant.products?.status !== "published") {
      return new Response(JSON.stringify({ error: "Product niet beschikbaar." }), { status: 400 });
    }
    const stock = stockMap[variant.id];
    const available = stock ? stock.quantity - stock.reserved : 0;
    if (available < reqItem.quantity) {
      return new Response(JSON.stringify({
        error: `Onvoldoende voorraad voor ${variant.products.name}.`,
        variant_id: variant.id,
        available
      }), { status: 409 });
    }
    const unitPrice = variant.price_cents || variant.products.price_cents;
    const lineTotal = unitPrice * reqItem.quantity;
    subtotal += lineTotal;
    lineItems.push({
      variant_id: variant.id,
      product_id: variant.product_id,
      product_name: variant.products.name,
      variant_label: [variant.color, variant.size].filter(Boolean).join(" / "),
      sku: variant.sku,
      unit_price_cents: unitPrice,
      quantity: reqItem.quantity,
      total_cents: lineTotal
    });
  }
  const shipping = shippingCost(body.shipping.country, subtotal);
  const tax = 0;
  const total = subtotal + shipping + tax;
  for (const item of lineItems) {
    await sb.rpc("reserve_inventory", {
      v_id: item.variant_id,
      qty: item.quantity
    }).then(() => {
    }).catch(async () => {
      const cur = stockMap[item.variant_id];
      await sb.from("inventory").update({
        reserved: (cur?.reserved || 0) + item.quantity
      }).eq("variant_id", item.variant_id);
    });
  }
  const { data: orderNumberData } = await sb.rpc("generate_order_number");
  const orderNumber = orderNumberData || `VH-${(/* @__PURE__ */ new Date()).getFullYear()}-${Date.now().toString().slice(-5)}`;
  const { data: cust } = await sb.from("customers").upsert({
    email: body.customer.email,
    first_name: body.customer.first_name,
    last_name: body.customer.last_name,
    accepts_marketing: body.customer.accepts_marketing || false
  }, { onConflict: "email" }).select().single();
  const { data: order, error: orderErr } = await sb.from("orders").insert({
    order_number: orderNumber,
    customer_id: cust?.id,
    customer_email: body.customer.email,
    customer_name: `${body.customer.first_name} ${body.customer.last_name}`,
    subtotal_cents: subtotal,
    shipping_cents: shipping,
    tax_cents: tax,
    total_cents: total,
    shipping_address: body.shipping,
    billing_address: body.shipping
  }).select().single();
  if (orderErr || !order) {
    return new Response(JSON.stringify({ error: "Kon bestelling niet aanmaken." }), { status: 500 });
  }
  await sb.from("order_items").insert(
    lineItems.map((li) => ({ ...li, order_id: order.id }))
  );
  const siteUrl = "http://localhost:4321";
  const mollie = getMollie();
  const payment = await mollie.payments.create({
    amount: { currency: "EUR", value: (total / 100).toFixed(2) },
    description: `Villa Happ ${orderNumber}`,
    redirectUrl: `${siteUrl}/checkout/success?order=${order.order_number}`,
    cancelUrl: `${siteUrl}/checkout/cancelled?order=${order.order_number}`,
    webhookUrl: `${siteUrl}/api/checkout/webhook`,
    metadata: { order_id: order.id, order_number: order.order_number },
    locale: "nl_NL"
  });
  await sb.from("orders").update({
    mollie_payment_id: payment.id
  }).eq("id", order.id);
  return new Response(JSON.stringify({
    success: true,
    order_number: order.order_number,
    checkout_url: payment.getCheckoutUrl()
  }), {
    status: 200,
    headers: { "Content-Type": "application/json" }
  });
};

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  POST,
  prerender
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
