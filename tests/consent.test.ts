import { describe, it, expect, beforeEach, vi } from 'vitest';

/**
 * Toestemming en Consent Mode v2.
 *
 * Deze logica is niet in de browser te testen op de dev-server: GTM staat
 * daar bewust uit omdat `isPreviewHost()` localhost als preview telt. De
 * regels die ertoe doen zitten toch in deze module, dus die testen we hier.
 *
 * Wat hier bewaakt wordt is juridisch, niet cosmetisch: een verlopen keuze
 * moet opnieuw gevraagd worden, en de vier signalen moeten exact de keuze
 * volgen. Een bug die `denied` als `granted` doorgeeft is een AVG-overtreding
 * die je nergens aan ziet.
 */

const store = new Map<string, string>();

function resetOmgeving() {
  store.clear();
  const g = globalThis as any;
  g.window = g;
  g.localStorage = {
    getItem: (k: string) => (store.has(k) ? store.get(k)! : null),
    setItem: (k: string, v: string) => { store.set(k, v); },
    removeItem: (k: string) => { store.delete(k); },
  };
  g.dataLayer = [];
}

/** De module leest globals bij import, dus per test opnieuw laden. */
async function laad() {
  vi.resetModules();
  return import('../src/lib/consent');
}

beforeEach(resetOmgeving);

describe('getConsent', () => {
  it('geeft null zolang er niets gekozen is', async () => {
    const { getConsent, hasChosen } = await laad();
    expect(getConsent()).toBeNull();
    expect(hasChosen()).toBe(false);
  });

  it('leest een opgeslagen keuze terug', async () => {
    const { setConsent, getConsent, hasChosen } = await laad();
    setConsent(true, false);
    expect(getConsent()).toMatchObject({ analytics: true, ads: false });
    expect(hasChosen()).toBe(true);
  });

  it('negeert onzin in de opslag', async () => {
    const { CONSENT_KEY, getConsent } = await laad();
    store.set(CONSENT_KEY, 'geen json');
    expect(getConsent()).toBeNull();
    store.set(CONSENT_KEY, JSON.stringify({ analytics: 'ja' }));
    expect(getConsent()).toBeNull();
  });
});

describe('houdbaarheid van een keuze', () => {
  it('houdt een keuze van vandaag', async () => {
    const { setConsent, hasChosen } = await laad();
    setConsent(true, true);
    expect(hasChosen()).toBe(true);
  });

  it('vraagt na twaalf maanden opnieuw', async () => {
    const { CONSENT_KEY, hasChosen } = await laad();
    const teOud = new Date();
    teOud.setMonth(teOud.getMonth() - 13);
    store.set(CONSENT_KEY, JSON.stringify({ analytics: true, ads: true, at: teOud.toISOString() }));
    expect(hasChosen()).toBe(false);
  });

  it('houdt een keuze van elf maanden oud nog vast', async () => {
    const { CONSENT_KEY, hasChosen } = await laad();
    const bijna = new Date();
    bijna.setMonth(bijna.getMonth() - 11);
    store.set(CONSENT_KEY, JSON.stringify({ analytics: true, ads: true, at: bijna.toISOString() }));
    expect(hasChosen()).toBe(true);
  });
});

/** De vier Consent Mode v2-signalen uit de laatste `consent`-aanroep. */
function laatsteSignalen() {
  const dl = (globalThis as any).dataLayer as IArguments[];
  const calls = dl.filter((x: any) => x && x[0] === 'consent');
  return calls.length ? (calls[calls.length - 1] as any)[2] : null;
}

describe('Consent Mode v2-signalen', () => {
  it('zet alle vier op granted bij volledige toestemming', async () => {
    const { setConsent } = await laad();
    setConsent(true, true);
    expect(laatsteSignalen()).toEqual({
      analytics_storage: 'granted',
      ad_storage: 'granted',
      ad_user_data: 'granted',
      ad_personalization: 'granted',
    });
  });

  it('zet alle vier op denied bij weigeren', async () => {
    const { setConsent } = await laad();
    setConsent(false, false);
    expect(laatsteSignalen()).toEqual({
      analytics_storage: 'denied',
      ad_storage: 'denied',
      ad_user_data: 'denied',
      ad_personalization: 'denied',
    });
  });

  it('koppelt de drie advertentiesignalen aan één keuze', async () => {
    const { setConsent } = await laad();
    setConsent(true, false);
    const s = laatsteSignalen();
    expect(s.analytics_storage).toBe('granted');
    expect(s.ad_storage).toBe('denied');
    expect(s.ad_user_data).toBe('denied');
    expect(s.ad_personalization).toBe('denied');
  });

  it('gebruikt update en nooit default', async () => {
    // De defaults staan inline in de <head> vóór GTM. Zou deze module ze
    // opnieuw als 'default' zetten, dan overschrijft dat de eerdere waarden
    // en meet Google alsnog een weergave lang met opslag.
    const { setConsent } = await laad();
    setConsent(true, true);
    const dl = (globalThis as any).dataLayer as any[];
    const modes = dl.filter((x) => x && x[0] === 'consent').map((x) => x[1]);
    expect(modes).toContain('update');
    expect(modes).not.toContain('default');
  });
});

describe('resetConsent', () => {
  it('wist de keuze zodat de banner terugkomt', async () => {
    const { setConsent, resetConsent, hasChosen } = await laad();
    setConsent(true, true);
    resetConsent();
    expect(hasChosen()).toBe(false);
  });
});

describe('applyStoredConsent', () => {
  it('herhaalt een bestaande keuze richting Google', async () => {
    // Zonder dit valt een terugkerende bezoeker terug op de denied-defaults
    // uit de <head>, terwijl hij wél toestemming gaf.
    const { CONSENT_KEY, applyStoredConsent } = await laad();
    store.set(CONSENT_KEY, JSON.stringify({ analytics: true, ads: true, at: new Date().toISOString() }));
    applyStoredConsent();
    expect(laatsteSignalen()).toMatchObject({ analytics_storage: 'granted' });
  });

  it('doet niets als er geen keuze is', async () => {
    const { applyStoredConsent } = await laad();
    applyStoredConsent();
    expect(laatsteSignalen()).toBeNull();
  });
});
