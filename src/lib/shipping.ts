/**
 * Villa Happ — Verzendtarieven (één bron, geen dependencies)
 *
 * Zowel het mandje in de browser als de checkout-API op de server rekenen
 * hiermee. Stonden eerder los van elkaar met hardgecodeerde bedragen,
 * waardoor een tariefwijziging het getoonde en het gerekende bedrag uit
 * elkaar kon laten lopen.
 *
 * Dit bestand blijft bewust vrij van imports: het gaat mee in de
 * clientbundle van élke pagina, en checkout-logic.ts (die zod gebruikt)
 * hoort daar niet in terecht te komen.
 */

export const FREE_SHIPPING_CENTS = 7500;

export const SHIPPING_RATES_CENTS: Record<string, number> = {
  NL: 495,
  BE: 695,
  DE: 895,
};

/** Onbekend land valt bewust op het hoogste tarief terug, nooit op het laagste. */
export function shippingCost(country: string, subtotalCents: number): number {
  if (subtotalCents >= FREE_SHIPPING_CENTS) return 0;
  return SHIPPING_RATES_CENTS[country] ?? SHIPPING_RATES_CENTS.DE;
}
