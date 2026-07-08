/**
 * Villa Happ — Het Atelier (pure, testbare logica)
 *
 * De "claim-je-nummer"-finale kent bezoekers een nummer toe in de
 * genummerde oplage. Geen I/O hier: alleen het schema en de
 * nummertoewijzing, zodat de API-route en de tests dit delen.
 */

import { z } from 'zod';

/** Oplagegrootte, gelijk aan de eerste genummerde drop (back-cap, 500 stuks). */
export const EDITION = 500;

export const ClaimSchema = z.object({
  email: z.email(),
  name: z.string().min(1).max(40).optional(),
  colour: z.enum(['olijfgroen', 'navy', 'antraciet']).optional(),
});

export type ClaimPayload = z.infer<typeof ClaimSchema>;

/**
 * Volgnummer voor de zoveelste claim. `count` = aantal reeds toegekende
 * nummers. Nummers lopen 1..edition en rollen daarna door naar een
 * volgende oplage, zodat er altijd een nummer te claimen valt.
 */
export function nextNumber(count: number, edition: number = EDITION): number {
  if (!Number.isFinite(count) || count < 0) return 1;
  return (Math.floor(count) % edition) + 1;
}

/** Toon als "042 / 500". */
export function formatEdition(n: number, edition: number = EDITION): string {
  const digits = String(edition).length;
  return `${String(n).padStart(digits, '0')} / ${edition}`;
}
