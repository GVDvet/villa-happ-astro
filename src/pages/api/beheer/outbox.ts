/**
 * POST /api/beheer/outbox — wachtende mail nu verwerken
 *
 * Vercel Hobby staat één cron per dag toe, en een orderbevestiging kan niet
 * een dag wachten. De outbox probeert daarom meteen te versturen; blijft er
 * iets hangen, dan is dit de knop om het alsnog te doen zonder op de cron te
 * wachten.
 */
import type { APIRoute } from 'astro';
import { vereisSessie } from '../../../lib/beheer';
import { controleerCsrf } from '../../../lib/beheer-sessie';
import { verwerkWachtrij } from '../../../lib/outbox';

export const prerender = false;

export const POST: APIRoute = async (ctx) => {
  const sessie = vereisSessie(ctx);
  if (!sessie.ok) return sessie.respons;

  const csrf = new URL(ctx.request.url).searchParams.get('csrf') || '';
  if (!controleerCsrf(sessie.sessieCookie, csrf)) {
    return new Response(JSON.stringify({ error: 'Sessie verlopen.' }), {
      status: 403, headers: { 'Content-Type': 'application/json' },
    });
  }

  const uitslag = await verwerkWachtrij();
  return new Response(JSON.stringify(uitslag), {
    status: 200,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  });
};
