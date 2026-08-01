/**
 * POST /api/beheer/actie — statusacties op een bestelling
 *
 * Body: { orderId, actie, csrf, ... }
 *   verzenden    → { tracking, carrier? }   zet op verzonden + mailt track en trace
 *   bezorgd      → {}                        zet op bezorgd
 *   terugbetalen → { bedragCents }           registreert een terugbetaling
 *   notitie      → { tekst }                 losse aantekening op de tijdlijn
 *
 * Drie poorten voor elke actie:
 *  1. sessie (vereisBeheer, 404 bij afwijzing);
 *  2. CSRF-token dat aan die sessie hangt;
 *  3. `magActie()` uit de domeinlaag, dezelfde functie die bepaalt welke
 *     knoppen de UI toont. Je kunt een actie dus niet forceren door de knop
 *     te omzeilen: een niet-betaalde order valt hier alsnog af.
 *
 * De terugbetaling wordt hier alleen geregistreerd, niet uitgevoerd. Geld
 * terugstorten gebeurt in Mollie; dat blijft een bewuste handeling in de
 * betaalomgeving zelf. Verwerkt Mollie de refund, dan komt hij via de
 * webhook alsnog binnen en telt deze registratie niet dubbel (zelfde
 * bedrag, zelfde dedupe-sleutel op de mail).
 */

import type { APIRoute } from 'astro';
import { z } from 'zod';
import { vereisSessie, vereisDatabase } from '../../../lib/beheer';
import { controleerCsrf } from '../../../lib/beheer-sessie';
import { magActie } from '../../../lib/order-status';
import { logGebeurtenis } from '../../../lib/order-events';
import { zetInWachtrij } from '../../../lib/outbox';
import { renderShippingConfirmation, renderTerugbetaling } from '../../../lib/mail';
import { maakOrderToken } from '../../../lib/order-token';
import { getSiteOrigin } from '../../../lib/site';

export const prerender = false;

const Schema = z.object({
  orderId: z.uuid(),
  actie: z.enum(['verzenden', 'bezorgd', 'terugbetalen', 'notitie']),
  csrf: z.string().min(16),
  tracking: z.string().min(4).max(40).optional(),
  carrier: z.string().max(30).optional(),
  bedragCents: z.number().int().min(1).optional(),
  tekst: z.string().min(1).max(500).optional(),
});

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  });

export const POST: APIRoute = async (ctx) => {
  // Volgorde: sessie, dan CSRF, dan pas de database.
  const sessie = vereisSessie(ctx);
  if (!sessie.ok) return sessie.respons;
  const { sessieCookie } = sessie;

  let body;
  try {
    body = Schema.parse(await ctx.request.json());
  } catch {
    return json({ error: 'Ongeldig verzoek.' }, 400);
  }

  if (!controleerCsrf(sessieCookie, body.csrf)) {
    return json({ error: 'Sessie verlopen. Laad de pagina opnieuw.' }, 403);
  }

  const db = vereisDatabase();
  if (!db.ok) return db.respons;
  const { sb } = db;

  const { data: order } = await sb
    .from('orders')
    .select('id, order_number, status, payment_status, customer_email, customer_name, total_cents, refunded_cents, shipping_address')
    .eq('id', body.orderId)
    .maybeSingle();

  if (!order) return json({ error: 'Bestelling niet gevonden.' }, 404);

  const origin = getSiteOrigin();
  const portaalUrl = `${origin}/bestelling/${maakOrderToken(order.id, 'portaal')}`;
  const nu = new Date().toISOString();

  /* ---------- Notitie ---------- */
  if (body.actie === 'notitie') {
    if (!body.tekst) return json({ error: 'Notitie is leeg.' }, 400);
    await logGebeurtenis(sb, order.id, 'opmerking', { bron: 'beheer', toelichting: body.tekst });
    return json({ success: true });
  }

  // Vanaf hier gelden de overgangsregels uit de domeinlaag.
  if (!magActie(order.status, order.payment_status, body.actie)) {
    return json(
      { error: `Deze actie kan niet bij status "${order.status}".` },
      409,
    );
  }

  /* ---------- Verzonden ---------- */
  if (body.actie === 'verzenden') {
    if (!body.tracking) return json({ error: 'Vul een track en trace-code in.' }, 400);
    const carrier = body.carrier || 'PostNL';

    const { error } = await sb.from('orders').update({
      status: 'shipped',
      shipped_at: nu,
      tracking_number: body.tracking,
      tracking_carrier: carrier,
    }).eq('id', order.id);
    if (error) return json({ error: 'Bijwerken mislukte.' }, 500);

    await logGebeurtenis(sb, order.id, 'verzonden', {
      bron: 'beheer',
      toelichting: `${carrier} ${body.tracking}`,
      meta: { tracking: body.tracking, carrier },
    });

    const mail = renderShippingConfirmation({
      order_number: order.order_number,
      customer_email: order.customer_email,
      customer_name: order.customer_name,
      tracking_number: body.tracking,
      tracking_carrier: carrier,
      shipping_address: order.shipping_address,
      portaalUrl,
    });
    await zetInWachtrij({
      soort: 'verzendbevestiging',
      ontvanger: order.customer_email,
      onderwerp: mail.subject,
      html: mail.html,
      dedupeSleutel: `verzending:${order.id}:${body.tracking}`,
    });

    return json({ success: true, status: 'shipped' });
  }

  /* ---------- Bezorgd ---------- */
  if (body.actie === 'bezorgd') {
    const { error } = await sb.from('orders')
      .update({ status: 'delivered', delivered_at: nu })
      .eq('id', order.id);
    if (error) return json({ error: 'Bijwerken mislukte.' }, 500);

    await logGebeurtenis(sb, order.id, 'bezorgd', { bron: 'beheer' });
    // Bewust geen mail: de klant weet zelf dat het pakket er is. Een mail
    // met "je pakket is bezorgd" nadat hij het heeft uitgepakt is ruis.
    return json({ success: true, status: 'delivered' });
  }

  /* ---------- Terugbetaald ---------- */
  const bedrag = body.bedragCents ?? order.total_cents;
  const alTerug = order.refunded_cents || 0;
  if (bedrag + alTerug > order.total_cents) {
    return json({ error: 'Meer terugbetalen dan er betaald is kan niet.' }, 400);
  }
  const totaalTerug = alTerug + bedrag;
  const volledig = totaalTerug >= order.total_cents;

  const { error } = await sb.from('orders').update({
    refunded_cents: totaalTerug,
    refunded_at: nu,
    ...(volledig ? { status: 'refunded', payment_status: 'refunded' } : {}),
  }).eq('id', order.id);
  if (error) return json({ error: 'Bijwerken mislukte.' }, 500);

  await logGebeurtenis(sb, order.id, 'terugbetaald', {
    bron: 'beheer',
    toelichting: volledig ? 'Volledig terugbetaald' : 'Gedeeltelijk terugbetaald',
    meta: { bedrag_cents: totaalTerug },
  });

  const mail = renderTerugbetaling(order.order_number, order.customer_name, totaalTerug, volledig);
  await zetInWachtrij({
    soort: 'terugbetaling',
    ontvanger: order.customer_email,
    onderwerp: mail.subject,
    html: mail.html,
    dedupeSleutel: `terugbetaling:${order.id}:${totaalTerug}`,
  });

  return json({ success: true, status: volledig ? 'refunded' : order.status });
};
