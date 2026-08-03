# Retourbeleid — uitwerking

Twee mechanismen die het bestellen-om-te-passen ontmoedigen zonder het
herroepingsrecht te schenden: een **verzendcorrectie** bij gedeeltelijke
retour, en **waardevermindering** bij artikelen die verder zijn gebruikt dan
passen.

Dit document is de bron voor de implementatie én voor de teksten op de site.
Wijkt de code hiervan af, dan is de code fout.

---

## Wettelijk kader in het kort

| Regel | Bron | Gevolg voor ons |
|---|---|---|
| 14 dagen bedenktijd, zonder opgaaf van reden | art. 6:230o BW | Onze 30 dagen zijn ruimer; dag 15–30 is eigen coulance |
| Bij herroeping alle betalingen terug, **inclusief leveringskosten** | art. 6:230r lid 1 | Alleen bij een **volledige** retour |
| Duurdere bezorgkeuze hoeft niet volledig vergoed | art. 6:230r lid 2 | Niet van toepassing: wij bieden één tarief |
| Directe kosten van terugzending voor de consument | art. 6:230s lid 1 | Mag, **mits vooraf gemeld** |
| Waardevermindering verrekenbaar bij gebruik voorbij vaststellen aard en werking | art. 6:230s lid 3 | Mag, **mits vooraf gemeld** en per geval onderbouwd |

Twee dingen die vaak misgaan en die hier dus hard vastliggen:

1. **Vooraf melden is een voorwaarde, geen formaliteit.** Heb je de consument
   niet correct geïnformeerd over het herroepingsrecht, dan vervalt zijn
   aansprakelijkheid voor waardevermindering volledig en draai jij op voor de
   retourkosten. De teksten hieronder zijn dus geen marketing, ze zijn de
   juridische grondslag.
2. **De €10 verwerkingskosten mogen niet in dag 1–14.** Dat is geen kostenpost
   die de wet toestaat. Alleen in dag 15–30, ons eigen venster.

---

## De twee vensters

| | Dag 1–14 (wettelijk) | Dag 15–30 (coulance) |
|---|---|---|
| Retourzending | klant betaalt | klant betaalt |
| Verwerkingskosten | **geen** | € 10,00 |
| Verzendcorrectie | ja, zie mechanisme A | ja |
| Waardevermindering | ja, zie mechanisme B | ja |

Peildatum is de **datum waarop de klant de retour aanmeldt**, niet de datum
waarop het pakket binnenkomt. Anders bepaalt PostNL of iemand €10 betaalt.
Leg die datum vast; zonder aanmelding geldt de datum van ontvangst.

---

## Mechanisme A — verzendcorrectie bij gedeeltelijke retour

### De regel

Gratis verzending geldt vanaf € 150,00 aan **behouden** artikelen. Zakt een
bestelling door een retour onder die drempel, dan verrekenen we alsnog het
verzendtarief van het bezorgland.

### Waarom dit mag

Bij een **gedeeltelijke** retour wordt de overeenkomst niet volledig
herroepen. Art. 6:230r lid 1 verplicht tot teruggave van de leveringskosten
bij herroeping van de overeenkomst; blijft er een deel staan, dan is er
geleverd voor wat de klant houdt en hoeven die kosten niet terug.

De verzendcorrectie is bovendien geen nieuwe kostenpost maar het terugdraaien
van een **voorwaardelijke korting**: gratis verzending was gekoppeld aan een
bestelwaarde van € 150. Vervalt die voorwaarde, dan vervalt de korting. Dat is
dezelfde systematiek als een staffelkorting die herrekend wordt wanneer een
deel van de bestelling terugkomt.

### Randgevallen

Deze tabel is de specificatie. Elk vakje moet in code herkenbaar zijn.

| Situatie | Verzendkosten betaald? | Correctie |
|---|---|---|
| **Volledige** retour | ja | **Terugbetalen.** Nooit inhouden. |
| **Volledige** retour | nee (was gratis) | Geen correctie. Nooit alsnog in rekening brengen. |
| Gedeeltelijke retour, behouden ≥ € 150 | nee | Geen correctie |
| Gedeeltelijke retour, behouden < € 150 | nee | **Tarief bezorgland inhouden** |
| Gedeeltelijke retour, behouden < € 150 | ja | Geen correctie — al betaald, wordt niet terugbetaald |
| Tweede retour op dezelfde bestelling | n.v.t. | Herrekenen op de eindstand, **nooit twee keer inhouden** |

De correctie is nooit hoger dan het werkelijke tarief: € 8,95 (NL) of
€ 12,50 (BE/DE).

> **Let op bij de volledige retour.** Dat is de val. Bij een volledige retour
> van een bestelling boven € 150 moet je het volledige bedrag terugbetalen,
> ook al heb jij de verzending betaald en krijg je die niet terug. Dat verlies
> is wettelijk voor jou. Wie hier alsnog € 8,95 inhoudt, overtreedt art.
> 6:230r lid 1.

### Rekenvoorbeelden

Uitgangspunt: hoodie € 59,95, cap € 21,95, bezorging Nederland.

**1. Drie hoodies, twee terug, binnen 14 dagen**
```
Besteld      3 × 59,95 = 179,85   verzending gratis (≥ 150)
Behouden     1 × 59,95 =  59,95   < 150, dus correctie
Retour       2 × 59,95 = 119,90
Correctie                −  8,95
Terugbetaling             110,95
```
De klant betaalt daarnaast zelf de retourzending.

**2. Zelfde bestelling, alles terug, binnen 14 dagen**
```
Retour       3 × 59,95 = 179,85
Correctie                   0,00   volledige retour: nooit inhouden
Terugbetaling             179,85
```

**3. Drie hoodies + cap, alleen de cap terug**
```
Besteld      201,80   verzending gratis
Behouden     179,85   ≥ 150, geen correctie
Terugbetaling 21,95
```

**4. Eén hoodie van 59,95, verzending 8,95 betaald, volledig retour, dag 20**
```
Retour                  59,95
Heenzendkosten        +  8,95   volledige retour: moet terug
Verwerkingskosten     − 10,00   dag 15-30
Terugbetaling           58,90
```

**5. Twee hoodies (119,90 + 8,95 verzending), één terug, dag 20**
```
Retour                  59,95
Correctie                0,00   verzending was al betaald, wordt niet terugbetaald
Verwerkingskosten     − 10,00
Terugbetaling           49,95
```

---

## Mechanisme B — waardevermindering

### De maatstaf

De consument mag het artikel hanteren zoals in een winkel: uitpakken,
bekijken, passen. Alles daarbuiten is gebruik, en het waardeverlies daarvan
mag je verrekenen.

**Passen mag altijd.** Ook over eigen kleding heen, ook meerdere keren, ook
voor de spiegel. Dat is geen gebruik.

| Wel toegestaan | Levert waardevermindering op |
|---|---|
| Uitpakken, bekijken, voelen | Buiten gedragen |
| Passen, ook meermaals | Gewassen of gestreken |
| Labels bekijken | Labels verwijderd of doorgeknipt |
| Tijdelijke vouwen uit de verpakking | Geur: rook, parfum, deodorant, huisdier |
| | Vlekken, make-up, huisdierhaar dat niet weggaat |
| | Beschadiging, trekjes, brandgaatjes |

### Staffel

Indicatief, **altijd per geval beoordeeld en onderbouwd**. Een vast percentage
automatisch inhouden mag niet: de wet vraagt om de werkelijke waardevermindering.

| Bevinding | Inhouding | Toelichting |
|---|---|---|
| Lichte geur die uitluchten kan | 0 % | Wij luchten het uit, kosten voor ons |
| Kreukels, oppervlakkig vuil, moet gereinigd | 15–25 % | Werkelijke reinigingskosten |
| Gewassen, gestreken, labels weg | 50 % | Niet meer als nieuw verkoopbaar |
| Blijvende geur, vlekken, beschadiging | tot 100 % | Onverkoopbaar |

### Het proces — dit is waar het staat of valt

Zonder dossier is een inhouding niet houdbaar bij een geschil.

1. **Beoordeel bij ontvangst**, binnen één werkdag.
2. **Fotografeer** de bevinding, herkenbaar bij het artikel en het bestelnummer.
3. **Meld het de klant vóór je verrekent**, per mail, met de bevinding, de foto
   en het bedrag.
4. **Bied het alternatief**: het artikel terug naar de klant, verzendkosten
   voor de klant. Wie dat niet aanbiedt, dwingt een inhouding af.
5. **Bewaar het dossier** zolang de bestelling in de administratie zit.

De terugbetaaltermijn van 14 dagen loopt door tijdens dit proces. Beoordeel
dus meteen; je kunt niet eerst wachten en dan de termijn overschrijden.

---

## De rekenregel, in één keer

Volgorde is bindend — anders komt de verwerkingskostenpost boven een bedrag
dat nog gecorrigeerd moet worden.

```
1.  basis        = som van de geretourneerde artikelen
2.  + heenzend   = alleen bij VOLLEDIGE retour, en alleen wat werkelijk betaald is
3.  − correctie  = alleen bij GEDEELTELIJKE retour, waarbij:
                     verzending was gratis  én  behouden waarde < 15000
                   bedrag = tarief van het bezorgland
4.  − verwerking = 1000, alleen als de retour is aangemeld op dag 15 t/m 30
5.  − waarde     = per geval vastgesteld, met dossier
6.  terugbetaling = max(0, resultaat)
```

De retourzending zelf komt in deze som niet voor: die betaalt de klant
rechtstreeks aan de vervoerder.

---

## Wat het datamodel nodig heeft

De huidige tabellen kunnen dit niet uitvoeren. `order_items` heeft geen enkele
retourkolom en `orders` kent alleen `refunded_cents` en `refunded_at`. Er is
dus geen manier om vast te leggen wélke artikelen terugkomen — en zonder dat
kun je "behouden waarde" niet berekenen en mechanisme A niet toepassen.

Minimaal nodig:

```sql
ALTER TABLE order_items
  ADD COLUMN geretourneerd_aantal INT NOT NULL DEFAULT 0;

CREATE TABLE retouren (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id              UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  aangemeld_op          DATE NOT NULL,          -- bepaalt het venster, niet de ontvangstdatum
  ontvangen_op          DATE,
  artikelbedrag_cents   INT  NOT NULL DEFAULT 0,
  heenzend_cents        INT  NOT NULL DEFAULT 0, -- alleen bij volledige retour
  correctie_cents       INT  NOT NULL DEFAULT 0, -- mechanisme A
  verwerking_cents      INT  NOT NULL DEFAULT 0, -- alleen dag 15-30
  waardevermindering_cents INT NOT NULL DEFAULT 0,
  waardevermindering_reden TEXT,
  uitbetaald_cents      INT  NOT NULL DEFAULT 0,
  created_at            TIMESTAMPTZ DEFAULT NOW()
);
```

De rekenregel hoort in een pure functie in `src/lib/`, met tests op alle vijf
de rekenvoorbeelden hierboven plus de twee valstrikken: volledige retour boven
de drempel (geen correctie) en een tweede retour op dezelfde bestelling (niet
dubbel inhouden).

In `/beheer` hoort een retourscherm waarin je per regel aanvinkt wat er terug
is, het systeem het bedrag voorrekent, en jij de waardevermindering handmatig
kunt invullen met een reden. Het bedrag dat eruit komt is wat je in Mollie
terugboekt — de knop in `/beheer` legt alleen vast, hij verplaatst geen geld.

---

## Waar de tekst moet landen

Vooraf melden is de voorwaarde. Deze punten moeten alle vier de mechanismen
noemen, in gewone taal:

- `src/lib/legal.ts` — `RETURN_SENTENCE` en `RETURN_SHORT`
- `src/pages/retourneren.astro` — het volledige verhaal, met een rekenvoorbeeld
- `src/pages/herroeping.astro` — modelformulier en de wettelijke tekst
- `src/pages/algemene-voorwaarden.astro` — artikel 6
- `src/pages/faq.astro`
- `src/pages/checkout/index.astro` — vóór het afrekenen, niet erna
- `src/pages/shop/[slug].astro` — `merchantReturnPolicy` in het schema
- `src/pages/bestelling/[token].astro` — klantportaal
- `src/lib/mail.ts` — orderbevestiging

### Voorgestelde klanttekst

> **Retourneren**
>
> Je hebt 30 dagen bedenktijd, ruimer dan de wettelijke 14. De retourzending
> regel en betaal je zelf.
>
> Meld je je retour binnen 14 dagen, dan krijg je het aankoopbedrag terug.
> Stuur je je hele bestelling terug, dan krijg je ook de verzendkosten terug.
> Meld je je retour tussen dag 15 en 30, dan houden we € 10,00
> verwerkingskosten in.
>
> Stuur je een deel van je bestelling terug en komt het bedrag dat je houdt
> onder de € 150, dan verrekenen we alsnog de verzendkosten die je door de
> gratisverzendgrens niet hebt betaald.
>
> Passen mag, net als in een winkel. Is een artikel gedragen, gewassen of
> beschadigd, dan verrekenen we de waardevermindering. We laten je dat altijd
> eerst weten, met foto, en je kunt het artikel dan ook terugkrijgen.

### Waarom we dit zo doen — voor de retourpagina

> Elke retour is een rit heen en een rit terug. Wij maken kleding die lang mee
> moet gaan, en dat verhoudt zich slecht tot drie maten bestellen om er twee
> weg te sturen. Daarom betaal je de retourzending zelf en rekenen we de
> verzendkosten alsnog door als je bestelling door een retour onder de € 150
> zakt. Twijfel je over je maat: onze maattabel geeft de opgemeten maten per
> stuk, en we helpen je liever vooraf dan achteraf.

---

## Laten narekenen

De hoofdregels hierboven staan vast in de wet. Twee punten verdienen een
juridische toets op de formulering voordat dit live gaat:

1. **De verzendcorrectie.** De systematiek (voorwaardelijke korting die
   vervalt) is gangbaar en verdedigbaar, maar de exacte bewoording in de
   algemene voorwaarden bepaalt of hij standhoudt. Hij moet vóór het sluiten
   van de overeenkomst kenbaar zijn, dus ook zichtbaar in de checkout.
2. **De staffel voor waardevermindering.** Percentages mogen niet als vast
   tarief werken. De tekst moet duidelijk maken dat het richtlijnen zijn en
   dat elk geval afzonderlijk wordt beoordeeld.
