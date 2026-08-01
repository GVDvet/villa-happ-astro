import { describe, it, expect } from 'vitest';
import {
  toegestaneActies, magActie, bouwTijdlijn, levertijdIndicatie, euro,
  type Gebeurtenis,
} from '../src/lib/order-status';

const ev = (soort: Gebeurtenis['soort'], dag: number, toelichting?: string): Gebeurtenis => ({
  soort,
  created_at: `2026-08-0${dag}T10:00:00.000Z`,
  toelichting,
});

describe('toegestaneActies', () => {
  it('laat niets toe zolang er niet betaald is', () => {
    // De belangrijkste regel: een onbetaalde bestelling verzend je niet.
    expect(toegestaneActies('pending', 'open')).toEqual([]);
    expect(toegestaneActies('paid', 'open')).toEqual([]);
    expect(toegestaneActies('pending', 'failed')).toEqual([]);
  });

  it('biedt verzenden aan bij een betaalde bestelling', () => {
    expect(toegestaneActies('paid', 'paid')).toEqual(['verzenden', 'terugbetalen']);
  });

  it('biedt bezorgd aan zodra hij onderweg is', () => {
    expect(toegestaneActies('shipped', 'paid')).toEqual(['bezorgd', 'terugbetalen']);
  });

  it('laat na bezorging alleen nog terugbetalen toe', () => {
    expect(toegestaneActies('delivered', 'paid')).toEqual(['terugbetalen']);
  });

  it('laat niets meer toe na annuleren of terugbetalen', () => {
    expect(toegestaneActies('cancelled', 'failed')).toEqual([]);
    expect(toegestaneActies('refunded', 'refunded')).toEqual([]);
  });

  it('magActie volgt exact dezelfde regels', () => {
    expect(magActie('paid', 'paid', 'verzenden')).toBe(true);
    expect(magActie('paid', 'paid', 'bezorgd')).toBe(false);
    expect(magActie('shipped', 'paid', 'verzenden')).toBe(false);
    expect(magActie('pending', 'open', 'verzenden')).toBe(false);
  });
});

describe('bouwTijdlijn', () => {
  it('toont de volledige route met nog niet gehaalde stappen', () => {
    const stappen = bouwTijdlijn([ev('aangemaakt', 1), ev('betaald', 1)]);
    expect(stappen.map((s) => s.soort)).toEqual(['aangemaakt', 'betaald', 'verzonden', 'bezorgd']);
    expect(stappen.map((s) => s.gehaald)).toEqual([true, true, false, false]);
  });

  it('markeert de laatst gehaalde stap als de huidige', () => {
    const stappen = bouwTijdlijn([ev('aangemaakt', 1), ev('betaald', 1), ev('verzonden', 2)]);
    expect(stappen.find((s) => s.huidig)?.soort).toBe('verzonden');
  });

  it('stopt de route bij een annulering', () => {
    // Een geannuleerde bestelling "verzonden" in het vooruitzicht stellen is
    // misleidend; die stap hoort dan niet meer in beeld.
    const stappen = bouwTijdlijn([ev('aangemaakt', 1), ev('geannuleerd', 1)]);
    expect(stappen.map((s) => s.soort)).toEqual(['aangemaakt', 'geannuleerd']);
    expect(stappen.every((s) => s.gehaald)).toBe(true);
  });

  it('houdt bij een terugbetaling de al gehaalde stappen zichtbaar', () => {
    const stappen = bouwTijdlijn([
      ev('aangemaakt', 1), ev('betaald', 1), ev('verzonden', 2), ev('terugbetaald', 3),
    ]);
    expect(stappen.map((s) => s.soort)).toEqual(['aangemaakt', 'betaald', 'verzonden', 'terugbetaald']);
  });

  it('negeert losse notities in de route', () => {
    const stappen = bouwTijdlijn([ev('aangemaakt', 1), ev('opmerking', 1, 'klant belde')]);
    expect(stappen.some((s) => s.soort === 'opmerking')).toBe(false);
  });

  it('neemt de toelichting mee', () => {
    const stappen = bouwTijdlijn([ev('aangemaakt', 1), ev('verzonden', 2, 'PostNL 3SVH123')]);
    expect(stappen.find((s) => s.soort === 'verzonden')?.toelichting).toBe('PostNL 3SVH123');
  });

  it('overleeft een lege lijst', () => {
    const stappen = bouwTijdlijn([]);
    expect(stappen).toHaveLength(4);
    expect(stappen.every((s) => !s.gehaald)).toBe(true);
  });
});

describe('levertijdIndicatie', () => {
  it('noemt nooit een kalenderdatum', () => {
    // Huisregel uit het Aqua Chain-portaal: geen exacte leverdag beloven op
    // een plek die niet live kan bijwerken.
    for (const land of ['NL', 'BE', 'DE']) {
      expect(levertijdIndicatie(land)).not.toMatch(/\d{1,2}\s+(jan|feb|mrt|apr|mei|jun|jul|aug|sep|okt|nov|dec)/i);
      expect(levertijdIndicatie(land)).toMatch(/werkdag/);
    }
  });
});

describe('euro', () => {
  it('rekent in centen en toont met een komma', () => {
    expect(euro(5995)).toBe('€ 59,95');
    expect(euro(0)).toBe('€ 0,00');
    expect(euro(120000)).toBe('€ 1200,00');
  });
});
