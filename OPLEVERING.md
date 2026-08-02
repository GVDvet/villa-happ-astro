# Villa Happ — opleverchecklist

Alles wat nog van jou moet komen voordat de site live kan. Vul dit bestand in
(of stuur me de antwoorden), dan zet ik de placeholders om naar de echte
waarden. Per regel staat waar het terechtkomt en wat er misgaat als het
ontbreekt.

**Legenda:** 🔴 blokkeert livegang · 🟠 nodig binnen een week · 🟢 mag later

---

## A. Bedrijfsgegevens

Deze staan allemaal in **één bestand**: [`src/lib/business.ts`](src/lib/business.ts).
Ik vervang daar de `PENDING`-waarden; verder hoeft er niets aangepast te
worden, want de footer, de juridische pagina's, het schema en de
transactiemails lezen allemaal uit dat bestand.

| | Gegeven | Antwoord | Waar het verschijnt |
|---|---|---|---|
| 🔴 | **Btw-identificatienummer** (`NL……B..`) | | Footer, voorwaarden, privacy, orderbevestiging, Organization-schema |
| 🔴 | **Bezoekadres** — straat + nummer | | Voorwaarden, privacy, Organization-schema |
| 🔴 | **Bezoekadres** — postcode | | idem |
| 🔴 | **Bezoekadres** — plaats | | idem |
| 🔴 | **Retouradres** — tenaamstelling | | Retourpagina, herroepingsformulier, voorwaarden |
| 🔴 | **Retouradres** — straat + nummer | | idem |
| 🔴 | **Retouradres** — postcode | | idem |
| 🔴 | **Retouradres** — plaats | | idem |
| 🟠 | **Telefoonnummer** | | Contactpagina, footer, schema (sterk vertrouwenssignaal) |
| 🟠 | **Telefonische bereikbaarheid** | | Alleen nodig als er een nummer komt |

> **Let op bij het btw-nummer:** het gaat om je btw-**identificatie**nummer
> (`NL……B..`), niet om je omzetbelastingnummer. Dat laatste is op je BSN
> gebaseerd en hoort nooit gepubliceerd te worden.

> **Let op bij het bezoekadres:** art. 3:15d BW vraagt om een *geografisch*
> adres; een postbus voldoet daar formeel niet aan. Zolang dit ontbreekt toont
> de site je postadres (Postbus 1, 5140 AA Waalwijk) en staat er "Postadres"
> boven in plaats van "Vestigingsadres". Dat is een werkbare tussenstand, geen
> eindstand. Een flexplek of bedrijfsverzamelgebouw lost het volledig op voor
> een paar tientjes per maand.

---

## B. Beslissingen die ik niet voor je kan nemen

| | Vraag | Waarom het uitmaakt |
|---|---|---|
| 🔴 | **Heet de hoodie "Olijfgroen" of iets anders?** De foto is saliegroen (gemeten: `#828875`), niet olijf. Ik heb het kleurstaal gelijkgetrokken met de foto, maar de naam is aan jou: naam aanpassen, of opnieuw fotograferen. | Kleurverwachting versus levering is dé retouroorzaak in fashion |
| 🔴 | **Blijven de sokken in de shop?** Ze hebben nu het logo als productfoto (256×256, uitgerekt in een 600×750 kader). | Twee van de vijf producten in de shop hebben geen echte foto |
| 🟠 | **Klopt "Vercel Web Analytics gebruikt geen cookies"?** Ik heb dat zo in het cookiebeleid gezet omdat het product cookieloos is. Bevestig het even. | Als het níet klopt is er wél een cookiebanner nodig |
| 🟠 | **Gaan `/drops` en `/brands` gevuld worden, of eruit?** Ze staan nu op `noindex` en buiten de sitemap. | Lege pagina's in de nav kosten vertrouwen |
| 🟢 | **Wil je dubbele opt-in op de nieuwsbrief?** Nu is het enkele opt-in met een expliciete toestemmingscheckbox. | Dubbele opt-in is bewijsbaarder bij een AVG-klacht |

---

## C. Accounts, keys en installaties

### C0. Volgorde van de uitrol 🔴

**Doe dit in deze volgorde.** De sleutels staan al in Vercel, de code op
`main` verwacht tabellen en variabelen die er nog niet allemaal zijn.

1. **Zet `AUTH_SECRET` in Vercel** (minimaal 32 tekens). Zonder deze is
   afrekenen uitgeschakeld: `/api/checkout/create` geeft een 503 en er komt
   geen bestelling doorheen.

   Genereer hem samen met je beheerwachtwoord. **Draai dit vanuit de
   projectmap**, niet vanuit `Documents`:

   ```powershell
   cd "$HOME\Documents\Websites_en_tools\Villa Happ\Astro_Website"
   npm run beheer:hash -- 'kies-hier-een-wachtwoord'
   ```

   Dat print twee waarden: de `ADMIN_PASSWORD_HASH` die bij jouw wachtwoord
   hoort, en een willekeurige `AUTH_SECRET`.
2. **Zet `ADMIN_PASSWORD_HASH`** uit datzelfde commando. Zonder deze blijft
   `/beheer` op het inlogscherm staan.
3. **Draai de migraties** (zie C1). Zonder de tabel `uitgaande_mail` wordt
   er geen orderbevestiging verstuurd: de bestelling lukt, de klant hoort
   niets.
4. Pas daarna de Mollie-testronde uit C2 doorlopen.

### C1. Supabase 🔴

De sleutels staan sinds 9 juni in Vercel. Wat nog ontbreekt is het schema:
zolang `seed.sql` niet gedraaid is, valt de shop terug op de
demo-catalogus, en zolang de nieuwe migraties niet gedraaid zijn, mist het
orderbeheer zijn tabellen.

- [ ] Project aanmaken in **regio EU (Frankfurt)**
- [ ] `supabase/schema.sql` draaien (bevat alles, inclusief de nieuwe migraties)
- [ ] `supabase/seed.sql` draaien (echte catalogus, prijzen, voorraad)
- [ ] Drie keys in Vercel zetten: `PUBLIC_SUPABASE_URL`, `PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`

**Draai je op een bestáánde database?** Dan deze migraties in volgorde,
vóórdat de nieuwe code live gaat:

| Migratie | Waarom |
|---|---|
| `20260731_rls_drop_notifications.sql` | Zet RLS aan op een tabel met e-mailadressen die er buiten viel |
| `20260731_atelier_number_sequence.sql` | Race-vrije nummertoewijzing + uniek nummer per oplage |
| `20260801_orderbeheer.sql` | Ordertijdlijn, mail-outbox en gedeelde rate limit voor het orderbeheer |
| (schema.sql bevat ze allemaal voor verse databases) | |

> ⚠️ **Volgorde is belangrijk.** Draai de migraties vóór de deploy. Doe je dat
> niet, dan schrijft de code naar tabellen die nog niet bestaan.
>
> Getest: `schema.sql` is drie keer achter elkaar op dezelfde database
> gedraaid zonder fouten, en daarna nog een keer volledig vers. Je kunt hem
> dus veilig opnieuw draaien als je twijfelt of hij aankwam.

### C2. Mollie 🔴

- [ ] Account aanmaken en laten verifiëren (KvK, bankrekening, identiteit)
- [ ] Betaalmethoden aanzetten: iDEAL, Bancontact, Mastercard, Visa — dit zijn precies de vier die de site toont
- [ ] `MOLLIE_API_KEY` in Vercel (`test_…` om te testen, `live_…` bij livegang)
- [ ] Webhook-URL controleren: `https://villa-happ.nl/api/checkout/webhook`

**Testscenario dat je zelf moet doorlopen** (met de test-key), omdat ik geen
Mollie-account kan gebruiken:

1. Bestelling plaatsen → iDEAL kiezen → **betaling voltooien** → verwacht: "Welkom in het archief", mandje leeg, bevestigingsmail
2. Bestelling plaatsen → **betaling annuleren** in de bankomgeving → verwacht: "Er is niets afgeschreven", **mandje intact**, geen bestelling
3. Bestelling plaatsen → **betaling laten mislukken** (Mollie-testmethode "failed") → verwacht: zelfde als 2
4. Controleer in Supabase dat de voorraad bij 2 en 3 is **teruggegeven** (`inventory.reserved` weer omlaag)

### C3. Resend (transactiemail) 🔴

Zonder dit verstuurt de site geen orderbevestiging, geen verzendbevestiging,
geen voorraadmelding, en werkt het contactformulier niet.

- [ ] Account aanmaken
- [ ] Domein `villa-happ.nl` verifiëren (SPF + DKIM-records bij de domeinbeheerder)
- [ ] `RESEND_API_KEY` in Vercel
- [ ] `MAIL_FROM` in Vercel, bv. `Villa Happ <bestellingen@villa-happ.nl>`
- [ ] Zorg dat `bestellingen@villa-happ.nl` een échte mailbox is die je leest — daar komen contactformulier-berichten en klantreacties binnen

### C4. Vercel 🔴

- [ ] Domein `villa-happ.nl` koppelen (plus `www` → redirect naar apex)
- [ ] `PUBLIC_SITE_URL=https://villa-happ.nl` zetten — **belangrijk**: zonder dit staan er verkeerde URL's in de sitemap, robots.txt, llms.txt en in de links in je mails
- [ ] `AUTH_SECRET` zetten (minimaal 32 tekens) — **hier hangt afrekenen aan**. De redirect naar de bedanktpagina draagt een ondertekend token, dus zonder deze variabele weigert `/api/checkout/create` met een 503 en kan er niemand bestellen. Ook nodig voor de volglinks in je mails en de beheersessie.
- [ ] `ADMIN_PASSWORD_HASH` zetten — je beheerwachtwoord. Genereer beide met één commando:

```bash
npm run beheer:hash -- 'jouw-wachtwoord-hier'
```

- [ ] `CRON_SECRET` zetten (beveiligt de back-in-stock-verzender)
- [ ] Na livegang: controleren dat `strict-transport-security` in de response headers staat

> **Let op bij `AUTH_SECRET`:** rotereer je die later, dan verlopen alle
> volglinks die al in mailboxen van klanten liggen. Zet hem één keer goed.

> **Waarom geen `$` in de wachtwoordhash:** de hash gebruikt dubbele punten
> als scheidingsteken. Een `$` in een omgevingsvariabele wordt door dotenv
> als variabele gelezen, waarna de salt eruit verdwijnt en het juiste
> wachtwoord een 401 geeft zonder enige foutmelding. Dat is tijdens de bouw
> een keer gebeurd; vandaar dat formaat.

### C6. Orderbeheer in gebruik nemen 🟠

Zodra Supabase en de sleutels staan:

- [ ] Ga naar `https://villa-happ.nl/beheer` en log in
- [ ] Controleer dat de proefbestelling uit de Mollie-test in de lijst staat
- [ ] Zet hem op verzonden met een test-tracking en kijk of de mail aankomt
- [ ] Open de klantlink onderaan de orderpagina en kijk of de tijdlijn klopt
- [ ] Zet hem op bezorgd en controleer de tijdlijn opnieuw

### C5. Google 🟢

- [ ] Search Console koppelen, sitemap indienen (`https://villa-happ.nl/sitemap.xml`)
- [ ] Rich Results Test draaien op een productpagina (Product/ProductGroup + FAQ + Breadcrumb)

---

## D. Wat ik nog niet heb kunnen doen

Eerlijk over de grenzen van deze oplevering:

| | Onderwerp | Toelichting |
|---|---|---|
| 🔴 | **Echte productfotografie** | Alle beelden ogen als AI-mockups, met wisselende achtergrondkleuren (perzik vs crème) tussen voor- en achterkant. Op de achterkantfoto's is bovendien geen borduursel te zien, terwijl Het Atelier "geborduurd, niet geprint" als kernbelofte voert. Voor een merk dat op vakmanschap leunt is dit de investering met de hoogste opbrengst. |
| 🟠 | **2FA op het beheerportaal** | Nu één wachtwoord. Voor een eenmanszaak verdedigbaar, maar een tweede factor is de logische volgende stap. Staat als hardeningpunt, niet als bestaande claim. |
| 🟠 | **Mailwachtrij bij grote drops** | De outbox verstuurt direct en anders via de dagelijkse cron of de knop in beheer. Vercel Hobby staat één cron per dag toe; ga je drops van honderden stuks doen, dan wil je Vercel Pro met een cron per uur. |
| 🟢 | **CSP is strak maar niet perfect** | `script-src` heeft `'unsafe-inline'` nodig omdat Astro inline scripts genereert en er bij een statische build geen nonce per request bestaat. Alle plekken waar HTML wordt samengesteld uit variabelen (zoekresultaten, reviews) escapen hun invoer — dat heb ik geverifieerd. |
| 🟢 | **3D-viewer staat uit** | Zet je hem weer aan, dan laadt `@google/model-viewer` decoders van `gstatic.com` en `jsdelivr.net`. Die staan niet in de CSP; de viewer blijft dan zwart zonder zichtbare fout. Staat als waarschuwing bij de code. |

---

## E. Zo lever je het aan

Vul de tabellen in A en B in en stuur ze terug, of zeg gewoon per regel wat
het moet zijn. Ik pas dan `src/lib/business.ts` aan, draai de tests en de
build opnieuw, en controleer dat de gegevens overal correct doorkomen —
footer, juridische pagina's, schema en de mailsjablonen.

Zolang een gegeven ontbreekt toont de site geen halve zin: het veld valt terug
op "volgt" of wordt weggelaten. De build logt bij elke run welke gegevens nog
open staan, zodat er niets stilletjes ontbrekend live gaat.
