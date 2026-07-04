-- ============================================================
-- Villa Happ — Reviews + back-in-stock meldingen
-- Draai dit op een bestaande database; nieuwe databases krijgen
-- dezelfde tabellen via schema.sql.
-- ============================================================

CREATE TABLE IF NOT EXISTS product_reviews (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_slug  TEXT NOT NULL,
  name          TEXT NOT NULL,
  rating        INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  body          TEXT NOT NULL,
  approved      BOOLEAN DEFAULT FALSE,          -- moderatie: pas zichtbaar na goedkeuring
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_reviews_slug ON product_reviews(product_slug, approved);

CREATE TABLE IF NOT EXISTS back_in_stock (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_slug  TEXT NOT NULL,
  size          TEXT,
  email         TEXT NOT NULL,
  notified_at   TIMESTAMPTZ,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (product_slug, size, email)
);

ALTER TABLE product_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE back_in_stock ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read approved reviews" ON product_reviews;
CREATE POLICY "Public read approved reviews" ON product_reviews
  FOR SELECT USING (approved = TRUE);

-- Schrijven (reviews indienen, meldingen inschrijven) gaat via de
-- service-role key in de API-routes; geen publieke write-policies.
