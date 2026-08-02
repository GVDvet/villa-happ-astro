/**
 * Villa Happ — capability-tokens (server-only, puur)
 *
 * Een bestelling bevat PII: naam, adres, wat iemand kocht. De bedanktpagina
 * en het klantportaal serveren die niet op het kale bestelnummer, maar op
 * een ondertekend, verlopend token. Geen tabel, geen sessie, geen account.
 *
 * Overgenomen van prWize Core, dat het patroon op zijn beurt van het Aqua
 * Chain-portaal heeft. Twee dingen daaruit zijn hier bewust behouden:
 *
 *  1. **Per publiek een eigen afgeleide sleutel.** Een token voor de
 *     bedanktpagina kan het klantportaal nooit openen en andersom. Dat is
 *     cryptografisch afgedwongen, niet met een prefix die je moet
 *     controleren. Een programmeerfout kan de scheiding dus niet omzeilen.
 *  2. **Timing-safe vergelijken, en nooit een 500 op een vervalst token.**
 *     Valideer eerst vorm en lengte; anders kort Buffer.from(..., 'hex')
 *     stil in en gooit timingSafeEqual op ongelijke bytelengte.
 *
 * Waarom stateless en niet een kolom in de database: dan staat er niets
 * geheims op te slaan, niets te lekken bij een dumplek, en is er één
 * mechanisme in plaats van twee.
 */

import { createHmac, timingSafeEqual } from 'node:crypto';

/**
 * Publieken. `status` is het korte token voor de bedanktpagina direct na
 * het betalen; `portaal` is het lange token in de mails waarmee de klant
 * zijn bestelling blijft volgen.
 */
export type TokenPubliek = 'status' | 'portaal';

/**
 * Geldigheid volgt de bedrijfsrealiteit, niet een rond getal.
 * - status: één betaalsessie plus ruime marge voor een trage bank.
 * - portaal: levering (enkele dagen) plus 30 dagen bedenktijd plus de
 *   terugbetaaltermijn, met marge. Daarna heeft de link geen functie meer.
 */
const GELDIG_MS: Record<TokenPubliek, number> = {
  status: 24 * 60 * 60 * 1000,
  portaal: 120 * 24 * 60 * 60 * 1000,
};

function secret(): string {
  const s = import.meta.env.AUTH_SECRET;
  if (!s || s.length < 32) {
    // Liever hard falen dan stil onveilig draaien: een zwak of ontbrekend
    // secret maakt elk token vervalsbaar.
    throw new Error('[Villa Happ] AUTH_SECRET ontbreekt of is korter dan 32 tekens.');
  }
  return s;
}

/**
 * Is er een bruikbaar AUTH_SECRET? Bedoeld om een route vroeg en met een
 * duidelijke melding te laten stoppen, in plaats van halverwege te laten
 * gooien op een plek waar de fout iets anders lijkt.
 *
 * Zonder deze check gaf een ontbrekend secret in de checkout een 502
 * "Betaling kon niet worden gestart", wat naar Mollie wijst terwijl die er
 * niets mee te maken heeft.
 */
export function authSecretOntbreekt(): boolean {
  const s = import.meta.env.AUTH_SECRET;
  return typeof s !== 'string' || s.length < 32;
}

/** Per-publiek afgeleide sleutel. Cross-publiek hergebruik is onmogelijk. */
function subSleutel(publiek: TokenPubliek): Buffer {
  return createHmac('sha256', secret()).update(`villahapp-order:${publiek}`).digest();
}

function teken(payload: string, publiek: TokenPubliek): string {
  return createHmac('sha256', subSleutel(publiek)).update(payload).digest('hex');
}

/** Vorm: "<orderId>:<verlooptOpMs>.<hex-hmac-sha256>" */
export function maakOrderToken(
  orderId: string,
  publiek: TokenPubliek,
  nu: number = Date.now(),
): string {
  const payload = `${orderId}:${nu + GELDIG_MS[publiek]}`;
  return `${payload}.${teken(payload, publiek)}`;
}

export interface TokenInhoud {
  orderId: string;
  verlooptOp: number;
}

/** Controleert handtekening én verval. Null = ongeldig, om welke reden dan ook. */
export function leesOrderToken(
  token: string | undefined | null,
  publiek: TokenPubliek,
  nu: number = Date.now(),
): TokenInhoud | null {
  if (!token) return null;
  const punt = token.lastIndexOf('.');
  if (punt < 0) return null;

  const payload = token.slice(0, punt);
  const gegeven = token.slice(punt + 1);
  const verwacht = teken(payload, publiek);

  // Vorm eerst, pas dan vergelijken (zie kop van dit bestand).
  if (gegeven.length !== verwacht.length || !/^[0-9a-f]+$/i.test(gegeven)) return null;
  const bgeg = Buffer.from(gegeven, 'hex');
  const bver = Buffer.from(verwacht, 'hex');
  if (bgeg.length !== bver.length || !timingSafeEqual(bgeg, bver)) return null;

  const delen = payload.split(':');
  if (delen.length !== 2) return null;
  const [orderId, vervalStr] = delen;
  if (!orderId || !vervalStr) return null;
  const verlooptOp = Number(vervalStr);
  if (!Number.isFinite(verlooptOp) || nu > verlooptOp) return null;

  return { orderId, verlooptOp };
}
