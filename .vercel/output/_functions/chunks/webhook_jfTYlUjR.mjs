import { g as getSupabaseAdmin } from './supabase_D6SjNLSm.mjs';
import { g as getMollie } from './mollie_D0WQo5lk.mjs';

const prerender = false;
const POST = async ({ request }) => {
  const sb = getSupabaseAdmin();
  if (!sb) return new Response("", { status: 503 });
  const text = await request.text();
  const params = new URLSearchParams(text);
  const paymentId = params.get("id");
  if (!paymentId) return new Response("", { status: 400 });
  const mollie = getMollie();
  const payment = await mollie.payments.get(paymentId);
  const { data: order } = await sb.from("orders").select("*, order_items(*)").eq("mollie_payment_id", paymentId).single();
  if (!order) return new Response("", { status: 404 });
  let newPaymentStatus = order.payment_status;
  let newOrderStatus = order.status;
  let paidAt = order.paid_at;
  switch (payment.status) {
    case "paid":
      newPaymentStatus = "paid";
      newOrderStatus = "paid";
      paidAt = (/* @__PURE__ */ new Date()).toISOString();
      for (const item of order.order_items || []) {
        await sb.rpc("finalize_inventory", { v_id: item.variant_id, qty: item.quantity }).then(() => null).catch(async () => {
          const { data: inv } = await sb.from("inventory").select("*").eq("variant_id", item.variant_id).single();
          if (inv) {
            await sb.from("inventory").update({
              quantity: Math.max(0, inv.quantity - item.quantity),
              reserved: Math.max(0, inv.reserved - item.quantity)
            }).eq("variant_id", item.variant_id);
          }
        });
      }
      break;
    case "failed":
    case "canceled":
    case "expired":
      newPaymentStatus = payment.status === "canceled" ? "failed" : payment.status;
      newOrderStatus = "cancelled";
      for (const item of order.order_items || []) {
        const { data: inv } = await sb.from("inventory").select("*").eq("variant_id", item.variant_id).single();
        if (inv) {
          await sb.from("inventory").update({
            reserved: Math.max(0, inv.reserved - item.quantity)
          }).eq("variant_id", item.variant_id);
        }
      }
      break;
    case "authorized":
      newPaymentStatus = "authorized";
      break;
    case "pending":
    case "open":
      newPaymentStatus = "open";
      break;
  }
  await sb.from("orders").update({
    payment_status: newPaymentStatus,
    status: newOrderStatus,
    paid_at: paidAt
  }).eq("id", order.id);
  return new Response("", { status: 200 });
};

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  POST,
  prerender
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
