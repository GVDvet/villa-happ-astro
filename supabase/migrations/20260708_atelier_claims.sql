-- ============================================================
-- Villa Happ — Het Atelier: geclaimde nummers
-- Draai dit op een bestaande database; nieuwe databases krijgen
-- dezelfde tabel via schema.sql.
-- ============================================================

CREATE TABLE IF NOT EXISTS atelier_claims (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email       TEXT UNIQUE NOT NULL,
  name        TEXT,
  colour      TEXT,
  number      INTEGER NOT NULL,
  edition     INTEGER NOT NULL DEFAULT 500,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_atelier_created ON atelier_claims(created_at);

ALTER TABLE atelier_claims ENABLE ROW LEVEL SECURITY;
-- Schrijven gaat via de service-role key in de API-route; geen publieke
-- policies = geen publieke lees/schrijf-toegang.
