/**
 * Villa Happ — Bedrijfs- en juridische gegevens
 *
 * ÉÉN bron voor alles wat wettelijk op de site moet staan: KvK, btw-id,
 * adressen, contactgegevens, retouradres. De juridische pagina's, het
 * Organization-schema, de footer en de transactiemails lezen allemaal
 * hiervandaan. Wijzig je iets, dan wijzigt het overal mee.
 *
 * NOG AAN TE LEVEREN
 * ------------------
 * Waardes die nog ontbreken staan op `PENDING`. Dat is geen lege string:
 * de pagina's herkennen de waarde en tonen dan "volgt" in plaats van een
 * halve zin, en `pendingFields()` somt ze op. In dev logt de site bij het
 * bouwen welke velden nog open staan, zodat dit niet stil live gaat.
 *
 * Invullen = de PENDING vervangen door de echte waarde. Verder niets.
 */

/** Sentinel voor "moet Geoff nog aanleveren". Nooit als tekst tonen. */
export const PENDING = '__PENDING__' as const;

export function isPending(value: string): boolean {
  return value === PENDING;
}

/** Toon de waarde, of een nette vervanger zolang hij ontbreekt. */
export function orPending(value: string, fallback = 'volgt'): string {
  return isPending(value) ? fallback : value;
}

export const BUSINESS = {
  /* ---------- Identiteit ---------- */
  /** Handelsnaam zoals ingeschreven bij de KvK. */
  legalName: 'Villa Happ Nederland',
  /** Merknaam zoals we die in lopende tekst gebruiken. */
  tradeName: 'Villa Happ',
  legalForm: 'Eenmanszaak',
  /** Naam van de eigenaar; verplicht bij een eenmanszaak. */
  ownerName: 'Rutger van Happen',

  /* ---------- Registraties ---------- */
  kvk: '81998481',
  establishmentNumber: '000048256285',
  /**
   * Btw-IDENTIFICATIENUMMER (NL……B..), het nummer voor facturen en de
   * website. NIET het omzetbelastingnummer: dat is op het BSN gebaseerd
   * en hoort nooit gepubliceerd te worden.
   */
  vatId: 'NL003630352B94',

  /* ---------- Adressen ---------- */
  /**
   * Bezoekadres. Art. 3:15d BW vraagt om een geografisch adres; een
   * postbus telt daar formeel niet voor. Het woonadres van de eigenaar
   * gaat hier bewust niet op, dus hier hoort een zakelijk adres.
   */
  visitingAddress: {
    street: 'Vijzelweg 18E',
    postalCode: '5145 NK',
    city: 'Waalwijk',
  },
  /** Postadres. Mag wél een postbus zijn; hier gelijk aan het bezoekadres. */
  postalAddress: {
    line: 'Vijzelweg 18E',
    postalCode: '5145 NK',
    city: 'Waalwijk',
  },
  /** Vestigingsplaats volgens de KvK; voedt het Organization-schema. */
  locality: 'Waalwijk',
  region: 'Noord-Brabant',
  country: 'NL',
  countryName: 'Nederland',
  /**
   * Waar retourzendingen heen gaan. Staat los van het bezoekadres: dit
   * kan ook een retourpunt of afhaaladres zijn.
   */
  returnAddress: {
    name: 'Villa Happ Nederland',
    street: 'Vijzelweg 18E',
    postalCode: '5145 NK',
    city: 'Waalwijk',
  },

  /* ---------- Contact ---------- */
  /**
   * Eén adres voor de hele site. Dit staat op ruim tien plekken, waaronder
   * de wettelijk verplichte contactgegevens en de herroepingspagina — een
   * herroeping naar een bouncend adres geldt als niet ontvangen. Wijzig dit
   * dus pas nadat het postvak of de alias in Microsoft 365 bestaat.
   */
  orderEmail: 'contact@villa-happ.nl',
  supportEmail: 'contact@villa-happ.nl',
  /** Aparte AVG-postbus is netjes maar niet verplicht bij een eenmanszaak. */
  privacyEmail: 'contact@villa-happ.nl',
  phone: PENDING,
  /** Openingstijden of reactietermijn telefonisch. */
  phoneHours: PENDING,

  /* ---------- Beleid (moet matchen met de praktijk) ---------- */
  /** Wettelijk minimum is 14 dagen; wij geven er meer. */
  returnDays: 30,
  /**
   * De wettelijke bedenktijd (art. 6:230o BW). Binnen deze termijn mogen we
   * geen verwerkingskosten rekenen; de dagen daarna zijn onze eigen,
   * vrijwillige verlenging en daar hangt wél een vergoeding aan.
   */
  statutoryReturnDays: 14,
  /** Terugbetaaltermijn na ontvangst van de retour. */
  refundDays: 14,
  /**
   * Landen waar retourneren gratis is. Sinds de herstart nergens: de klant
   * betaalt de retourzending zelf en er gaan verwerkingskosten af.
   */
  freeReturnCountries: [] as string[],
  /**
   * Verwerkingskosten die we bij een retour inhouden op de terugbetaling.
   * Staat los van de retourverzending, die de klant zelf regelt en betaalt.
   * Geldt alleen vanaf dag 15: binnen de wettelijke bedenktijd mag dit niet.
   */
  returnFeeCents: 1000,
  vatRate: 21,
} as const;

/* ---------- Placeholderregister ---------- */

interface PendingField {
  path: string;
  label: string;
  why: string;
}

const PENDING_CANDIDATES: PendingField[] = [
  { path: 'vatId', label: 'Btw-identificatienummer', why: 'Verplicht op de site en op facturen (art. 3:15d BW).' },
  { path: 'visitingAddress.street', label: 'Bezoekadres — straat en nummer', why: 'Geografisch adres is verplicht voor een webshop.' },
  { path: 'visitingAddress.postalCode', label: 'Bezoekadres — postcode', why: 'Hoort bij het bezoekadres.' },
  { path: 'visitingAddress.city', label: 'Bezoekadres — plaats', why: 'Hoort bij het bezoekadres.' },
  { path: 'returnAddress.name', label: 'Retouradres — tenaamstelling', why: 'Klanten moeten weten naar wie ze terugsturen.' },
  { path: 'returnAddress.street', label: 'Retouradres — straat en nummer', why: 'Zonder retouradres kan niemand retourneren.' },
  { path: 'returnAddress.postalCode', label: 'Retouradres — postcode', why: 'Hoort bij het retouradres.' },
  { path: 'returnAddress.city', label: 'Retouradres — plaats', why: 'Hoort bij het retouradres.' },
  { path: 'phone', label: 'Telefoonnummer', why: 'Niet strikt verplicht, wel een sterk vertrouwenssignaal in een webshop.' },
  { path: 'phoneHours', label: 'Telefonische bereikbaarheid', why: 'Alleen nodig als er een telefoonnummer komt.' },
];

function readPath(path: string): string {
  return path.split('.').reduce<any>((acc, key) => acc?.[key], BUSINESS) ?? '';
}

/** Welke gegevens ontbreken nog? Voedt de opleverchecklist. */
export function pendingFields(): PendingField[] {
  return PENDING_CANDIDATES.filter((f) => isPending(readPath(f.path)));
}

/* ---------- Afgeleide weergaves ---------- */

/** Bezoekadres op één regel, of het postadres zolang dat ontbreekt. */
export function addressLine(): string {
  const v = BUSINESS.visitingAddress;
  if (!isPending(v.street) && !isPending(v.postalCode) && !isPending(v.city)) {
    return `${v.street}, ${v.postalCode} ${v.city}`;
  }
  const p = BUSINESS.postalAddress;
  return `${p.line}, ${p.postalCode} ${p.city}`;
}

/** Retouradres als regels, of null zolang het ontbreekt. */
export function returnAddressLines(): string[] | null {
  const r = BUSINESS.returnAddress;
  if (Object.values(r).some(isPending)) return null;
  return [r.name, r.street, `${r.postalCode} ${r.city}`, BUSINESS.countryName];
}

/** Is retour gratis vanuit dit land? */
export function freeReturnFrom(country: string): boolean {
  return BUSINESS.freeReturnCountries.includes(country);
}

// Bij het bouwen één keer melden wat er nog open staat; zo verdwijnt een
// vergeten gegeven niet stil in een live pagina.
if (import.meta.env.DEV || import.meta.env.PROD) {
  const open = pendingFields();
  if (open.length) {
    console.warn(
      `[business] ${open.length} gegeven(s) nog niet aangeleverd: ` +
        open.map((f) => f.label).join(', '),
    );
  }
}
