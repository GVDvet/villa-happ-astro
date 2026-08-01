/**
 * POST /api/newsletter
 * Body: { email: string }
 */

import type { APIRoute } from 'astro';
import { z } from 'zod';
import { getSupabaseAdmin } from '../../lib/supabase';
import { rateLimit, clientKey, tooManyRequests } from '../../lib/rate-limit';

export const prerender = false;

const Schema = z.object({
  email: z.email(),
  source: z.string().max(40).optional().default('footer'),
});

export const POST: APIRoute = async ({ request }) => {
  if (!rateLimit(clientKey(request, 'newsletter'), 5)) return tooManyRequests();

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
    // Geen database = niets opgeslagen. Eerder gaf deze tak success:true
    // met "Bedankt! Wij houden je op de hoogte", terwijl het adres nergens
    // terechtkwam. Nooit een inschrijving bevestigen die niet bestaat.
    console.warn('[newsletter] Geen database; inschrijving NIET opgeslagen voor:', body.email);
    return new Response(JSON.stringify({
      success: false,
      message: 'Inschrijven kan nog niet. Probeer het later opnieuw.',
    }), { status: 503 });
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
