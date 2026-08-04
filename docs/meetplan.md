# Meetplan — GA4 en Google Ads

Wat we meten, waarom, en waarop het vuurt. Dit document gaat vóór de
implementatie: een tag zonder meetplan levert cijfers op die niemand kan
duiden. Wijkt de implementatie hiervan af, dan is de implementatie fout.

## Projectkaart

| | |
|---|---|
| Domein | `villa-happ.nl` (apex; `www` doet 308 naar apex) |
| Platform | Astro 6 op Vercel, met View Transitions (SPA-navigatie) |
| Betaalprovider | Mollie — iDEAL, Bancontact, Mastercard, Visa |
| Valuta | EUR |
| Tijdzone | Europe/Amsterdam |
| CMP | Eigen banner (`src/components/layout/ConsentBanner.astro`) |
| GTM-container | **nog aan te maken** → `PUBLIC_GTM_ID` |
| GA4-property | **nog aan te maken** → meet-ID in GTM, niet in de code |
| Google Ads | **nog aan te maken** → conversie-ID in GTM |
| Bestaande tags | Geen. Alleen Vercel Web Analytics (cookieloos, blijft staan) |

Er staat bewust **geen** hardcoded `gtag.js` of GA4-plugin in de site. Alles
loopt via één GTM-container. Een tweede meetlijn ernaast levert dubbele
`page_view`- en `purchase`-hits op.

## Events

| Event | Vuurt op | Key event | Naar Ads | Waarde |
|---|---|---|---|---|
| `page_view` | elke paginaweergave, ook na een SPA-swap | nee | nee | — |
| `view_item` | productpagina geladen | nee | nee | prijs |
| `add_to_cart` | stuk toegevoegd aan mandje | nee | nee | prijs × aantal |
| `begin_checkout` | checkoutpagina geladen met een gevuld mandje | nee | nee | subtotaal |
| `purchase` | **bevestigde** betaling op de bedanktpagina | **ja** | **ja** | ordertotaal |
| `generate_lead` | contactformulier of merkaanmelding succesvol verstuurd | **ja** | optioneel | — |

### Waarom `purchase` pas bij een bevestigde betaling

Mollie stuurt de klant naar de bedanktpagina bij **elke** afloop — betaald,
mislukt, verlopen of afgebroken in de bankapp. De pagina haalt zelf de status
op bij `/api/checkout/status` en toont pas "Welkom in het archief" als die
`paid` teruggeeft.

`purchase` hangt aan diezelfde bevestiging. Zou hij op het laden van de
pagina vuren, dan tel je elke afgebroken betaling als omzet en stuur je
Google Ads aan op inkomsten die nooit binnenkwamen.

`transaction_id` is het bestelnummer (`VH-2026-…`), uniek per bestelling en
stabiel bij herladen. GA4 ontdubbelt daarop, dus een klant die de
bedanktpagina ververst telt één keer.

### Waarom `generate_lead` niet op de knop

Het contactformulier en de merkaanmelding posten naar `/api/contact`. Die
route geeft 503 als de mail niet verstuurd kan worden, en de pagina toont dan
een eerlijke foutmelding. `generate_lead` vuurt alleen op het antwoord waarin
`success` staat — niet op de klik, niet op de submit.

## Wat er nooit in mag

Geen persoonsgegevens naar GA4. Geen e-mailadres, naam, telefoonnummer of
adres, ook niet in parameters, ook niet in URL's of UTM's. De
`items`-parameters bevatten uitsluitend product-id, naam, prijs en aantal.

De bedanktpagina draagt een ondertekend token in de URL (`?t=…`). Dat is geen
PII, maar het hoort ook niet in een rapportage thuis; GA4 krijgt alleen het
bestelnummer uit het API-antwoord.

## Consent Mode v2

Alle vier de signalen staan standaard op `denied`, vóórdat GTM laadt:

```
analytics_storage · ad_storage · ad_user_data · ad_personalization
```

De banner werkt de signalen bij naar de keuze van de bezoeker. Twee knoppen,
gelijkwaardig gepresenteerd: alles accepteren of alleen noodzakelijk. Een
derde knop opent de details per categorie.

Weigert de bezoeker, dan blijft alles op `denied` en stuurt Google
cookieloze pings. Dat is bedoeld gedrag: je ziet dan modelmatige data in GA4,
geen nul.

Toestemming wordt nooit op `granted` gezet om een waarschuwing te laten
verdwijnen.

## Ads-conversieroute

**Route A: GA4-key event importeren in Google Ads.** GA4 is de bron van
waarheid; `purchase` en `generate_lead` worden daar als key event gemarkeerd
en in Ads geïmporteerd.

Kies je later Route B (native Ads-tag via GTM, nodig voor enhanced
conversions of view-through), zet dan de geïmporteerde GA4-conversie op
secundair. Dezelfde actie tweemaal als primaire conversie telt dubbel en
verpest je biedingen.

Auto-tagging blijft aan. `gclid` en `_gl` mogen nooit uit de URL gestript
worden — let daarop als er ooit een redirect of URL-opschoner bij komt.

## Testscenario vóór publicatie

Met Tag Assistant en GA4 DebugView:

1. Eerste bezoek → banner verschijnt, geen enkele hit vóór de keuze
2. Alleen noodzakelijk → signalen blijven `denied`, cookieloze pings
3. Analytics toestaan → `analytics_storage` op `granted`
4. Advertentie toestaan → alle vier op `granted`
5. Keuze wijzigen via de link in het cookiebeleid
6. Nieuwe pagina binnen de SPA → precies één `page_view`, niet nul en niet twee
7. Terugkerend bezoek → geen banner, keuze onthouden
8. Volledige bestelling → één `purchase` met het juiste bedrag
9. Afgebroken betaling → **geen** `purchase`
10. Bedanktpagina herladen → geen tweede `purchase`

Punt 6 en 9 zijn waar dit soort opstellingen in de praktijk stukgaat.
