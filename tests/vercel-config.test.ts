/**
 * vercel.json wordt door Vercel tegen een strikt schema gehouden. Een sleutel
 * die daar niet in staat laat de build meteen falen, nog voordat er iets
 * gebouwd wordt — en dat merk je niet lokaal, want `astro build` leest dit
 * bestand niet.
 *
 * Zo is het ook misgegaan: er stond een uitlegregel "_crons_toelichting" in,
 * bedoeld als commentaar. JSON kent geen commentaar. Elke deploy faalde
 * daarop, terwijl de tests en `astro check` gewoon groen waren.
 */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const config = JSON.parse(
  readFileSync(resolve(process.cwd(), 'vercel.json'), 'utf-8'),
);

/** Wat Vercel op het hoogste niveau accepteert en wij daadwerkelijk gebruiken. */
const TOEGESTAAN = new Set([
  'buildCommand', 'cleanUrls', 'crons', 'devCommand', 'framework', 'functions',
  'git', 'headers', 'images', 'installCommand', 'outputDirectory', 'public',
  'redirects', 'regions', 'rewrites', 'routes', 'trailingSlash', 'version',
]);

describe('vercel.json', () => {
  it('bevat geen sleutels die Vercel niet kent', () => {
    const onbekend = Object.keys(config).filter((k) => !TOEGESTAAN.has(k));
    expect(onbekend).toEqual([]);
  });

  it('bevat geen pseudo-commentaar', () => {
    // Een sleutel met een underscore ervoor is bijna altijd een poging om
    // commentaar in JSON te smokkelen. Zet die uitleg in de code ernaast.
    const commentaar = Object.keys(config).filter((k) => k.startsWith('_'));
    expect(commentaar).toEqual([]);
  });

  it('houdt de cron binnen wat het abonnement toestaat', () => {
    // Vercel Hobby staat maximaal één keer per dag toe. Een expressie die
    // vaker vuurt wordt bij het deployen geweigerd. Op Pro mag dit ruimer;
    // pas dan deze test mee aan, bewust en met de reden erbij.
    for (const cron of config.crons ?? []) {
      const [minuut, uur] = String(cron.schedule).split(' ');
      expect(minuut, `cron ${cron.path}: minuut moet vast staan`).not.toContain('*');
      expect(uur, `cron ${cron.path}: uur moet vast staan op Hobby`).not.toContain('*');
    }
  });
});
