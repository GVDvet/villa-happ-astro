/**
 * Villa Happ — Demo-catalogus
 *
 * Gebruikt zolang Supabase nog niet is gekoppeld. Zodra er echte
 * producten in de database staan, nemen die het over (zie catalog.ts).
 * Variant-ids beginnen met 'demo-': de checkout herkent dit en toont
 * een demo-melding in plaats van een echte Mollie-betaling te starten.
 */

export interface CatalogVariant {
  id: string;
  size: string;
  stock: number;
  sku: string;
}

export interface CatalogProduct {
  slug: string;
  name: string;
  color: string;
  price_cents: number;
  compare_at_cents?: number;
  short_desc: string;
  description: string;
  details: string[];
  images: string[];
  badge?: string;
  meta: string;
  variants: CatalogVariant[];
}

export const DEMO_PRODUCTS: CatalogProduct[] = [
  {
    slug: 'heritage-hoodie-grey',
    name: 'Heritage Hoodie',
    color: 'Heather Grey',
    price_cents: 12900,
    short_desc: '350gsm brushed cotton hoodie met geborduurd Villa Happ embleem.',
    description:
      'De Heritage Hoodie is het eerste stuk van de derde generatie. Gemaakt van 350gsm brushed cotton fleece, voorgewassen voor een gedragen gevoel vanaf dag één. Het Villa Happ embleem is geborduurd, niet geprint, precies zoals op de originelen uit het archief.',
    details: [
      '350gsm brushed cotton fleece',
      'Geborduurd embleem op borst en rug',
      'Voorgewassen, oversized fit',
      'Genummerde oplage · certificaat van echtheid',
      'Ontworpen in Tilburg',
    ],
    images: [
      '/img/products/hoodie-grey-front.webp',
      '/img/products/hoodie-grey-back.webp',
      '/img/products/hoodie-grey-lifestyle.webp',
      '/img/products/hoodie-logo-detail.webp',
    ],
    badge: 'Nieuw',
    meta: 'Heather Grey · Unisex',
    variants: [
      { id: 'demo-grey-s', size: 'S', stock: 8, sku: 'VH-HG-S' },
      { id: 'demo-grey-m', size: 'M', stock: 12, sku: 'VH-HG-M' },
      { id: 'demo-grey-l', size: 'L', stock: 6, sku: 'VH-HG-L' },
      { id: 'demo-grey-xl', size: 'XL', stock: 0, sku: 'VH-HG-XL' },
    ],
  },
  {
    slug: 'heritage-hoodie-blue',
    name: 'Heritage Hoodie',
    color: 'Tilburg Blue',
    price_cents: 12900,
    short_desc: 'Dezelfde 350gsm hoodie, in de blauwtint van het originele winkellogo.',
    description:
      'Tilburg Blue is een kleur uit het archief: de tint van het originele winkellogo uit 1999. Dezelfde 350gsm brushed cotton kwaliteit, hetzelfde geborduurde embleem, een kleur die je nergens anders vindt.',
    details: [
      '350gsm brushed cotton fleece',
      'Archiefkleur: Tilburg Blue (1999)',
      'Geborduurd embleem op borst',
      'Genummerde oplage · certificaat van echtheid',
      'Ontworpen in Tilburg',
    ],
    images: [
      '/img/products/hoodie-blue-front.webp',
      '/img/products/hoodie-blue-lifestyle.webp',
    ],
    meta: 'Tilburg Blue · Unisex',
    variants: [
      { id: 'demo-blue-s', size: 'S', stock: 4, sku: 'VH-HB-S' },
      { id: 'demo-blue-m', size: 'M', stock: 2, sku: 'VH-HB-M' },
      { id: 'demo-blue-l', size: 'L', stock: 9, sku: 'VH-HB-L' },
      { id: 'demo-blue-xl', size: 'XL', stock: 5, sku: 'VH-HB-XL' },
    ],
  },
  {
    slug: 'heritage-hoodie-unisex',
    name: 'Heritage Hoodie Oversized',
    color: 'Heather Grey',
    price_cents: 13900,
    short_desc: 'De oversized variant: langer, wijder, zwaarder. Voor wie ruimte draagt.',
    description:
      'De Oversized neemt de Heritage Hoodie en geeft hem meer van alles: een langere body, een wijdere schouder en een zwaardere 400gsm fleece. Het silhouet van nu, gemaakt met de kwaliteit van toen.',
    details: [
      '400gsm heavyweight fleece',
      'Dropped shoulder, langere body',
      'Geborduurd embleem op borst en rug',
      'Genummerde oplage · certificaat van echtheid',
      'Ontworpen in Tilburg',
    ],
    images: [
      '/img/products/hoodie-grey-lifestyle.webp',
      '/img/products/hoodie-grey-new2.webp',
      '/img/products/hoodie-grey-back.webp',
    ],
    badge: 'Bestseller',
    meta: 'Oversized fit · Unisex',
    variants: [
      { id: 'demo-uni-s', size: 'S', stock: 3, sku: 'VH-HO-S' },
      { id: 'demo-uni-m', size: 'M', stock: 7, sku: 'VH-HO-M' },
      { id: 'demo-uni-l', size: 'L', stock: 7, sku: 'VH-HO-L' },
      { id: 'demo-uni-xl', size: 'XL', stock: 2, sku: 'VH-HO-XL' },
    ],
  },
];

export function getDemoProduct(slug: string): CatalogProduct | undefined {
  return DEMO_PRODUCTS.find((p) => p.slug === slug);
}
