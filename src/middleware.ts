/**
 * Herkomstcontrole op elk verzoek.
 *
 * Vervangt Astro's `security.checkOrigin`, dat in astro.config.mjs uit staat.
 * Zie src/lib/origin-check.ts voor de reden: die van Astro kent geen
 * uitzonderingen en blokkeerde daardoor de Mollie-webhook.
 */

import { defineMiddleware } from 'astro:middleware';
import { magDoor } from './lib/origin-check';

export const onRequest = defineMiddleware((context, next) => {
  const { request } = context;

  const toegestaan = magDoor({
    methode: request.method,
    pad: new URL(request.url).pathname,
    origin: request.headers.get('origin'),
    host: request.headers.get('host'),
    contentType: request.headers.get('content-type'),
  });

  if (!toegestaan) {
    return new Response('Cross-site POST form submissions are forbidden', {
      status: 403,
      headers: { 'Cache-Control': 'no-store' },
    });
  }

  return next();
});
