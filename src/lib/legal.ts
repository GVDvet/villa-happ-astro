/**
 * Villa Happ — gedeelde juridische constanten
 *
 * Eén datum en één set formuleringen voor de juridische pagina's, de
 * transactiemails en de checkout. Zo kan een belofte niet op één plek
 * veranderen en op de andere blijven staan — precies de fout die de
 * audit op het retourbeleid vond.
 */

import { BUSINESS } from './business';

/** Datum onder aan elke juridische pagina. Handmatig bijwerken bij wijziging. */
export const LEGAL_UPDATED = '31 juli 2026';

/** Verzendtarieven — moet gelijk blijven aan SHIPPING_RATES_CENTS. */
export const SHIPPING_TABLE = [
  { country: 'Nederland', code: 'NL', costCents: 495, delivery: 'Meestal de volgende werkdag' },
  { country: 'België', code: 'BE', costCents: 695, delivery: '2 tot 3 werkdagen' },
  { country: 'Duitsland', code: 'DE', costCents: 895, delivery: '2 tot 4 werkdagen' },
] as const;

/**
 * De retourzin, in één formulering. Retour is alleen binnen Nederland
 * gratis; daarbuiten zijn de kosten voor de klant. Elke plek die iets
 * over retour zegt, zegt dít.
 */
export const RETURN_SHORT = `${BUSINESS.returnDays} dagen bedenktijd · retour gratis binnen Nederland`;

export const RETURN_SENTENCE =
  `Je hebt ${BUSINESS.returnDays} dagen bedenktijd. Retourneren vanuit Nederland is gratis; ` +
  `vanuit België en Duitsland zijn de retourkosten voor eigen rekening.`;

/** Zin over btw. Alle prijzen op de site zijn consumentenprijzen. */
export const VAT_SENTENCE = `Alle prijzen zijn in euro's en inclusief ${BUSINESS.vatRate}% btw.`;

/** Levertijdbelofte, in één formulering voor PDP, FAQ en verzendpagina. */
export const DELIVERY_SENTENCE =
  'Bestel je op een werkdag voor 16:00, dan gaat je pakket dezelfde dag via PostNL op de bus. ' +
  'Binnen Nederland is het meestal de volgende werkdag in huis.';
