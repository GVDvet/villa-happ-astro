/**
 * Villa Happ — Checkout-logica (puur, testbaar)
 *
 * Geen I/O in dit bestand: alleen berekeningen en statusovergangen.
 * De API-routes (api/checkout/*) importeren dit; de unit tests ook.
 */

import { z } from 'zod';

export const FREE_SHIPPING_CENTS = 7500;

export const SHIPPING_RATES_CENTS: Record<string, number> = {
  NL: 495,
  BE: 695,
  DE: 895,
};

export function shippingCost(country: string, subtotalCents: number): number {
  if (subtotalCents >= FREE_SHIPPING_CENTS) return 0;
  return SHIPPING_RATES_CENTS[country] ?? SHIPPING_RATES_CENTS.DE;
}

export const CheckoutSchema = z.object({
  items: z.array(z.object({
    variant_id: z.string().uuid(),
    quantity: z.number().int().min(1).max(20),
  })).min(1).max(30),
  customer: z.object({
    email: z.string().email(),
    first_name: z.string().min(1).max(80),
    last_name: z.string().min(1).max(80),
    accepts_marketing: z.boolean().optional(),
  }),
  shipping: z.object({
    street: z.string().min(1).max(120),
    house_number: z.string().min(1).max(20),
    postal_code: z.string().min(1).max(12),
    city: z.string().min(1).max(80),
    country: z.enum(['NL', 'BE', 'DE']).default('NL'),
    phone: z.string().max(30).optional(),
  }),
});

export type CheckoutPayload = z.infer<typeof CheckoutSchema>;

/**
 * Vertaal een Mollie-paymentstatus naar de gewenste orderstatus plus
 * de voorraadactie. Idempotent: een order die al 'paid' is verandert
 * nooit meer en levert nooit een tweede voorraadmutatie op (Mollie
 * mag de webhook meermaals aanroepen).
 */
export type InventoryAction = 'finalize' | 'release' | 'none';

export interface StatusTransition {
  payment_status: string;
  status: string;
  action: InventoryAction;
  markPaidAt: boolean;
}

export function mapMollieStatus(
  mollieStatus: string,
  current: { payment_status: string; status: string },
): StatusTransition {
  const unchanged: StatusTransition = {
    payment_status: current.payment_status,
    status: current.status,
    action: 'none',
    markPaidAt: false,
  };

  // Eenmaal betaald blijft betaald: niets meer muteren.
  if (current.payment_status === 'paid') return unchanged;

  switch (mollieStatus) {
    case 'paid':
      return { payment_status: 'paid', status: 'paid', action: 'finalize', markPaidAt: true };
    case 'failed':
    case 'canceled':
    case 'expired': {
      // Eenmaal geannuleerd niet nogmaals voorraad vrijgeven.
      const alreadyCancelled = current.status === 'cancelled';
      return {
        payment_status: mollieStatus === 'canceled' ? 'failed' : mollieStatus,
        status: 'cancelled',
        action: alreadyCancelled ? 'none' : 'release',
        markPaidAt: false,
      };
    }
    case 'authorized':
      return { ...unchanged, payment_status: 'authorized' };
    case 'pending':
    case 'open':
      return { ...unchanged, payment_status: 'open' };
    default:
      return unchanged;
  }
}
