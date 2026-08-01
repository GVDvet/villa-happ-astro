/**
 * Villa Happ — ordertijdlijn wegschrijven (server-only)
 *
 * Elke statuswijziging laat hier een spoor achter, zodat zowel beheer als de
 * klant kan zien hoe een bestelling verlopen is en niet alleen waar hij nu
 * staat. Append-only: een gebeurtenis wordt nooit bijgewerkt of verwijderd.
 *
 * Idempotent per soort: de database heeft een unieke index op
 * (order_id, soort) voor alles behalve 'opmerking'. Roept Mollie de webhook
 * twee keer aan, dan komt er dus geen tweede "betaald" in de tijdlijn.
 * Faalt het loggen, dan is dat nooit reden om de hoofdactie te laten
 * mislukken: een order die betaald is moet betaald blijven, ook als het
 * schrijven van de tijdlijnregel hapert.
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type { GebeurtenisSoort } from './order-status';

export async function logGebeurtenis(
  sb: SupabaseClient,
  orderId: string,
  soort: GebeurtenisSoort,
  opties: { toelichting?: string; meta?: Record<string, unknown>; bron?: 'systeem' | 'mollie' | 'beheer' } = {},
): Promise<void> {
  const { error } = await sb.from('order_events').insert({
    order_id: orderId,
    soort,
    toelichting: opties.toelichting ?? null,
    meta: opties.meta ?? null,
    bron: opties.bron ?? 'systeem',
  });

  // 23505 = de gebeurtenis stond er al. Dat is precies de bedoeling.
  if (error && error.code !== '23505') {
    console.error('[order-events] Loggen mislukte:', soort, error.message);
  }
}

export interface GebeurtenisRij {
  soort: GebeurtenisSoort;
  toelichting: string | null;
  bron: string;
  created_at: string;
}

export async function leesTijdlijn(sb: SupabaseClient, orderId: string): Promise<GebeurtenisRij[]> {
  const { data } = await sb
    .from('order_events')
    .select('soort, toelichting, bron, created_at')
    .eq('order_id', orderId)
    .order('created_at', { ascending: true });
  return (data as GebeurtenisRij[]) || [];
}
