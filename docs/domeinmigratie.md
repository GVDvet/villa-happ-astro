# Migratie naar villahapp.nl

Stappenplan om `villahapp.nl` bij Vercel onder te brengen en `villa-happ.nl`
ernaartoe te laten doorverwijzen. Werk het van boven naar beneden af; de
volgorde is niet willekeurig.

**Uitgangspunt: mail vóór site.** Een verkeerde redirect draai je in vijf
minuten terug. Verloren mail komt niet terug.

## Beginstand

| | |
|---|---|
| `villahapp.nl` | registrar Nameshift, nameservers `ns1/ns2/xmhvxw.ns3.nameshift.com` |
| | A-record `5.83.210.1` (geparkeerd), geen MX, geen TXT |
| | **DNSSEC staat AAN** — dit blokkeert stap 3 |
| `villa-happ.nl` | registrar Strato, DNS bij Strato, site op Vercel, mail Microsoft 365 |
| Vercel-project | `villa-happ-astro`, team `villa-happ-project` |

Je verhuiscode blijft geldig. De registratie hoeft niet mee te verhuizen om
dit af te ronden; dat kan later, of nooit.

---

## Stap 1 — DNSSEC uitzetten bij Nameshift

**Dit eerst, en dit is de enige stap waarmee je het domein echt onbereikbaar
kunt maken.**

`villahapp.nl` heeft een DS-sleutel bij SIDN. Zet je straks de nameservers om
terwijl die er nog staat, dan verwachten resolvers een handtekening die de
nieuwe zone niet kan geven, en verklaren ze het domein ongeldig — site én
mail, zonder foutmelding die je ergens ziet. Vercel DNS ondersteunt DNSSEC
niet, dus het moet uit blijven.

Zet DNSSEC uit in het Nameshift-paneel en wacht tot de sleutel bij het
register weg is. Controleren:

```bash
nslookup -type=DS villahapp.nl 8.8.8.8
```

Ga pas verder als er geen DS-record meer terugkomt. Reken op enkele uren.

---

## Stap 2 — Domein toevoegen aan het Vercel-project

Vercel → project `villa-happ-astro` → **Settings → Domains → Add**.

Voeg toe: `villahapp.nl` én `www.villahapp.nl`. Zet `www` op **Redirect naar
villahapp.nl** (308), net als bij het oude domein.

Vercel toont dan de DNS-records die het verwacht. Noteer de **CNAME-waarde
voor `www`** — dat is een unieke hostnaam per domein (iets als
`<hash>.vercel-dns-017.com`). Die heb je in stap 4 nodig.

Voor de apex hoef je niets te noteren: zodra de nameservers bij Vercel staan,
maakt Vercel daar zelf een ALIAS-record voor aan. Dat is precies het record
waar Strato je bij het oude domein op blokkeerde.

Beide domeinen blijven voorlopig op *Invalid Configuration* staan. Klopt.

---

## Stap 3 — Microsoft 365: domein toevoegen

Nog vóór de nameserverwissel, zodat de mailrecords al klaarstaan.

Microsoft 365 admin center → **Instellingen → Domeinen → Domein toevoegen** →
`villahapp.nl`.

M365 geeft je daarna waarden die **specifiek voor dit domein** zijn en die ik
niet kan voorspellen:

- een `TXT`-record `MS=msXXXXXXXX` voor de verificatie
- een `MX`-host, meestal in de vorm `villahapp-nl.mail.protection.outlook.com`
- een `CNAME` voor `autodiscover`

Noteer ze; ze gaan in stap 4 de Vercel-zone in. Verifiëren lukt pas nadat de
nameservers om zijn — dat is normaal, laat het domein zolang op "in
behandeling" staan.

### De mailboxen zelf

Doe dit **niet** met doorstuurregels. Doorgestuurde mail breekt SPF en DMARC,
kan lussen maken en faalt stil.

Wat je wilt:

1. Voeg `contact@villahapp.nl` toe als **extra e-mailadres op de bestaande
   mailbox** van `contact@villa-happ.nl`
2. Maak `@villahapp.nl` het **primaire** adres
3. Laat `@villa-happ.nl` als **alias** staan

Alles wat naar het oude adres komt landt dan gewoon in dezelfde inbox, en je
kunt vanaf beide adressen versturen. Zolang je `villa-happ.nl` aanhoudt,
verlies je niets — en die moet je toch aanhouden voor de redirects.

---

## Stap 4 — Zone opbouwen in Vercel DNS

Vercel → **Domains** (het accountbrede menu, niet in het project) →
`villahapp.nl` → **DNS Records**.

Voer in wat je in stap 3 hebt gekregen, plus de vaste records:

| Type | Naam | Waarde |
|---|---|---|
| `CNAME` | `www` | de waarde uit stap 2 |
| `MX` | *(leeg)* | de M365-host uit stap 3, prioriteit 10 |
| `TXT` | *(leeg)* | `MS=…` uit stap 3 |
| `TXT` | *(leeg)* | `v=spf1 include:spf.protection.outlook.com -all` |
| `TXT` | `_dmarc` | `v=DMARC1; p=none; rua=mailto:contact@villahapp.nl` |
| `CNAME` | `autodiscover` | `autodiscover.outlook.com.` |

Laat het naamveld leeg voor records op het hoofddomein. **Maak geen
A-record** — dat regelt Vercel zelf.

De Resend-records volgen in stap 5.

---

## Stap 5 — Resend opnieuw verifiëren

Je DKIM staat nu op `resend._domainkey.villa-happ.nl` en je SPF op
`send.villa-happ.nl`. Die gelden **niet** voor het nieuwe domein.

Resend → **Domains → Add domain** → `villahapp.nl`. Je krijgt een nieuwe
DKIM-sleutel en een SPF voor het `send`-subdomein. Zet ze in de Vercel-zone:

| Type | Naam | Waarde |
|---|---|---|
| `TXT` | `resend._domainkey` | de nieuwe sleutel van Resend |
| `TXT` | `send` | `v=spf1 include:amazonses.com ~all` |

> **Nooit twee SPF-records op dezelfde naam.** Het hoofddomein heeft er
> precies één (Microsoft), `send` precies één (Amazon SES). Een tweede maakt
> beide ongeldig en dan valt ook je gewone mail om.

Sla dit niet over. Zonder deze records bouncen je orderbevestigingen zodra
`MAIL_FROM` op `@villahapp.nl` staat.

---

## Stap 6 — Nameservers omzetten

Pas nu, en alleen als stap 1 bevestigd is.

Bij Nameshift, nameservers vervangen door:

```
ns1.vercel-dns.com
ns2.vercel-dns.com
```

Daarna wachten. Een nameserverwijziging duurt langer dan een recordwijziging;
reken op enkele uren, soms tot 24. Controleren:

```bash
nslookup -type=NS villahapp.nl 8.8.8.8
```

Zodra Vercel beide domeinen op *Valid Configuration* zet, geeft het
automatisch SSL-certificaten uit. Verifieer daarna het domein in Microsoft
365 en in Resend; die knoppen slagen nu wel.

---

## Stap 7 — De site omzetten

Nu pas. Code eerst, dan de domeinen in Vercel.

### Codewijzigingen

| Bestand | Wat |
|---|---|
| `src/lib/business.ts` | `orderEmail`, `supportEmail`, `privacyEmail` → `contact@villahapp.nl` |
| `src/lib/entity.ts` | `domain` → `villahapp.nl` |
| `src/lib/mail.ts` | default `MAIL_FROM` → `Villa Happ <contact@villahapp.nl>` |
| `.env.example`, `astro.config.mjs`, `src/lib/site.ts`, `src/pages/robots.txt.ts` | toelichtingen die het oude domein noemen |

### Environment-variabelen in Vercel

| Variabele | Nieuw |
|---|---|
| `PUBLIC_SITE_URL` | `https://villahapp.nl` (alleen Production) |
| `MAIL_FROM` | `Villa Happ <contact@villahapp.nl>` |

### Domeinen in Vercel

- `villahapp.nl` → **Production**
- `www.villahapp.nl` → redirect naar `villahapp.nl`
- `villa-happ.nl` → **Redirect naar `villahapp.nl`**
- `www.villa-happ.nl` → redirect naar `villahapp.nl`

Vercel behoudt daarbij het pad, dus `villa-happ.nl/shop` komt uit op
`villahapp.nl/shop`.

### Deploy

Push naar `main` bij `rutgeraquachain-create`. Bij een wijziging van
`PUBLIC_SITE_URL` moet de build **zonder cache**: canonical, sitemap, robots
en llms.txt worden tijdens het bouwen ingebakken.

### Controleren

```bash
curl -sI https://villa-happ.nl/shop
```

Moet een redirect naar `https://villahapp.nl/shop` geven.

```bash
curl -s https://villahapp.nl/robots.txt
```

Moet `Allow: /` tonen met de sitemap op het nieuwe domein.

De redirects voor de oude ePages-URL's in `vercel.json` blijven werken: die
zijn op pad gebaseerd en gelden dus op elk domein dat de site serveert.

---

## Stap 8 — Google

1. **Search Console:** nieuwe Domein-property voor `villahapp.nl`, verifiëren
   via DNS-TXT, sitemap indienen op `https://villahapp.nl/sitemap.xml`
2. **Adreswijziging** starten vanuit de oude property. Dat kan pas als de
   301's live staan, en de oude property moet geverifieerd blijven — dus
   verwijder hem niet.
3. **GA4:** de URL van de gegevensstroom bijwerken naar het nieuwe domein
4. **Google Ads:** de final URLs in je campagnes bijwerken. Ze blijven werken
   via de redirect, maar een extra hop kost kwaliteitsscore.

De GTM-container hoeft niet aangepast: die laadt op elke pagina waar het
script staat, ongeacht het domein.

---

## Stap 9 — Wat je daarna nooit moet doen

**`villa-happ.nl` laten verlopen.** De 301's moeten jaren blijven staan,
anders verlies je alle opgebouwde linkwaarde in één keer. En je oude
mailadres blijft als alias binnenkomen zolang dat domein van jou is; laat je
het vallen, dan bouncen mails van klanten die je oude adres nog gebruiken.

Reken op minimaal twee jaar, en eigenlijk gewoon: aanhouden.

---

## Later, als je wilt

De registratie van `villahapp.nl` verhuizen van Nameshift naar Strato met je
verhuiscode. Dat kan op elk moment en blokkeert niets. Let er wel op dat
sommige registrars bij een transfer de nameservers terugzetten op hun eigen
standaard — controleer daarna dus of ze nog op Vercel staan.
