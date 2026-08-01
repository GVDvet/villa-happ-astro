# Astro 7: openstaande migratie

**Status:** open, ingepland na livegang
**Aanleiding:** PR #25 (gemerged) en PR #27 (teruggedraaid), 1 augustus 2026

Astro 7 is geprobeerd en teruggedraaid. Dit document legt vast wat er
misging, waarom het niet met een instelling op te lossen is, en wat er
moet gebeuren om het alsnog te doen.

---

## Waarom dit moet gebeuren

De site staat op `astro@6.4.8` en daar hangt één beveiligingsmelding aan
die alleen met een major upgrade verdwijnt:

| | Melding | Waarom hij nu geen brand is |
|---|---|---|
| hoog | Reflected XSS via ongeescapete View Transition-animatie-eigenschappen | De site geeft alleen statische waarden aan `transition:name` (productslug op de PDP, vaste namen elders). Er is geen pad waarlangs invoer van buiten in die eigenschappen belandt. |
| hoog | `sharp` erft libvips-CVE's | Beeldverwerking op build-moment, over bestanden die zelf in de repo staan. Geen invoer van buiten. |
| middel | `@astrojs/vercel` | Erft van `astro`, verdwijnt met de bovenstaande. |
| laag | `esbuild` bestandslezen op de dev-server | Alleen Windows, alleen dev, niet in productie. |

Geen van de vier is vanaf het internet te misbruiken op deze site. Ze
blijven wel in de Dependabot-teller staan, en de XSS-melding verdient een
echte oplossing zodra er tijd is.

Alles wat zonder major bump op te lossen was, is al gedaan: van 17
meldingen naar 4, inclusief de kritieke `tar`. Zie PR #25 en #27.

---

## Wat er misging

Astro 7 past **JSX-whitespaceregels** toe. Staat een element op een
volgende regel dan de tekst ervoor, dan verdwijnt de spatie ertussen.

```
Astro 6:  Vragen over privacy stel je via bestellingen@villa-happ.nl
Astro 7:  Vragen over privacy stel je viabestellingen@villa-happ.nl

Astro 6:  Home · Shop · Brands · Drops
Astro 7:  Home·Shop·Brands·Drops
```

De bron ziet er zo uit, en dat is door de hele codebase het normale patroon:

```astro
<p>
  Vragen over privacy stel je via
  <a href={`mailto:${BUSINESS.privacyEmail}`}>{BUSINESS.privacyEmail}</a>.
</p>
```

Gemeten met een strikte tekstvergelijking van beide builds:
**1871 plekken waar twee woorden tegen elkaar komen te staan, verspreid
over alle 30 pagina's.** Geen enkele pagina ontsnapt.

### `compressHTML` is geen uitweg

Alle drie de waarden geven hetzelfde resultaat:

```
Astro 7, compressHTML: 'jsx'   -> verschilt van v6 op 30 van 30 pagina's
Astro 7, compressHTML: true    -> verschilt van v6 op 30 van 30 pagina's
Astro 7, compressHTML: false   -> verschilt van v6 op 30 van 30 pagina's
```

De regels zitten in de nieuwe Rust-compiler, niet in die optie.

---

## De valkuil in het meten

Dit is het belangrijkste deel van dit document.

De eerste verificatie meldde **nul verschillen** en dat was fout. De
extractor zette bij het verwijderen van een tag een spatie terug:

```python
s = re.sub(r'<[^>]+>', ' ', s)     # FOUT voor deze controle
```

Daardoor leverden `via <a>adres</a>` en `via<a>adres</a>` allebei
`via adres` op. Het meetinstrument was precies blind voor de fout die
gezocht werd, en de groene uitslag werd als bewijs gepresenteerd.

De juiste manier staat in [`scripts/tekst-uit-build.py`](../scripts/tekst-uit-build.py):
tags worden verwijderd **zonder** vervangende spatie, zodat een ontbrekende
spatie meteen zichtbaar wordt als aan elkaar geplakte woorden.

**Vertrouw bij deze migratie geen enkele controle die niet met die
strikte extractor is gedaan.**

---

## Werkplan

1. **Upgraden** naar `astro@7` en `@astrojs/vercel@11`. De override op
   `path-to-regexp` in `package.json` mag er dan waarschijnlijk uit;
   controleer eerst of `@vercel/routing-utils` inmiddels zelf is
   bijgewerkt.

2. **Nulmeting maken vóór de upgrade:**

   ```bash
   npm run build
   python scripts/tekst-uit-build.py .tmp/voor
   ```

3. **Bronnen aanpassen.** Overal waar tekst en een inline element door een
   newline gescheiden zijn, een expliciete spatie afdwingen. In Astro werkt
   `{' '}` net als in JSX:

   ```astro
   Vragen over privacy stel je via{' '}
   <a href={...}>{BUSINESS.privacyEmail}</a>.
   ```

   Alternatief is de tekst en het element op één regel zetten, maar dat
   maakt lange alinea's onleesbaar in de bron.

   Aandachtsgebieden, gesorteerd op aantal getroffen plekken:

   | Bestand | Waarom |
   |---|---|
   | `src/pages/privacy.astro` | veel links midden in een zin |
   | `src/pages/algemene-voorwaarden.astro` | idem |
   | `src/pages/cookies.astro` | idem |
   | `src/pages/herroeping.astro` | idem |
   | `src/components/layout/Header.astro` | scheidingstekens tussen navlinks |
   | `src/components/layout/Footer.astro` | idem |
   | `src/pages/shop/[slug].astro` | trust-badges, FAQ, accordeons |
   | `src/pages/faq.astro`, `retourneren.astro`, `verzending.astro` | lopende tekst met links |

4. **Na elke ronde vergelijken:**

   ```bash
   npm run build
   python scripts/tekst-uit-build.py .tmp/na
   python scripts/vergelijk-builds.py .tmp/voor .tmp/na
   ```

   Klaar is het pas bij **nul verschillen**.

5. **Daarna pas visueel nalopen.** De strikte vergelijking vangt
   ontbrekende spaties, geen layout die verschuift doordat er ergens een
   whitespace-node wegvalt in een flex- of grid-container. Loop de 30
   pagina's door op desktop en mobiel.

6. **Overige v7-punten controleren** (raakten dit project bij de vorige
   poging niet, maar dat kan veranderen): strengere compiler die
   onafgesloten tags weigert, `src/fetch.ts` als gereserveerde naam, de
   gewisselde markdown-processor voor de journal-artikelen, en Vite 8.

---

## Wanneer

Na livegang en na de eerste weken met echte bestellingen. Niet ervoor:
een migratie die op 1871 plekken tekst raakt, verifieer je niet in de
week dat de betaalkoppeling erbij komt.
