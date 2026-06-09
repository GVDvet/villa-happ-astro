/**
 * Villa Happ — Mollie client wrapper (server-only)
 */

import createMollieClient, { type MollieClient } from '@mollie/api-client';

let _mollie: MollieClient | null = null;

export function getMollie(): MollieClient {
  if (_mollie) return _mollie;
  const apiKey = import.meta.env.MOLLIE_API_KEY;
  if (!apiKey) {
    throw new Error('[Villa Happ] MOLLIE_API_KEY ontbreekt in env.');
  }
  _mollie = createMollieClient({ apiKey });
  return _mollie;
}
