/**
 * Villa Happ — Catalogus
 *
 * Eén interface voor de rest van de site: levert databaseproducten
 * zodra Supabase gekoppeld is, anders de demo-catalogus.
 * Draait op build-moment (alle shoppagina's zijn geprerenderd).
 */

import { getAllProducts, getProductVariants, getInventoryForVariants } from './commerce';
import { DEMO_PRODUCTS, type CatalogProduct } from './demo-products';

export type { CatalogProduct, CatalogVariant } from './demo-products';

export async function getCatalog(): Promise<CatalogProduct[]> {
  try {
    const dbProducts = await getAllProducts();
    if (!dbProducts.length) return DEMO_PRODUCTS;

    const catalog: CatalogProduct[] = [];
    for (const p of dbProducts) {
      const variants = await getProductVariants(p.id);
      const inventory = await getInventoryForVariants(variants.map((v) => v.id));
      catalog.push({
        slug: p.slug,
        name: p.name,
        color: variants[0]?.color || '',
        price_cents: p.price_cents,
        compare_at_cents: p.compare_at_cents,
        short_desc: p.short_desc || '',
        description: p.description || '',
        details: [],
        images: [p.image_url, ...(p.gallery || [])].filter(Boolean) as string[],
        badge: p.compare_at_cents ? 'Sale' : (p.featured ? 'Featured' : undefined),
        meta: p.category || '',
        variants: variants.map((v) => ({
          id: v.id,
          size: v.size || 'One size',
          stock: Math.max(0, (inventory[v.id]?.quantity || 0) - (inventory[v.id]?.reserved || 0)),
          sku: v.sku,
        })),
      });
    }
    return catalog;
  } catch {
    return DEMO_PRODUCTS;
  }
}

export async function getCatalogProduct(slug: string): Promise<CatalogProduct | undefined> {
  const catalog = await getCatalog();
  return catalog.find((p) => p.slug === slug);
}
