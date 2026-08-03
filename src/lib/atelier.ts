/**
 * Villa Happ — Het Atelier (pure, testbare logica)
 *
 * De "claim-je-nummer"-finale kent bezoekers een nummer toe in de
 * genummerde oplage. Geen I/O hier: alleen het schema en de
 * nummertoewijzing, zodat de API-route en de tests dit delen.
 *
 * Alleen de cap. Het Atelier gaat over de genummerde oplage, en die
 * hebben we tot nu toe uitsluitend voor de Back-Cap. De hoodies lopen
 * niet in een limited oplage en horen hier dus niet: een configurator
 * die een genummerde hoodie belooft, belooft iets wat niet bestaat.
 */

import { z } from 'zod';

/** Oplagegrootte, gelijk aan de eerste genummerde drop (back-cap, 500 stuks). */
export const EDITION = 500;

export const GARMENTS = ['cap'] as const;
export type Garment = (typeof GARMENTS)[number];

export const ClaimSchema = z.object({
  email: z.email(),
  name: z.string().min(1).max(40).optional(),
  garment: z.enum(GARMENTS).optional(),
  /** Expliciete toestemming voor de nieuwsbrief; standaard uit. */
  newsletter: z.boolean().optional().default(false),
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

/** Leesbare naam van het stuk. De cap komt in één klassieke uitvoering. */
export function describePiece(): string {
  return 'Cap · Grijs melange';
}

/* ---------- Kijkhoeken in de ontwerpstudio ---------- */

export const ANGLES = ['front', 'side', 'back'] as const;
export type Angle = (typeof ANGLES)[number];

export const ANGLE_LABELS: Record<Angle, string> = {
  front: 'Voorkant',
  side: 'Zijkant',
  back: 'Achterkant',
};

/**
 * Welke hoeken bestaan er? Puur bepaald door het beeldmateriaal in
 * public/img/atelier: van de cap is er voorkant, zijkant en achterkant.
 * Voeg je een beeld toe, zet de hoek er dan hier bij.
 */
export function anglesFor(): Angle[] {
  return ['front', 'side', 'back'];
}

/** Val terug op de voorkant zodra de gevraagde hoek niet bestaat. */
export function resolveAngle(angle?: string): Angle {
  return anglesFor().includes(angle as Angle) ? (angle as Angle) : 'front';
}

/** Bestandsnaam (zonder pad en extensie) van het studiobeeld. */
export function assetName(angle?: string): string {
  return `cap-${resolveAngle(angle)}`;
}
