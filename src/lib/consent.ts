/**
 * Villa Happ — toestemming en Consent Mode v2
 *
 * De site heeft geen externe CMP; deze module ís de CMP. Hij doet twee dingen:
 * de keuze van de bezoeker bewaren, en die keuze doorgeven aan Google via de
 * Consent Mode v2-signalen.
 *
 * De standaardwaarden worden niet hier gezet maar inline in de <head> van
 * Base.astro, vóór het GTM-script. Dat moet: laadt GTM eerder dan de
 * defaults, dan meet Google één pageview lang met volledige opslag terwijl de
 * bezoeker nog niets heeft gekozen.
 *
 * Toestemming wordt nooit stilzwijgend op `granted` gezet. Weigert iemand,
 * dan blijven de signalen op `denied` en stuurt Google cookieloze pings —
 * modelmatige data in plaats van niets, en dat is precies de bedoeling.
 */

export const CONSENT_KEY = 'vh_consent_v1';

/** De vier Consent Mode v2-signalen. */
export interface ConsentChoice {
  /** GA4-meting */
  analytics: boolean;
  /** Advertentiecookies, remarketing */
  ads: boolean;
  /** Datum van de keuze; voedt de heropvraag na verloop. */
  at: string;
}

/**
 * Hoe lang een keuze meegaat. Na dit venster vragen we opnieuw. Twaalf
 * maanden is de bovengrens die de AP hanteert voor hertoestemming.
 */
const GELDIG_MAANDEN = 12;

type Listener = (c: ConsentChoice | null) => void;
const listeners = new Set<Listener>();

function store(): Storage | null {
  try {
    return typeof window !== 'undefined' ? window.localStorage : null;
  } catch {
    return null;
  }
}

/** De opgeslagen keuze, of null als er nog geen (geldige) keuze is. */
export function getConsent(): ConsentChoice | null {
  const s = store();
  if (!s) return null;
  try {
    const raw = s.getItem(CONSENT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as ConsentChoice;
    if (typeof parsed?.analytics !== 'boolean' || typeof parsed?.ads !== 'boolean') return null;

    // Verlopen keuze telt als geen keuze: de banner komt dan terug.
    const gekozen = new Date(parsed.at);
    if (isNaN(gekozen.valueOf())) return null;
    const verloopt = new Date(gekozen);
    verloopt.setMonth(verloopt.getMonth() + GELDIG_MAANDEN);
    if (verloopt < new Date()) return null;

    return parsed;
  } catch {
    return null;
  }
}

/** Heeft de bezoeker al gekozen? Bepaalt of de banner verschijnt. */
export function hasChosen(): boolean {
  return getConsent() !== null;
}

/**
 * Geef de keuze door aan Google. Dit is een `update`, geen `default`: de
 * defaults staan al in de <head> en mogen niet opnieuw gezet worden.
 */
function pushNaarGoogle(c: ConsentChoice) {
  const w = window as any;
  w.dataLayer = w.dataLayer || [];
  // De Consent Mode-API verwacht `arguments`, geen array. Vandaar deze vorm
  // en niet dataLayer.push({...}).
  function gtag(..._args: unknown[]) { w.dataLayer.push(arguments); }
  gtag('consent', 'update', {
    analytics_storage: c.analytics ? 'granted' : 'denied',
    ad_storage: c.ads ? 'granted' : 'denied',
    ad_user_data: c.ads ? 'granted' : 'denied',
    ad_personalization: c.ads ? 'granted' : 'denied',
  });
  // Eigen signaal, zodat GTM-triggers op een keuze kunnen wachten.
  w.dataLayer.push({ event: 'vh_consent_update', vh_analytics: c.analytics, vh_ads: c.ads });
}

/** Leg een keuze vast en geef hem door. */
export function setConsent(analytics: boolean, ads: boolean): ConsentChoice {
  const c: ConsentChoice = { analytics, ads, at: new Date().toISOString() };
  const s = store();
  if (s) {
    try { s.setItem(CONSENT_KEY, JSON.stringify(c)); } catch { /* private mode */ }
  }
  if (typeof window !== 'undefined') pushNaarGoogle(c);
  listeners.forEach((l) => l(c));
  return c;
}

/** Wis de keuze; de banner verschijnt daarna opnieuw. */
export function resetConsent() {
  const s = store();
  if (s) {
    try { s.removeItem(CONSENT_KEY); } catch { /* private mode */ }
  }
  listeners.forEach((l) => l(null));
}

/**
 * Herhaal een bestaande keuze richting Google bij het laden van de pagina.
 * Zonder dit valt een terugkerende bezoeker terug op de denied-defaults uit
 * de <head> en meet je hem niet, terwijl hij wel toestemming gaf.
 */
export function applyStoredConsent() {
  const c = getConsent();
  if (c) pushNaarGoogle(c);
}

export function onConsentChange(l: Listener) {
  listeners.add(l);
  return () => listeners.delete(l);
}
