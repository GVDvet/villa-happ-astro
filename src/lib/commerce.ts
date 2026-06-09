/**
 * Villa Happ — Commerce helpers
 *
 * Public queries: producten ophalen, voorraad checks.
 * Server-only: order creation, inventory mutations (zie api/checkout/*).
 */

import { getSupabase } from './supabase';
import type { Product, Drop, ProductVariant, InventoryRow } from './types';

/**
 * Featured / nieuwste producten voor homepage shop-preview.
 */
export async function getFeaturedProducts(limit = 3): Promise<Product[]> {
  const sb = getSupabase();
  if (!sb) return [];
  const { data, error } = await sb
    .from('products')
    .select('*')
    .eq('status', 'published')
    .eq('featured', true)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    // Fallback: gewoon de nieuwste
    const fb = await sb
      .from('products')
      .select('*')
      .eq('status', 'published')
      .order('created_at', { ascending: false })
      .limit(limit);
    return (fb.data as Product[]) || [];
  }
  return (data as Product[]) || [];
}

export async function getAllProducts(): Promise<Product[]> {
  const sb = getSupabase();
  if (!sb) return [];
  const { data } = await sb
    .from('products')
    .select('*')
    .eq('status', 'published')
    .order('created_at', { ascending: false });
  return (data as Product[]) || [];
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  const sb = getSupabase();
  if (!sb) return null;
  const { data } = await sb
    .from('products')
    .select('*')
    .eq('slug', slug)
    .eq('status', 'published')
    .single();
  return (data as Product) || null;
}

export async function getProductVariants(productId: string): Promise<ProductVariant[]> {
  const sb = getSupabase();
  if (!sb) return [];
  const { data } = await sb
    .from('product_variants')
    .select('*')
    .eq('product_id', productId);
  return (data as ProductVariant[]) || [];
}

export async function getInventoryForVariants(variantIds: string[]): Promise<Record<string, InventoryRow>> {
  const sb = getSupabase();
  if (!sb || variantIds.length === 0) return {};
  const { data } = await sb
    .from('inventory')
    .select('*')
    .in('variant_id', variantIds);

  const map: Record<string, InventoryRow> = {};
  for (const row of (data as InventoryRow[]) || []) {
    map[row.variant_id] = row;
  }
  return map;
}

/**
 * Actieve drop (live of coming-soon) voor homepage interlude.
 */
export async function getActiveDrop(): Promise<Drop | null> {
  const sb = getSupabase();
  if (!sb) return null;
  const { data } = await sb
    .from('drops')
    .select('*')
    .in('status', ['live', 'coming-soon'])
    .order('launch_date', { ascending: true })
    .limit(1)
    .single();
  return (data as Drop) || null;
}

export async function getAllDrops(): Promise<Drop[]> {
  const sb = getSupabase();
  if (!sb) return [];
  const { data } = await sb
    .from('drops')
    .select('*')
    .in('status', ['live', 'coming-soon', 'sold-out'])
    .order('launch_date', { ascending: false });
  return (data as Drop[]) || [];
}

/**
 * Currency formatting helper.
 */
export function formatPrice(cents: number, currency = 'EUR'): string {
  return new Intl.NumberFormat('nl-NL', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(cents / 100);
}
