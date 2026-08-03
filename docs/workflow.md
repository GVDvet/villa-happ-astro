# Werkwijze — code, deploy en DNS

Dit document beschrijft hoe je een wijziging van je laptop naar
`villa-happ.nl` krijgt, en welke valkuilen daar onderweg liggen. Het is
geschreven na een livegang waarin een aantal daarvan is ingelopen: er is een
uur besteed aan een deploy die nooit kon werken omdat er naar de verkeerde
repository was gepusht.

Lees dit vóór je iets deployt. De vier kaders zijn de plekken waar het
daadwerkelijk misging.

---

## 1. Waar de dingen staan

| Wat | Waar |
|---|---|
| **Leidende repository** | `github.com/rutgeraquachain-create/villa-happ-astro` (remote `origin`) |
| Kopie | `github.com/GVDvet/villa-happ-astro` (remote `gvdvet`) |
| Vercel-project | `villa-happ-astro`, team `villa-happ-project` |
| Vercel-eigenaar | account `rutgeraquachain-7642` |
| DNS | **Strato** (`shades13.rzone.de` / `docks15.rzone.de`) |
| Mail | Microsoft 365 |
| Transactiemail | Resend, via subdomein `send.villa-happ.nl` |
| Database | Supabase, project `Villa-Happ` (`xnlsuindjegvbcpmusnp`) |

> **Valkuil 1 — twee repositories.**
> Vercel bouwt **uitsluitend** uit `rutgeraquachain-create`. Een push naar
> `gvdvet` triggert niets en levert geen enkele foutmelding op: je ziet een
> geslaagde push, GitHub toont je commit, en er gebeurt verder niets. Zo is
> er een uur gezocht naar een "kapotte" Vercel-integratie die prima werkte.
>
> Controleer vóór een push waar je naartoe gaat:
> ```
> git remote -v
> ```
> `origin` hoort `rutgeraquachain-create` te zijn. Is dat niet zo, herstel
> het met `git remote rename`.

> **Valkuil 2 — het Vercel-account.**
> Het project staat op `rutgeraquachain-7642`, niet op het AIM ONLINE-team.
> De Vercel CLI ingelogd als `geoffreyvdvet-3039` krijgt bij dit domein
> `You don't have permission`. Dat is geen storing maar een scope-kwestie.
> Werk voor dit project in de browser, of log in met het juiste account.

---

## 2. Een wijziging naar productie

```bash
# 1. werken op een branch, nooit rechtstreeks op main
git checkout -b korte-omschrijving

# 2. controleren vóór commit
npx vitest run          # moet volledig groen
npx astro check         # moet 0 errors geven
npx astro build         # moet slagen; dit is wat Vercel straks ook doet

# 3. mergen en pushen
git checkout main
git merge --ff-only korte-omschrijving
git push origin main
```

De push naar `origin/main` triggert automatisch een productiebuild. Er is
**geen** handmatige stap nodig.

> **Valkuil 3 — de Redeploy-knop.**
> "Redeploy" in Vercel herbouwt **dezelfde commit** als de deployment waar
> je op klikt. Het haalt geen nieuwe code op. Wie na een push op Redeploy
> drukt bij de oude deployment, bouwt de oude code opnieuw — met de nieuwe
> environment-variabelen erin, wat het extra verwarrend maakt: `robots.txt`
> klopt dan wél en de pagina's niet.
>
> Wil je een nieuwe deployment zonder push, gebruik dan de knop waarmee je
> zelf een branch of commit kiest, en controleer dat er de juiste commit
> boven staat.

### Wanneer je de build cache moet uitzetten

Bij een wijziging aan een **environment-variabele**. De shoppagina's zijn
geprerenderd, dus `PUBLIC_SITE_URL` wordt tijdens het bouwen ingebakken in
canonical-tags, `sitemap.xml`, `robots.txt`, `llms.txt` en de links in de
transactiemails. Een build uit cache neemt de oude waarde mee.

---

## 3. Environment-variabelen

Dit is wat de code werkelijk uitleest. Afgeleid uit de broncode, niet uit
een checklist:

| Variabele | Zonder deze |
|---|---|
| `PUBLIC_SITE_URL` | site blijft op `noindex` staan, zie hieronder |
| `PUBLIC_SUPABASE_URL` | geen catalogus |
| `PUBLIC_SUPABASE_ANON_KEY` | geen catalogus |
| `SUPABASE_SERVICE_ROLE_KEY` | geen orders, voorraad of beheer |
| `MOLLIE_API_KEY` | geen betalingen; `test_` of `live_` |
| `AUTH_SECRET` | **afrekenen geeft 503**, minimaal 32 tekens |
| `ADMIN_PASSWORD_HASH` | geen toegang tot `/beheer` |
| `CRON_SECRET` | back-in-stock-verzender staat open |
| `RESEND_API_KEY` | geen transactiemail |
| `MAIL_FROM` | valt terug op de default in `src/lib/mail.ts` |

`DEV`, `PROD` en `VERCEL_GIT_COMMIT_SHA` hoef je niet te zetten.

> **Valkuil 4 — `PUBLIC_SITE_URL` op Preview.**
> Zet deze **alleen op Production**. Staat hij ook op Preview, dan claimen
> previewdeploys de canonical van het echte domein en vervalt daar de
> noindex-bescherming — je previews gaan dan concurreren met je eigen site
> in Google.
>
> Preview hoort géén waarde te hebben. `src/lib/site.ts` valt dan terug op
> het `.vercel.app`-domein, en `isPreviewHost()` zorgt dat `robots.txt` daar
> `Disallow: /` teruggeeft. Dat is bedoeld gedrag, geen fout.

Het genereren van `AUTH_SECRET` en `ADMIN_PASSWORD_HASH` gaat in één keer:

```bash
npm run beheer:hash -- 'jouw-wachtwoord-hier'
```

Let op: de hash gebruikt dubbele punten als scheidingsteken, geen `$`. Een
`$` in een env-waarde wordt als variabele gelezen en sloopt de salt.

---

## 4. DNS

**Strato is autoritatief.** Er staat ook een zone in Vercel DNS, maar die is
ongebruikt en doet niets zolang de nameservers bij Strato staan. Wijzig DNS
dus bij Strato, niet in Vercel.

### De records

| Type | Naam | Waarde |
|---|---|---|
| `A` | apex | `216.198.79.1` (Vercel) |
| `CNAME` | `www` | `2683e9e98ace7a22.vercel-dns-017.com.` |
| `CNAME` | `autodiscover` | `autodiscover.outlook.com.` |
| `MX` | apex | `villahapp-nl01c.mail.protection.outlook.com` (prio 10) |
| `TXT` | apex | `MS=ms71999403` — Microsoft-verificatie |
| `TXT` | apex | `v=spf1 include:spf.protection.outlook.com -all` |
| `TXT` | apex | `google-site-verification=…` |
| `TXT` | `_dmarc` | `v=DMARC1; p=none; rua=…` |
| `TXT` | `resend._domainkey` | DKIM voor Resend |
| `TXT` | `send` | `v=spf1 include:amazonses.com ~all` |

### Waar het A-record zit bij Strato

Niet in de recordlijst. Het staat onder **DNS-beheer → A-record →
Bestemming**, waar je moet kiezen tussen "STRATO standaard IP-adres" en
"eigen IP-adres". Kies de tweede en vul het Vercel-IP in.

Zolang het domein aan een Strato-pakket of webshop gekoppeld is, kan die
keuze geblokkeerd zijn. Dan moet het domein eerst worden losgekoppeld — een
vraag voor Strato-support. De schermen "Domeinomleiding naar webshop" en
"Forward instellen" zijn niet wat je zoekt.

### Twee regels die je mail kosten

1. **Nooit twee SPF-records op dezelfde naam.** De root heeft er precies
   één (Microsoft) en `send` precies één (Amazon SES, voor Resend). Een
   tweede maakt beide ongeldig en dan valt ook je gewone mail om. Moet
   Resend erbij op de root, voeg dan een `include:` toe aan het bestaande
   record — geen nieuw record.
2. **DNSSEC uit vóór een nameserverwijziging.** Verhuis je de nameservers
   terwijl DNSSEC actief is, dan klopt de DS-sleutel bij SIDN niet meer bij
   de nieuwe zone en wordt het domein onbereikbaar verklaard — website én
   mail, zonder begrijpelijke foutmelding. Voor een gewone recordwijziging
   binnen Strato hoeft DNSSEC niet uit.

Strato's statusvlaggen lopen achter op de werkelijkheid. Vertrouw de
resolvers, niet het paneel:

```bash
nslookup -type=A villa-happ.nl 8.8.8.8
```

---

## 5. Controleren na een deploy

De snelste bevestiging dat de **nieuwe** build live staat, is een route die
alleen in de nieuwe code bestaat opvragen. Werkt niet? Dan draait er nog een
oude deployment.

```bash
curl -sI https://villa-happ.nl/voor-merken
```

Verder:

```bash
curl -s https://villa-happ.nl/robots.txt
```

Hier hoort `Allow: /` te staan met een `Sitemap:`-regel op het echte domein.
Staat er `Disallow: /`, dan is `PUBLIC_SITE_URL` niet goed gezet of is de
build uit cache gekomen.

> **Let op bij het controleren.** Vercel cachet aan de edge; een `Age`-header
> van enkele minuten betekent dat je een oude versie ziet. Een query-string
> toevoegen helpt niet, want die telt niet mee in de cache-sleutel van
> geprerenderde pagina's. Test in dat geval via `villa-happ-astro.vercel.app`
> — andere hostname, andere cache.

---

## 6. Dingen die je niet moet doen

- **De Dependabot-branch `astro-7.0.7` mergen.** Astro 7 is eerder
  teruggedraaid wegens een whitespace-regressie op elke pagina (#27). Zie
  `docs/astro-7-migratie.md` voordat je het opnieuw probeert.
- **Onbekende sleutels in `vercel.json` zetten.** JSON kent geen commentaar
  en Vercel weigert sleutels die het niet kent; dat brak elke build (#36).
  Toelichting hoort in de code, niet in dat bestand.
- **"DNS-instellingen resetten" bij Strato.** Dat zet de zone terug naar
  standaard en gooit `MX`, SPF, DKIM en DMARC weg. Je mail ligt er dan uit.
- **Rechtstreeks op `main` committen.** De productiebranch bouwt direct naar
  het live domein.

---

## 7. Waar de bron van waarheid ligt

Wijzig gegevens op één plek; de rest volgt automatisch.

| Wat | Bestand |
|---|---|
| KvK, btw, adressen, mailadres, retourtermijnen | `src/lib/business.ts` |
| Verzendtarieven en gratis-verzendgrens | `src/lib/shipping.ts` |
| Juridische formuleringen (retour, levering, btw) | `src/lib/legal.ts` |
| Merkfeiten voor schema en llms.txt | `src/lib/entity.ts` |
| Domein en indexeerbaarheid | `src/lib/site.ts` |
| Retourberekening | `src/lib/retour.ts`, uitgewerkt in `docs/retourbeleid.md` |

Hardcodeer geen bedragen, adressen of termijnen in een pagina. Dat is eerder
misgegaan: verzendkosten stonden op vijf plekken los ingetypt en liepen uit
de pas met wat de checkout werkelijk rekende.
