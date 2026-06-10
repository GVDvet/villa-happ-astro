import { z } from 'zod';
import { g as getSupabaseAdmin } from './supabase_D6SjNLSm.mjs';

const prerender = false;
const Schema = z.object({
  email: z.string().email(),
  source: z.string().optional().default("footer")
});
const POST = async ({ request }) => {
  let body;
  try {
    body = Schema.parse(await request.json());
  } catch {
    return new Response(JSON.stringify({
      success: false,
      message: "Vul een geldig e-mailadres in."
    }), { status: 400 });
  }
  const sb = getSupabaseAdmin();
  if (!sb) {
    console.warn("[newsletter] No DB, would have subscribed:", body.email);
    return new Response(JSON.stringify({
      success: true,
      message: "Bedankt! Wij houden je op de hoogte."
    }));
  }
  const { error } = await sb.from("newsletter_subscribers").upsert({
    email: body.email,
    source: body.source
  }, { onConflict: "email" });
  if (error) {
    return new Response(JSON.stringify({
      success: false,
      message: "Er ging iets mis. Probeer opnieuw."
    }), { status: 500 });
  }
  return new Response(JSON.stringify({
    success: true,
    message: "Bedankt voor je inschrijving!"
  }));
};

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  POST,
  prerender
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
