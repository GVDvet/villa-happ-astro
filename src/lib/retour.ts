/**
 * Villa Happ — Retourberekening (puur, testbaar)
 *
 * Implementeert de rekenregel uit docs/retourbeleid.md. Geen I/O: alleen
 * rekenen, zodat het beheer, de tests en een latere API dezelfde uitkomst
 * krijgen. Wijkt dit bestand af van dat document, dan is dit bestand fout.
 *
 * De volgorde is bindend. Trek je de verwerkingskosten er eerder af, dan
 * komen ze boven een bedrag te staan dat nog gecorrigeerd moet worden:
 *
 *   1. basis        = som van de geretourneerde artikelen
 *   2. + heenzend   = alleen bij VOLLEDIGE retour, en alleen wat werkelijk
 *                     is betaald
 *   3. − correctie  = alleen bij GEDEELTELIJKE retour, waarbij de verzending
 *                     gratis was én de behouden waarde onder de drempel zakt
 *   4. − verwerking = alleen als de retour is aangemeld vanaf dag 15
 *   5. − waardevermindering = per geval vastgesteld, met dossier
 *   6. terugbetaling = max(0, resultaat)
 *
 * De retourzending zelf zit hier niet in: die betaalt de klant rechtstreeks
 * aan de vervoerder.
 */

import { FREE_SHIPPING_CENTS, shippingCost } from './shipping';
import { BUSINESS } from './business';

/** Eerste dag waarop de verwerkingskosten gelden. Dag 1 t/m 14 is wettelijk. */
export const VERWERKING_VANAF_DAG = BUSINESS.statutoryReturnDays + 1;

export interface RetourInvoer {
  /** Som van de artikelen in déze retour, in centen. */
  artikelBedragCents: number;
  /**
   * Waarde die de klant ná deze retour houdt, over de hele bestelling.
   * Bepaalt of de gratisverzendgrens nog gehaald wordt.
   */
  behoudenWaardeCents: number;
  /**
   * Verzendkosten die bij de bestelling werkelijk zijn betaald. 0 betekent
   * dat de verzending gratis was; alleen dan kan er gecorrigeerd worden.
   */
  betaaldeVerzendkostenCents: number;
  /** Bezorgland (NL, BE, DE). Bepaalt het tarief van de correctie. */
  land: string;
  /**
   * Dag waarop de klant de retour heeft aangemeld, geteld vanaf ontvangst.
   * Bewust de aanmelddatum en niet de ontvangstdatum van het pakket: anders
   * bepaalt de vervoerder of iemand verwerkingskosten betaalt.
   */
  aangemeldOpDag: number;
  /** Vastgestelde waardevermindering, met dossier. Standaard 0. */
  waardeverminderingCents?: number;
  /**
   * Verzendcorrectie die bij een eerdere retour op dezelfde bestelling al
   * is ingehouden. Voorkomt dat een tweede retour hem nog eens inhoudt.
   */
  alIngehoudenCorrectieCents?: number;
}

export interface RetourUitkomst {
  basisCents: number;
  heenzendCents: number;
  correctieCents: number;
  verwerkingCents: number;
  waardeverminderingCents: number;
  terugbetalingCents: number;
}

/** Is dit een volledige retour? Zo ja, dan houdt de klant niets over. */
export function isVolledigeRetour(behoudenWaardeCents: number): boolean {
  return behoudenWaardeCents <= 0;
}

/**
 * Verzendcorrectie (mechanisme A): de gratis verzending was een
 * voorwaardelijke korting, gekoppeld aan de bestelwaarde. Zakt de behouden
 * waarde door een gedeeltelijke retour onder de drempel, dan vervalt die
 * voorwaarde en dus de korting.
 *
 * Nooit bij een volledige retour: dan verplicht art. 6:230r lid 1 juist tot
 * teruggave van de leveringskosten. Dat is de valkuil in dit hele beleid.
 */
export function verzendcorrectie(invoer: RetourInvoer): number {
  const volledig = isVolledigeRetour(invoer.behoudenWaardeCents);
  if (volledig) return 0;
  // Al betaald = niets terug te draaien; er was geen korting.
  if (invoer.betaaldeVerzendkostenCents > 0) return 0;
  if (invoer.behoudenWaardeCents >= FREE_SHIPPING_CENTS) return 0;

  // Het tarief van het bezorgland, met een subtotaal onder de drempel zodat
  // shippingCost het echte tarief teruggeeft en niet 0.
  const tarief = shippingCost(invoer.land, 0);
  const alIngehouden = Math.max(0, invoer.alIngehoudenCorrectieCents || 0);
  // Nooit twee keer inhouden en nooit meer dan het werkelijke tarief.
  return Math.max(0, tarief - alIngehouden);
}

/** Verwerkingskosten: alleen in ons eigen venster, nooit in de wettelijke 14 dagen. */
export function verwerkingskosten(aangemeldOpDag: number): number {
  return aangemeldOpDag >= VERWERKING_VANAF_DAG ? BUSINESS.returnFeeCents : 0;
}

export function berekenRetour(invoer: RetourInvoer): RetourUitkomst {
  const volledig = isVolledigeRetour(invoer.behoudenWaardeCents);

  const basisCents = Math.max(0, invoer.artikelBedragCents);
  // Heenzendkosten komen alleen terug bij een volledige retour, en alleen
  // voor zover ze werkelijk betaald zijn. Was de verzending gratis, dan valt
  // er niets terug te betalen — en nooit alsnog in rekening te brengen.
  const heenzendCents = volledig ? Math.max(0, invoer.betaaldeVerzendkostenCents) : 0;
  const correctieCents = verzendcorrectie(invoer);
  const verwerkingCents = verwerkingskosten(invoer.aangemeldOpDag);
  const waardeverminderingCents = Math.max(0, invoer.waardeverminderingCents || 0);

  const resultaat =
    basisCents + heenzendCents - correctieCents - verwerkingCents - waardeverminderingCents;

  return {
    basisCents,
    heenzendCents,
    correctieCents,
    verwerkingCents,
    waardeverminderingCents,
    terugbetalingCents: Math.max(0, resultaat),
  };
}
