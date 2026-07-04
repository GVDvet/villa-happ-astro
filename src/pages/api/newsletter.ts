/**
 * POST /api/newsletter
 * Body: { email: string }
 */

import type { APIRoute } from 'astro';
import { z } from 'zod';
import { getSupabaseAdmin } from '../../lib/supabase';

export const prerender = false;

const Schema = z.object({
  email: z.email(),
  source: z.string().optional().default('footer'),
});

export const POST: APIRoute = async ({ request }) => {
  let body;
  try {
    body = Schema.parse(await request.json());
  } catch {
    return new Response(JSON.stringify({
      success: false,
      message: 'Vul een geldig e-mailadres in.',
    }), { status: 400 });
  }

  const sb = getSupabaseAdmin();
  if (!sb) {
    // Geen DB: fail silently maar log
    console.warn('[newsletter] No DB, would have subscribed:', body.email);
    return new Response(JSON.stringify({
      success: true,
      message: 'Bedankt! Wij houden je op de hoogte.',
    }));
  }

  const { error } = await sb.from('newsletter_subscribers').upsert({
    email: body.email,
    source: body.source,
  }, { onConflict: 'email' });

  if (error) {
    return new Response(JSON.stringify({
      success: false,
      message: 'Er ging iets mis. Probeer opnieuw.',
    }), { status: 500 });
  }

  return new Response(JSON.stringify({
    success: true,
    message: 'Bedankt voor je inschrijving!',
  }));
};
