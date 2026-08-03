-- ============================================================
-- Villa Happ — vestigingsclaims van Tilburg naar Waalwijk
--
-- De oorsprong van het merk ligt in Tilburg (1960, Babyparadijs) en dat mag
-- in de storyline blijven staan. Maar productteksten als "Ontworpen in
-- Tilburg" en het echtheidscertificaat suggereerden dat het bedrijf daar
-- gevestigd is. Dat klopt niet: Villa Happ Nederland zit in Waalwijk.
--
-- De bronbestanden (seed.sql, src/lib/demo-products.ts) zijn aangepast, maar
-- die halen een bestaande database niet in: elke insert in seed.sql eindigt
-- op ON CONFLICT DO NOTHING, dus bestaande rijen worden nooit bijgewerkt.
-- Vandaar deze migratie. Idempotent: draai hem zo vaak je wilt.
-- ============================================================

UPDATE products
SET details = replace(details::text, 'Ontworpen in Tilburg', 'Ontworpen in Waalwijk')::jsonb,
    updated_at = NOW()
WHERE details::text LIKE '%Ontworpen in Tilburg%';

UPDATE products
SET note = 'Biologisch katoen, embleem geborduurd, niet geprint.',
    updated_at = NOW()
WHERE note LIKE '%Tilburg%';

UPDATE drops
SET certificate = 'Dit exemplaar is een van de 500 uit Drop 001. '
                  || 'Genummerd en gecertificeerd door Villa Happ, Waalwijk.',
    updated_at = NOW()
WHERE certificate LIKE '%Tilburg%';
