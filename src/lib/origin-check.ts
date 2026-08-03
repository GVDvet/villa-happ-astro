/**
 * Eigen herkomstcontrole, ter vervanging van Astro's `security.checkOrigin`.
 *
 * Waarom niet gewoon die van Astro: die weigert élk POST-verzoek met een
 * formulier-content-type waarvan de Origin-header niet klopt, zonder
 * uitzonderingen. Mollie roept onze webhook aan vanaf zijn eigen servers met
 * `application/x-www-form-urlencoded` en dus zonder Origin. Astro gaf daar
 * 403 op, waardoor een betaalde bestelling nooit op 'betaald' kwam te staan.
 *
 * Deze versie doet hetzelfde werk, maar met één vrijstelling. Dat mag daar,
 * en alleen daar, omdat de webhook de inhoud van het verzoek niet vertrouwt:
 * hij leest er alleen een betaling-id uit en haalt de echte status daarna op
 * bij Mollie. Een vervalste aanroep levert dus hooguit een overbodige
 * controle op, geen statuswijziging.
 *
 * De regel blijft verder ongewijzigd: een formulier op een vreemde site kan
 * niet ongemerkt namens een ingelogde bezoeker posten.
 */

/**
 * Content-types die een HTML-formulier zelf kan versturen. Alleen deze zijn
 * kwetsbaar voor cross-site formulierverzending; `application/json` kan een
 * formulier niet sturen, dus daar is geen controle voor nodig.
 */
const FORMULIER_TYPES = [
  'application/x-www-form-urlencoded',
  'multipart/form-data',
  'text/plain',
];

/** Methodes die niets wijzigen en dus geen controle nodig hebben. */
const VEILIGE_METHODES = new Set(['GET', 'HEAD', 'OPTIONS']);

/**
 * Routes die van buiten aangeroepen worden door een partij die geen Origin
 * meestuurt. Alleen toevoegen als die route de inhoud van het verzoek niet
 * vertrouwt.
 */
export const VRIJGESTELDE_PADEN = new Set(['/api/checkout/webhook']);

export interface Verzoek {
  methode: string;
  pad: string;
  origin: string | null;
  host: string | null;
  contentType: string | null;
}

/** True als het verzoek door mag; false betekent 403. */
export function magDoor(v: Verzoek): boolean {
  if (VEILIGE_METHODES.has(v.methode.toUpperCase())) return true;
  if (VRIJGESTELDE_PADEN.has(v.pad)) return true;

  const type = (v.contentType || '').split(';')[0].trim().toLowerCase();
  if (!FORMULIER_TYPES.includes(type)) return true;

  // Vanaf hier: een formulierverzending die wél gecontroleerd moet worden.
  if (!v.origin || !v.host) return false;

  let originHost: string;
  try {
    originHost = new URL(v.origin).host;
  } catch {
    return false;
  }
  return originHost === v.host;
}
