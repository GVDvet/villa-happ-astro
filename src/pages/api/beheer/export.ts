/**
 * GET /api/beheer/export?vanaf=YYYY-MM-DD — orderregels als CSV
 *
 * Eén regel per orderregel, zodat je in een spreadsheet per product kunt
 * optellen. Bedragen in euro's met een komma, want dit bestand gaat naar
 * Excel met een Nederlandse locale.
 */
import type { APIRoute } from 'astro';
import { vereisBeheer, leesExport } from '../../../lib/beheer';

export const prerender = false;

/** RFC 4180: dubbele quotes verdubbelen, alles tussen quotes. */
function veld(waarde: unknown): string {
  const s = waarde === null || waarde === undefined ? '' : String(waarde);
  return `"${s.replace(/"/g, '""')}"`;
}

const eur = (c: number) => (c / 100).toFixed(2).replace('.', ',');

export const GET: APIRoute = async (ctx) => {
  const poort = vereisBeheer(ctx);
  if (!poort.ok) return poort.respons;

  const vanaf = ctx.url.searchParams.get('vanaf') || undefined;
  const orders = await leesExport(poort.context.sb, vanaf);

  const kop = [
    'Bestelnummer', 'Datum', 'Status', 'Betaalstatus', 'Klant', 'E-mail',
    'Product', 'Variant', 'SKU', 'Aantal', 'Stukprijs', 'Regeltotaal',
    'Verzendkosten', 'Ordertotaal', 'Terugbetaald', 'Postcode', 'Plaats', 'Land', 'Track en trace',
  ];

  const regels: string[] = [kop.map(veld).join(';')];
  for (const o of orders as any[]) {
    const a = o.shipping_address || {};
    for (const r of o.order_items || []) {
      regels.push([
        o.order_number, String(o.created_at).slice(0, 10), o.status, o.payment_status,
        o.customer_name, o.customer_email,
        r.product_name, r.variant_label, r.sku, r.quantity,
        eur(r.unit_price_cents), eur(r.total_cents),
        eur(o.shipping_cents), eur(o.total_cents), eur(o.refunded_cents || 0),
        a.postal_code, a.city, a.country, o.tracking_number,
      ].map(veld).join(';'));
    }
  }

  const datum = new Date().toISOString().slice(0, 10);
  return new Response('﻿' + regels.join('\r\n'), {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="villa-happ-orders-${datum}.csv"`,
      'Cache-Control': 'private, no-store',
    },
  });
};
