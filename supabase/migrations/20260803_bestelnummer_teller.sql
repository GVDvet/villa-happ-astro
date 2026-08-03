-- ============================================================
-- Villa Happ — race-vrije bestelnummers
--
-- generate_order_number() deed MAX(...) + 1 zonder slot. Twee klanten die
-- tegelijk afrekenen lezen dezelfde MAX en krijgen hetzelfde nummer. Omdat
-- orders.order_number UNIQUE is faalt de tweede insert, en die klant ziet
-- een foutmelding terwijl de voorraad al gereserveerd was. Precies het
-- scenario van een drop: iedereen rekent binnen dezelfde seconde af.
--
-- Dezelfde fout als bij de atelier-nummers, daar opgelost met een sequence.
-- Hier kan dat niet: het nummer reset per jaar (VH-2026-00001 ->
-- VH-2027-00001) en een sequence resetten is zelf weer een race.
--
-- Een tellertabel met INSERT ... ON CONFLICT DO UPDATE lost beide op. Die
-- neemt een rijslot, dus gelijktijdige aanroepen komen achter elkaar en
-- krijgen elk een eigen nummer. Eén statement, geen retry nodig.
-- ============================================================

CREATE TABLE IF NOT EXISTS order_counters (
  jaar    INT PRIMARY KEY,
  laatste INT NOT NULL DEFAULT 0
);

ALTER TABLE order_counters ENABLE ROW LEVEL SECURITY;
-- Geen policies: alleen de service-role key komt erbij, net als bij orders.

-- Teller gelijkzetten met wat er al is uitgegeven, zodat bestaande
-- bestelnummers niet een tweede keer worden uitgedeeld.
INSERT INTO order_counters (jaar, laatste)
SELECT
  CAST(SUBSTRING(order_number FROM 4 FOR 4) AS INT),
  MAX(CAST(SUBSTRING(order_number FROM 9) AS INT))
FROM orders
WHERE order_number ~ '^VH-[0-9]{4}-[0-9]+$'
GROUP BY 1
ON CONFLICT (jaar) DO UPDATE
  SET laatste = GREATEST(order_counters.laatste, EXCLUDED.laatste);

CREATE OR REPLACE FUNCTION generate_order_number() RETURNS TEXT
LANGUAGE plpgsql SET search_path = '' AS $$
DECLARE
  yr  INT := EXTRACT(YEAR FROM NOW());
  seq INT;
BEGIN
  INSERT INTO public.order_counters (jaar, laatste)
  VALUES (yr, 1)
  ON CONFLICT (jaar) DO UPDATE
    SET laatste = public.order_counters.laatste + 1
  RETURNING laatste INTO seq;

  RETURN 'VH-' || yr || '-' || LPAD(seq::TEXT, 5, '0');
END;
$$;

REVOKE ALL ON FUNCTION generate_order_number() FROM PUBLIC, anon;
