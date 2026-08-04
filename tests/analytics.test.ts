import { describe, it, expect, beforeEach, vi } from 'vitest';

/**
 * Het dataLayer-contract. Wat hier fout gaat, gaat stil fout: GA4 accepteert
 * vrijwel elke payload en je merkt pas weken later dat je omzet dubbel telt
 * of dat er persoonsgegevens in staan.
 */

function resetOmgeving() {
  const g = globalThis as any;
  g.window = g;
  g.dataLayer = [];
}

async function laad() {
  vi.resetModules();
  return import('../src/lib/analytics');
}

const dl = () => (globalThis as any).dataLayer as any[];
const events = () => dl().filter((x) => x && x.event);

beforeEach(resetOmgeving);

describe('bedragen', () => {
  it('rekent centen om naar euros, niet andersom', async () => {
    const { trackViewItem } = await laad();
    trackViewItem({ item_id: 'cap', item_name: 'Back-Cap', price_cents: 2195 });
    const e = events()[0];
    expect(e.ecommerce.value).toBe(21.95);
    expect(e.ecommerce.items[0].price).toBe(21.95);
    expect(e.ecommerce.currency).toBe('EUR');
  });

  it('telt aantallen mee in de waarde', async () => {
    const { trackAddToCart } = await laad();
    trackAddToCart({ item_id: 'hoodie', item_name: 'Hoodie', price_cents: 5995, quantity: 3 });
    expect(events()[0].ecommerce.value).toBe(179.85);
  });
});

describe('ecommerce leegmaken', () => {
  it('zet ecommerce op null vóór elk event', async () => {
    // Zonder dit voegt GA4 de items van een vorig event samen met het
    // huidige, en bevat een add_to_cart ineens ook het vorige stuk.
    const { trackViewItem, trackAddToCart } = await laad();
    trackViewItem({ item_id: 'a', item_name: 'A', price_cents: 100 });
    trackAddToCart({ item_id: 'b', item_name: 'B', price_cents: 200 });
    const nulls = dl().filter((x) => x && x.ecommerce === null);
    expect(nulls.length).toBe(2);
    const laatste = events()[1];
    expect(laatste.ecommerce.items).toHaveLength(1);
    expect(laatste.ecommerce.items[0].item_id).toBe('b');
  });
});

describe('purchase', () => {
  const order = {
    orderNumber: 'VH-2026-00042',
    totalCents: 6890,
    shippingCents: 895,
    items: [{ item_id: 'cap', item_name: 'Back-Cap', price_cents: 2195, quantity: 1 }],
  };

  it('gebruikt het bestelnummer als transaction_id', async () => {
    const { trackPurchase } = await laad();
    trackPurchase(order);
    const e = events()[0];
    expect(e.event).toBe('purchase');
    expect(e.ecommerce.transaction_id).toBe('VH-2026-00042');
    expect(e.ecommerce.value).toBe(68.9);
    expect(e.ecommerce.shipping).toBe(8.95);
  });

  it('vuurt niet zonder bestelnummer', async () => {
    // Een purchase zonder transaction_id kan GA4 niet ontdubbelen, dus dan
    // telt elke reload van de bedanktpagina als een nieuwe aankoop.
    const { trackPurchase } = await laad();
    trackPurchase({ ...order, orderNumber: '' });
    expect(events()).toHaveLength(0);
  });
});

describe('begin_checkout', () => {
  it('vuurt niet bij een leeg mandje', async () => {
    const { trackBeginCheckout } = await laad();
    trackBeginCheckout([]);
    expect(events()).toHaveLength(0);
  });
});

describe('generate_lead', () => {
  it('onderscheidt contact van merkaanmelding', async () => {
    const { trackGenerateLead } = await laad();
    trackGenerateLead('merkaanmelding');
    expect(events()[0]).toMatchObject({ event: 'generate_lead', lead_type: 'merkaanmelding' });
  });
});

describe('geen persoonsgegevens', () => {
  it('draagt in geen enkel event een e-mail-, naam- of adresveld', async () => {
    const a = await laad();
    a.trackViewItem({ item_id: 'cap', item_name: 'Back-Cap', price_cents: 2195 });
    a.trackAddToCart({ item_id: 'cap', item_name: 'Back-Cap', price_cents: 2195 });
    a.trackBeginCheckout([{ item_id: 'cap', item_name: 'Back-Cap', price_cents: 2195 }]);
    a.trackPurchase({ orderNumber: 'VH-1', totalCents: 2195 });
    a.trackGenerateLead('contact');
    a.trackPageView('/shop', 'Shop');

    const verboden = /email|e_mail|mail|naam|name_|phone|telefoon|adres|address|postcode|postal/i;
    const velden: string[] = [];
    const loop = (o: any) => {
      if (!o || typeof o !== 'object') return;
      for (const [k, v] of Object.entries(o)) {
        velden.push(k);
        loop(v);
      }
    };
    dl().forEach(loop);

    // item_name en page_title mogen, die bevatten geen persoonsgegevens.
    const raak = velden.filter((v) => verboden.test(v) && !['item_name', 'page_title'].includes(v));
    expect(raak).toEqual([]);
  });
});
