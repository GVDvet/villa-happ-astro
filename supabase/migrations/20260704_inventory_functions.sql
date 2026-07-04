-- ============================================================
-- Villa Happ — Voorraadfuncties (atomair)
-- Draai dit op een bestaande database; nieuwe databases krijgen
-- dezelfde functies via schema.sql.
--
-- reserve_inventory  : reserveert qty, alleen als er echt genoeg
--                      vrije voorraad is (quantity - reserved).
--                      Eén UPDATE met guard = geen race conditions.
-- finalize_inventory : zet een reservering om in een verkoop
--                      (quantity en reserved beide omlaag).
-- release_inventory  : geeft een reservering vrij (betaling
--                      mislukt/verlopen/geannuleerd).
-- Alle drie geven TRUE terug als er een rij is bijgewerkt.
-- ============================================================

CREATE OR REPLACE FUNCTION reserve_inventory(v_id UUID, qty INT) RETURNS BOOLEAN AS $$
BEGIN
  IF qty <= 0 THEN RETURN FALSE; END IF;
  UPDATE inventory
  SET reserved = reserved + qty,
      updated_at = NOW()
  WHERE variant_id = v_id
    AND quantity - reserved >= qty;
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION finalize_inventory(v_id UUID, qty INT) RETURNS BOOLEAN AS $$
BEGIN
  IF qty <= 0 THEN RETURN FALSE; END IF;
  UPDATE inventory
  SET quantity = GREATEST(0, quantity - qty),
      reserved = GREATEST(0, reserved - qty),
      updated_at = NOW()
  WHERE variant_id = v_id;
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION release_inventory(v_id UUID, qty INT) RETURNS BOOLEAN AS $$
BEGIN
  IF qty <= 0 THEN RETURN FALSE; END IF;
  UPDATE inventory
  SET reserved = GREATEST(0, reserved - qty),
      updated_at = NOW()
  WHERE variant_id = v_id;
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql;
