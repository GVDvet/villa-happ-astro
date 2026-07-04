/**
 * Villa Happ — Voorraadmutaties (server-only)
 *
 * Primair via de atomaire Postgres-functies (zie
 * supabase/migrations/20260704_inventory_functions.sql). Draait de
 * database nog zonder die functies, dan valt elke helper terug op een
 * optimistic-concurrency update: de UPDATE matcht alleen als de rij
 * sindsdien niet is gewijzigd, anders geldt de mutatie als mislukt.
 *
 * Let op: supabase-js rejects nooit; fouten zitten in `error`. Check
 * dus altijd het error-veld, nooit try/catch rond de rpc-call.
 */

import type { SupabaseClient } from '@supabase/supabase-js';

async function rpcBool(sb: SupabaseClient, fn: string, variantId: string, qty: number): Promise<boolean | null> {
  const { data, error } = await sb.rpc(fn, { v_id: variantId, qty });
  if (error) return null; // functie ontbreekt of faalde: caller pakt de fallback
  return data === true;
}

async function readInventory(sb: SupabaseClient, variantId: string) {
  const { data } = await sb.from('inventory').select('*').eq('variant_id', variantId).single();
  return data as { variant_id: string; quantity: number; reserved: number } | null;
}

/** Compare-and-swap: alleen bijwerken als `reserved` nog de gelezen waarde heeft. */
async function casUpdate(
  sb: SupabaseClient,
  variantId: string,
  expectedReserved: number,
  patch: { quantity?: number; reserved: number },
): Promise<boolean> {
  const { data } = await sb
    .from('inventory')
    .update(patch)
    .eq('variant_id', variantId)
    .eq('reserved', expectedReserved)
    .select('variant_id');
  return Array.isArray(data) && data.length > 0;
}

/** Reserveer voorraad. TRUE = gelukt, FALSE = onvoldoende vrije voorraad. */
export async function reserveInventory(sb: SupabaseClient, variantId: string, qty: number): Promise<boolean> {
  const viaRpc = await rpcBool(sb, 'reserve_inventory', variantId, qty);
  if (viaRpc !== null) return viaRpc;

  const inv = await readInventory(sb, variantId);
  if (!inv || inv.quantity - inv.reserved < qty) return false;
  return casUpdate(sb, variantId, inv.reserved, { reserved: inv.reserved + qty });
}

/** Zet een reservering om in een verkoop (na betaling). */
export async function finalizeInventory(sb: SupabaseClient, variantId: string, qty: number): Promise<boolean> {
  const viaRpc = await rpcBool(sb, 'finalize_inventory', variantId, qty);
  if (viaRpc !== null) return viaRpc;

  const inv = await readInventory(sb, variantId);
  if (!inv) return false;
  return casUpdate(sb, variantId, inv.reserved, {
    quantity: Math.max(0, inv.quantity - qty),
    reserved: Math.max(0, inv.reserved - qty),
  });
}

/** Geef een reservering vrij (betaling mislukt, verlopen of geannuleerd). */
export async function releaseInventory(sb: SupabaseClient, variantId: string, qty: number): Promise<boolean> {
  const viaRpc = await rpcBool(sb, 'release_inventory', variantId, qty);
  if (viaRpc !== null) return viaRpc;

  const inv = await readInventory(sb, variantId);
  if (!inv) return false;
  return casUpdate(sb, variantId, inv.reserved, { reserved: Math.max(0, inv.reserved - qty) });
}
