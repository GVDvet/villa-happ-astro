import type { APIRoute } from 'astro';
import { getSiteOrigin, isPreviewHost } from '../lib/site';

export const prerender = true;

export const GET: APIRoute = () => {
  const origin = getSiteOrigin();

  // Preview (*.vercel.app): volledig buiten de index houden, anders
  // concurreert deze omgeving met de echte site op villa-happ.nl.
  const body = isPreviewHost(origin)
    ? `User-agent: *\nDisallow: /\n`
    : `User-agent: *\nAllow: /\nDisallow: /checkout\nDisallow: /cart\nDisallow: /wishlist\nDisallow: /api/\n\nSitemap: ${origin}/sitemap.xml\n`;

  return new Response(body, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
};
