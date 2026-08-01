-- ============================================================
-- Villa Happ — race-vrije nummertoewijzing in Het Atelier
--
-- De API telde de rijen en deed count % edition + 1. Twee bezoekers die
-- tegelijk claimen lezen dan dezelfde telling en krijgen hetzelfde
-- "unieke" nummer. Een sequence lost dat op: nextval is atomair.
--
-- Draai dit op een bestaande database; verse databases krijgen het via
-- schema.sql.
-- ============================================================

CREATE SEQUENCE IF NOT EXISTS atelier_number_seq START 1;

-- Sequence gelijkzetten met wat er al is uitgegeven, zodat bestaande
-- claims geen tweede keer worden uitgedeeld.
SELECT setval(
  'atelier_number_seq',
  GREATEST((SELECT COUNT(*) FROM atelier_claims), 1),
  (SELECT COUNT(*) > 0 FROM atelier_claims)
);

/**
 * Volgend nummer in de oplage. Loopt 1..p_edition en rolt daarna door naar
 * een volgende oplage, gelijk aan nextNumber() in src/lib/atelier.ts.
 */
CREATE OR REPLACE FUNCTION next_atelier_number(p_edition INT DEFAULT 500)
RETURNS INT
LANGUAGE plpgsql
SET search_path = ''
AS $$
DECLARE
  n BIGINT;
BEGIN
  n := nextval('public.atelier_number_seq');
  RETURN ((n - 1) % p_edition) + 1;
END;
$$;

-- Alleen de service-role key roept dit aan (via de API-route).
REVOKE ALL ON FUNCTION next_atelier_number(INT) FROM PUBLIC, anon;

-- Twee claims met hetzelfde nummer binnen dezelfde oplage mogen niet meer
-- bestaan. Bestaande dubbelingen eerst opruimen, anders faalt de index.
CREATE UNIQUE INDEX IF NOT EXISTS idx_atelier_number_per_edition
  ON atelier_claims(edition, number);
