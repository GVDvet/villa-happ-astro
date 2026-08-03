-- ============================================================
-- Villa Happ — Kortingen eruit vóór livegang
--
-- De site toont geen vanaf-prijzen en geen sale-badges meer. De code
-- leest `compare_at_cents` niet meer uit en filtert kortingsbadges weg,
-- maar de database houdt de oude waarden nog vast. Dit script haalt ze
-- eruit, zodat er ook via het beheer of een andere consumer geen korting
-- meer op een product kan opduiken.
--
-- Wat er vóór deze migratie stond (uit supabase/seed.sql):
--   organic-cotton-hoodie-olijfgroen  compare_at 6995  badge 'Sale'
--   organic-cotton-hoodie-navy        compare_at 6995  badge 'Sale'
--   villa-happ-back-cap               compare_at 2795  badge 'Limited · 500'
--   stap-voor-stap-sokken-5-pack      compare_at 4475  badge 'Voordeel'
-- Terugdraaien = die waarden weer wegschrijven.
--
-- De kolom zelf blijft bestaan: geen destructieve schemawijziging vlak
-- voor livegang, en een latere actie kan hem weer gebruiken.
-- ============================================================

UPDATE products
SET compare_at_cents = NULL
WHERE compare_at_cents IS NOT NULL;

-- Kortingsbadges weg; 'Limited · 500' en soortgelijke blijven staan.
UPDATE products
SET badge = NULL
WHERE badge ~* '(sale|korting|voordeel|actie|%)';
