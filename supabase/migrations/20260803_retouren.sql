-- ============================================================
-- Villa Happ — Retouren vastleggen
--
-- Uitwerking: docs/retourbeleid.md. Zonder deze tabellen kun je niet
-- vastleggen wélke artikelen terugkomen, en dus ook de "behouden waarde"
-- niet berekenen die mechanisme A (de verzendcorrectie) nodig heeft.
--
-- De rekenregel zelf staat in src/lib/retour.ts, met tests op alle vijf
-- de rekenvoorbeelden en de twee valstrikken uit het document.
--
-- NIET AUTOMATISCH UITGEVOERD. Draai dit pas als het retourscherm in
-- /beheer erbij komt; los van dat scherm blijven de kolommen leeg en
-- voegen ze niets toe.
-- ============================================================

ALTER TABLE order_items
  ADD COLUMN IF NOT EXISTS geretourneerd_aantal INT NOT NULL DEFAULT 0;

CREATE TABLE IF NOT EXISTS retouren (
  id                       UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id                 UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  -- Bepaalt het venster (dag 1-14 of 15-30), bewust de aanmelddatum en
  -- niet de ontvangstdatum: anders bepaalt de vervoerder of iemand
  -- verwerkingskosten betaalt.
  aangemeld_op             DATE NOT NULL,
  ontvangen_op             DATE,
  artikelbedrag_cents      INT  NOT NULL DEFAULT 0,
  heenzend_cents           INT  NOT NULL DEFAULT 0, -- alleen bij volledige retour
  correctie_cents          INT  NOT NULL DEFAULT 0, -- mechanisme A
  verwerking_cents         INT  NOT NULL DEFAULT 0, -- alleen dag 15-30
  waardevermindering_cents INT  NOT NULL DEFAULT 0,
  waardevermindering_reden TEXT,
  uitbetaald_cents         INT  NOT NULL DEFAULT 0,
  created_at               TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_retouren_order ON retouren(order_id);

ALTER TABLE retouren ENABLE ROW LEVEL SECURITY;
-- Geen public policy: retouren zijn uitsluitend leesbaar en schrijfbaar via
-- de service role (het beheer). Klanten zien hun retour via het portaal,
-- dat al op een capability-token werkt.
