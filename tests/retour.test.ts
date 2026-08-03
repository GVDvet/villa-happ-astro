import { describe, it, expect } from 'vitest';
import {
  berekenRetour, verzendcorrectie, verwerkingskosten,
  isVolledigeRetour, VERWERKING_VANAF_DAG,
} from '../src/lib/retour';

/**
 * De vijf rekenvoorbeelden uit docs/retourbeleid.md, plus de twee valstrikken
 * die dat document expliciet noemt. Wijkt de code hiervan af, dan is de code
 * fout — niet het document.
 *
 * Uitgangspunt: hoodie € 59,95, cap € 21,95, bezorging Nederland (€ 8,95),
 * gratis verzending vanaf € 150,00.
 */
const HOODIE = 5995;
const CAP = 2195;
const NL_TARIEF = 895;

describe('rekenvoorbeeld 1 — drie hoodies, twee terug, binnen 14 dagen', () => {
  const r = berekenRetour({
    artikelBedragCents: 2 * HOODIE,      // 119,90
    behoudenWaardeCents: 1 * HOODIE,     //  59,95, onder de drempel
    betaaldeVerzendkostenCents: 0,       // was gratis (bestelling ≥ 150)
    land: 'NL',
    aangemeldOpDag: 5,
  });
  it('houdt het verzendtarief alsnog in', () => {
    expect(r.correctieCents).toBe(NL_TARIEF);
  });
  it('rekent geen verwerkingskosten binnen de wettelijke termijn', () => {
    expect(r.verwerkingCents).toBe(0);
  });
  it('betaalt € 110,95 terug', () => {
    expect(r.terugbetalingCents).toBe(11095);
  });
});

describe('rekenvoorbeeld 2 — zelfde bestelling, alles terug, binnen 14 dagen', () => {
  const r = berekenRetour({
    artikelBedragCents: 3 * HOODIE,      // 179,85
    behoudenWaardeCents: 0,              // volledige retour
    betaaldeVerzendkostenCents: 0,
    land: 'NL',
    aangemeldOpDag: 5,
  });
  it('houdt bij een volledige retour nooit een correctie in', () => {
    expect(r.correctieCents).toBe(0);
  });
  it('betaalt € 179,85 terug', () => {
    expect(r.terugbetalingCents).toBe(17985);
  });
});

describe('rekenvoorbeeld 3 — drie hoodies plus cap, alleen de cap terug', () => {
  const r = berekenRetour({
    artikelBedragCents: CAP,
    behoudenWaardeCents: 3 * HOODIE,     // 179,85, blijft boven de drempel
    betaaldeVerzendkostenCents: 0,
    land: 'NL',
    aangemeldOpDag: 3,
  });
  it('corrigeert niet zolang de behouden waarde de drempel haalt', () => {
    expect(r.correctieCents).toBe(0);
  });
  it('betaalt € 21,95 terug', () => {
    expect(r.terugbetalingCents).toBe(2195);
  });
});

describe('rekenvoorbeeld 4 — één hoodie, verzending betaald, volledig retour op dag 20', () => {
  const r = berekenRetour({
    artikelBedragCents: HOODIE,
    behoudenWaardeCents: 0,
    betaaldeVerzendkostenCents: NL_TARIEF,
    land: 'NL',
    aangemeldOpDag: 20,
  });
  it('betaalt de heenzendkosten terug', () => {
    expect(r.heenzendCents).toBe(NL_TARIEF);
  });
  it('houdt € 10 verwerkingskosten in', () => {
    expect(r.verwerkingCents).toBe(1000);
  });
  it('betaalt € 58,90 terug', () => {
    expect(r.terugbetalingCents).toBe(5890);
  });
});

describe('rekenvoorbeeld 5 — twee hoodies, één terug op dag 20', () => {
  const r = berekenRetour({
    artikelBedragCents: HOODIE,
    behoudenWaardeCents: HOODIE,         // onder de drempel, maar...
    betaaldeVerzendkostenCents: NL_TARIEF, // ...verzending was al betaald
    land: 'NL',
    aangemeldOpDag: 20,
  });
  it('corrigeert niet als de verzending al betaald was', () => {
    expect(r.correctieCents).toBe(0);
  });
  it('betaalt geen heenzendkosten terug bij een gedeeltelijke retour', () => {
    expect(r.heenzendCents).toBe(0);
  });
  it('betaalt € 49,95 terug', () => {
    expect(r.terugbetalingCents).toBe(4995);
  });
});

describe('valstrik 1 — volledige retour boven de drempel', () => {
  it('betaalt alles terug, ook al kostte de verzending ons geld', () => {
    const r = berekenRetour({
      artikelBedragCents: 3 * HOODIE,
      behoudenWaardeCents: 0,
      betaaldeVerzendkostenCents: 0,
      land: 'NL',
      aangemeldOpDag: 1,
    });
    expect(r.correctieCents).toBe(0);
    expect(r.terugbetalingCents).toBe(3 * HOODIE);
  });
});

describe('valstrik 2 — tweede retour op dezelfde bestelling', () => {
  it('houdt de verzendcorrectie nooit twee keer in', () => {
    // Eerste retour zakte al onder de drempel en hield € 8,95 in.
    const tweede = berekenRetour({
      artikelBedragCents: HOODIE,
      behoudenWaardeCents: CAP,          // nog steeds onder de drempel
      betaaldeVerzendkostenCents: 0,
      land: 'NL',
      aangemeldOpDag: 6,
      alIngehoudenCorrectieCents: NL_TARIEF,
    });
    expect(tweede.correctieCents).toBe(0);
    expect(tweede.terugbetalingCents).toBe(HOODIE);
  });
});

describe('verzendcorrectie', () => {
  const basis = {
    artikelBedragCents: HOODIE,
    betaaldeVerzendkostenCents: 0,
    aangemeldOpDag: 1,
  };
  it('gebruikt het tarief van het bezorgland', () => {
    expect(verzendcorrectie({ ...basis, behoudenWaardeCents: HOODIE, land: 'BE' })).toBe(1250);
    expect(verzendcorrectie({ ...basis, behoudenWaardeCents: HOODIE, land: 'DE' })).toBe(1250);
  });
  it('is nooit hoger dan het werkelijke tarief', () => {
    const c = verzendcorrectie({ ...basis, behoudenWaardeCents: HOODIE, land: 'NL' });
    expect(c).toBeLessThanOrEqual(NL_TARIEF);
  });
});

describe('verwerkingskosten', () => {
  it('geldt niet in de wettelijke bedenktijd', () => {
    expect(verwerkingskosten(1)).toBe(0);
    expect(verwerkingskosten(14)).toBe(0);
  });
  it('geldt vanaf dag 15', () => {
    expect(VERWERKING_VANAF_DAG).toBe(15);
    expect(verwerkingskosten(15)).toBe(1000);
    expect(verwerkingskosten(30)).toBe(1000);
  });
});

describe('waardevermindering', () => {
  it('gaat er als laatste af en kan nooit onder nul uitkomen', () => {
    const r = berekenRetour({
      artikelBedragCents: HOODIE,
      behoudenWaardeCents: 0,
      betaaldeVerzendkostenCents: 0,
      land: 'NL',
      aangemeldOpDag: 20,
      waardeverminderingCents: 999999,
    });
    expect(r.terugbetalingCents).toBe(0);
  });
});

describe('isVolledigeRetour', () => {
  it('is volledig zodra de klant niets overhoudt', () => {
    expect(isVolledigeRetour(0)).toBe(true);
    expect(isVolledigeRetour(1)).toBe(false);
  });
});
