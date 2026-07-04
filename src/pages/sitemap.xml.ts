import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { getCatalog } from '../lib/catalog';
import { getSiteOrigin } from '../lib/site';

export const prerender = true;

// Indexeerbare routes (transactiepagina's bewust weggelaten)
const staticRoutes = ['', 'shop', 'story', 'drops', 'brands', 'journal', 'faq', 'verzending', 'retourneren', 'contact'];

export const GET: APIRoute = async () => {
  const site = getSiteOrigin();
  const catalog = await getCatalog();
  const posts = await getCollection('journal');
  const lastmod = new Date().toISOString().slice(0, 10); // build-datum
  const urls = [
    ...staticRoutes.map((r) => `${site}/${r}`),
    ...catalog.map((p) => `${site}/shop/${p.slug}`),
    ...posts.map((p) => `${site}/journal/${p.id}`),
  ];
  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((u) => `  <url><loc>${u}</loc><lastmod>${lastmod}</lastmod></url>`).join('\n')}
</urlset>`;
  return new Response(body, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
};
