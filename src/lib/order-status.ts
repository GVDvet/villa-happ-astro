/**
 * Villa Happ — orderstatus en tijdlijn (puur, geen IO)
 *
 * De levenscyclus van een bestelling op één plek, zodat het beheerportaal,
 * het klantportaal en de webhook allemaal dezelfde regels volgen. Geen
 * database, geen fetch: alles hier is te testen zonder omgeving.
 *
 * Eerder stonden `delivered` en `refunded` wel in het type maar zette geen
 * enkele coderegel ze ooit. Het spoor van een bestelling hield daardoor op
 * bij "verzonden".
 */

export const ORDER_STATUSSEN = [
  'pending',
  'paid',
  'shipped',
  'delivered',
  'cancelled',
  'refunded',
] as const;
export type OrderStatus = (typeof ORDER_STATUSSEN)[number];

export const STATUS_LABEL: Record<OrderStatus, string> = {
  pending: 'In afwachting van betaling',
  paid: 'Betaald',
  shipped: 'Verzonden',
  delivered: 'Bezorgd',
  cancelled: 'Geannuleerd',
  refunded: 'Terugbetaald',
};

/** Korte variant voor lijsten en badges. */
export const STATUS_KORT: Record<OrderStatus, string> = {
  pending: 'Wacht op betaling',
  paid: 'Betaald',
  shipped: 'Verzonden',
  delivered: 'Bezorgd',
  cancelled: 'Geannuleerd',
  refunded: 'Terugbetaald',
};

/** Kleurcode voor de badge; de UI vertaalt dit naar een CSS-klasse. */
export const STATUS_TOON: Record<OrderStatus, 'wacht' | 'goed' | 'onderweg' | 'af' | 'stop'> = {
  pending: 'wacht',
  paid: 'goed',
  shipped: 'onderweg',
  delivered: 'af',
  cancelled: 'stop',
  refunded: 'stop',
};

/* ---------- Toegestane overgangen ---------- */

export type BeheerActie = 'verzenden' | 'bezorgd' | 'terugbetalen' | 'annuleren';

/**
 * Welke handmatige acties mag beheer op deze order uitvoeren?
 *
 * Bewust streng: een order die niet betaald is kan niet verzonden worden,
 * en een geannuleerde order gaat nergens meer heen. Dit is de enige bron
 * voor zowel de knoppen in de UI als de controle in de API, zodat je een
 * actie niet kunt forceren door de knop te omzeilen.
 */
export function toegestaneActies(
  status: string,
  paymentStatus: string,
): BeheerActie[] {
  if (paymentStatus !== 'paid') return [];
  switch (status) {
    case 'paid':
      return ['verzenden', 'terugbetalen'];
    case 'shipped':
      return ['bezorgd', 'terugbetalen'];
    case 'delivered':
      return ['terugbetalen'];
    default:
      // cancelled, refunded, pending: geen handmatige actie meer
      return [];
  }
}

export function magActie(status: string, paymentStatus: string, actie: BeheerActie): boolean {
  return toegestaneActies(status, paymentStatus).includes(actie);
}

/* ---------- Tijdlijn ---------- */

export type GebeurtenisSoort =
  | 'aangemaakt'
  | 'betaald'
  | 'verzonden'
  | 'bezorgd'
  | 'geannuleerd'
  | 'terugbetaald'
  | 'opmerking';

export const GEBEURTENIS_LABEL: Record<GebeurtenisSoort, string> = {
  aangemaakt: 'Bestelling geplaatst',
  betaald: 'Betaling ontvangen',
  verzonden: 'Verzonden via PostNL',
  bezorgd: 'Bezorgd',
  geannuleerd: 'Geannuleerd',
  terugbetaald: 'Terugbetaald',
  opmerking: 'Notitie',
};

export interface Gebeurtenis {
  soort: GebeurtenisSoort;
  created_at: string;
  toelichting?: string | null;
}

export interface TijdlijnStap {
  soort: GebeurtenisSoort;
  label: string;
  toelichting?: string | null;
  /** ISO-datum als de stap heeft plaatsgevonden, anders null. */
  op: string | null;
  gehaald: boolean;
  /** De stap waar de bestelling nu staat. */
  huidig: boolean;
}

/** De normale route die een bestelling aflegt. */
const HAPPY_PATH: GebeurtenisSoort[] = ['aangemaakt', 'betaald', 'verzonden', 'bezorgd'];

/**
 * Bouwt de tijdlijn voor de klant: de vaste route met daarin gemarkeerd wat
 * al gebeurd is. Is de bestelling geannuleerd of terugbetaald, dan stopt de
 * route daar: een geannuleerde bestelling nog "verzonden" in het vooruitzicht
 * stellen is misleidend.
 */
export function bouwTijdlijn(events: Gebeurtenis[]): TijdlijnStap[] {
  const opTijdstip = new Map<GebeurtenisSoort, Gebeurtenis>();
  for (const e of events) {
    if (e.soort === 'opmerking') continue;
    // Eerste voorkomen telt; de database houdt ze uniek per soort.
    if (!opTijdstip.has(e.soort)) opTijdstip.set(e.soort, e);
  }

  const afgebroken = (['geannuleerd', 'terugbetaald'] as const).find((s) => opTijdstip.has(s));

  const route: GebeurtenisSoort[] = afgebroken
    ? [...HAPPY_PATH.filter((s) => opTijdstip.has(s)), afgebroken]
    : HAPPY_PATH;

  const laatsteGehaald = [...route].reverse().find((s) => opTijdstip.has(s));

  return route.map((soort) => {
    const e = opTijdstip.get(soort);
    return {
      soort,
      label: GEBEURTENIS_LABEL[soort],
      toelichting: e?.toelichting ?? null,
      op: e?.created_at ?? null,
      gehaald: !!e,
      huidig: soort === laatsteGehaald,
    };
  });
}

/* ---------- Weergave ---------- */

/**
 * Levertijd als indicatie, nooit als exacte dag.
 *
 * Huisregel uit het Aqua Chain-portaal: in mail en op een pagina die niet
 * live kan bijwerken beloof je geen kalenderdatum, want die wordt een
 * afspraak waar je op afgerekend wordt. De PDP en de bedanktpagina noemden
 * eerder wel een concrete dag, zonder rekening te houden met feestdagen of
 * een vertraagde rit.
 */
export function levertijdIndicatie(country = 'NL'): string {
  if (country === 'BE' || country === 'DE') return 'Doorgaans binnen 5 werkdagen na bestelling';
  return 'Doorgaans binnen 3 werkdagen na bestelling';
}

/** Bedragen altijd in hele centen; presenteren als euro's. */
export function euro(cents: number): string {
  return '€ ' + (cents / 100).toFixed(2).replace('.', ',');
}
