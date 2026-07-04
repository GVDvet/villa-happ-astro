/**
 * POST /api/notify — back-in-stock melding
 * Body: { slug, size, email }
 *
 * Zonder database 503; de PDP valt dan terug op localStorage.
 */

import type { APIRoute } from 'astro';
import { z } from 'zod';
import { getSupabaseAdmin } from '../../lib/supabase';
import { rateLimit, clientKey, tooManyRequests } from '../../lib/rate-limit';

export const prerender = false;

const Schema = z.object({
  slug: z.string().min(1).max(80).regex(/^[a-z0-9-]+$/),
  size: z.string().max(20).optional().default(''),
  email: z.email(),
});

export const POST: APIRoute = async ({ request }) => {
  if (!rateLimit(clientKey(request, 'notify'), 5)) return tooManyRequests();

  const sb = getSupabaseAdmin();
  if (!sb) return new Response(JSON.stringify({ error: 'no-db' }), { status: 503 });

  let body;
  try {
    body = Schema.parse(await request.json());
  } catch {
    return new Response(JSON.stringify({ error: 'Vul een geldig e-mailadres in.' }), { status: 400 });
  }

  const { error } = await sb.from('back_in_stock').upsert({
    product_slug: body.slug,
    size: body.size,
    email: body.email,
  }, { onConflict: 'product_slug,size,email' });

  if (error) return new Response(JSON.stringify({ error: 'Opslaan mislukte.' }), { status: 500 });

  return new Response(JSON.stringify({ success: true }), {
    headers: { 'Content-Type': 'application/json' },
  });
};
