-- ============================================================
-- Villa Happ — Orderbeheer: tijdlijn, mail-outbox, rate limit
--
-- Drie tabellen en drie functies die samen het beheerportaal, het
-- klantportaal en de betrouwbare mailverzending mogelijk maken.
--
-- Patronen overgenomen uit prWize Core (zelfde stack: Astro + Supabase op
-- Vercel) en het Aqua Chain klantportaal:
--   * rate limit slaat alleen een HASH van de sleutel op, nooit het ruwe
--     IP of e-mailadres, en telt atomair in één UPSERT;
--   * de outbox claimt atomair met SKIP LOCKED en kent backoff, want een
--     outbox zonder backoff is een stille datavernietiger;
--   * alle tijdvergelijkingen draaien op de DATABASEKLOK (now()), nooit op
--     de klok van de applicatieserver: die lopen op serverless meetbaar
--     uiteen en dan valt verse mail buiten de selectie.
--
-- Draai dit op een bestaande database; verse databases krijgen het via
-- schema.sql.
-- ============================================================

-- ------------------------------------------------------------
-- 1. Orders: velden voor de volledige levenscyclus
-- ------------------------------------------------------------
-- 'delivered' en 'refunded' stonden al in de statuslijst maar werden door
-- geen enkele coderegel gezet. Deze kolommen maken ze bruikbaar.
ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivered_at   TIMESTAMPTZ;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS refunded_at    TIMESTAMPTZ;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS refunded_cents INTEGER NOT NULL DEFAULT 0;

-- De bedanktpagina en het klantportaal gebruiken een stateless, ondertekend
-- capability-token (src/lib/order-token.ts). Er komt daarmee geen geheim in
-- de database te staan: niets om te lekken, niets om te roteren per order.

-- ------------------------------------------------------------
-- 2. Ordertijdlijn (append-only)
-- ------------------------------------------------------------
-- Zonder dit was de voortgang van een bestelling niet te volgen: je zag de
-- huidige status, niet hoe hij daar kwam. Zowel het beheerportaal als het
-- klantportaal leest deze tabel.
CREATE TABLE IF NOT EXISTS order_events (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id    UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  soort       TEXT NOT NULL,      -- aangemaakt | betaald | verzonden | bezorgd | geannuleerd | terugbetaald | opmerking
  toelichting TEXT,
  meta        JSONB,
  bron        TEXT NOT NULL DEFAULT 'systeem',  -- systeem | mollie | beheer
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_order_events_order ON order_events(order_id, created_at);

-- Eén gebeurtenis per soort per order, behalve losse opmerkingen. Zo levert
-- een webhook die Mollie twee keer aanroept geen dubbele tijdlijnregel op.
CREATE UNIQUE INDEX IF NOT EXISTS idx_order_events_uniek
  ON order_events(order_id, soort)
  WHERE soort <> 'opmerking';

-- ------------------------------------------------------------
-- 3. Mail-outbox
-- ------------------------------------------------------------
-- De orderbevestiging vertrok eerder rechtstreeks vanuit de webhook met een
-- .catch(). Was Resend even onbereikbaar, dan was die mail definitief weg:
-- de webhook had Mollie al 200 teruggegeven, dus die probeerde het niet
-- opnieuw. Nu staat elke mail eerst in deze tabel.
CREATE TABLE IF NOT EXISTS uitgaande_mail (
  id                 UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  soort              TEXT NOT NULL,
  ontvanger          TEXT NOT NULL,
  onderwerp          TEXT NOT NULL,
  html               TEXT NOT NULL,
  reply_to           TEXT,
  -- Voorkomt dubbele verzending als dezelfde gebeurtenis opnieuw langskomt.
  dedupe_sleutel     TEXT UNIQUE,
  status             TEXT NOT NULL DEFAULT 'wacht',  -- wacht | bezig | verzonden | opgegeven
  pogingen           INTEGER NOT NULL DEFAULT 0,
  volgende_poging_op TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  geclaimd_op        TIMESTAMPTZ,
  laatste_fout       TEXT,
  verzonden_op       TIMESTAMPTZ,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_uitgaande_mail_wachtrij
  ON uitgaande_mail(status, volgende_poging_op);

-- ------------------------------------------------------------
-- 4. Rate limit (database-backed, multi-instance-veilig)
-- ------------------------------------------------------------
-- De in-memory teller gold per serverless-instance: bij opschaling telde
-- elke instance zijn eigen bucket en was de limiet te omzeilen. Deze teller
-- is gedeeld. Er wordt alleen een HMAC van de sleutel opgeslagen, dus geen
-- IP-adressen of e-mailadressen in de database.
CREATE TABLE IF NOT EXISTS rate_limit (
  bereik        TEXT NOT NULL,
  sleutel_hash  TEXT NOT NULL,
  venster_start TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  aantal        INTEGER NOT NULL DEFAULT 1,
  PRIMARY KEY (bereik, sleutel_hash)
);

CREATE INDEX IF NOT EXISTS idx_rate_limit_opruimen ON rate_limit(venster_start);

-- ------------------------------------------------------------
-- 5. RLS
-- ------------------------------------------------------------
-- Alle drie bevatten bedrijfs- of persoonsgegevens en worden uitsluitend
-- server-side met de service-role key benaderd. RLS aan, geen policies =
-- de publieke anon-key komt er niet bij.
ALTER TABLE order_events   ENABLE ROW LEVEL SECURITY;
ALTER TABLE uitgaande_mail ENABLE ROW LEVEL SECURITY;
ALTER TABLE rate_limit     ENABLE ROW LEVEL SECURITY;

-- ------------------------------------------------------------
-- 6. Functies
-- ------------------------------------------------------------

-- Atomaire vensterteller. Geeft het aantal in het huidige venster terug plus
-- de start ervan, zodat de caller Retry-After kan berekenen.
CREATE OR REPLACE FUNCTION rate_limit_hit(
  p_bereik TEXT,
  p_sleutel_hash TEXT,
  p_venster_seconden INT
) RETURNS TABLE (aantal INT, venster_start TIMESTAMPTZ)
LANGUAGE plpgsql SET search_path = '' AS $$
BEGIN
  RETURN QUERY
  INSERT INTO public.rate_limit AS r (bereik, sleutel_hash, venster_start, aantal)
  VALUES (p_bereik, p_sleutel_hash, NOW(), 1)
  ON CONFLICT (bereik, sleutel_hash) DO UPDATE
    SET aantal = CASE
          WHEN r.venster_start <= NOW() - (p_venster_seconden * INTERVAL '1 second') THEN 1
          ELSE r.aantal + 1
        END,
        venster_start = CASE
          WHEN r.venster_start <= NOW() - (p_venster_seconden * INTERVAL '1 second') THEN NOW()
          ELSE r.venster_start
        END
  RETURNING r.aantal, r.venster_start;
END;
$$;

-- Claimt een batch wachtende mail atomair. SKIP LOCKED zorgt dat twee
-- gelijktijdige runs nooit dezelfde rij pakken en dus nooit dubbel mailen.
CREATE OR REPLACE FUNCTION claim_outbox_batch(p_limiet INT DEFAULT 20)
RETURNS SETOF public.uitgaande_mail
LANGUAGE plpgsql SET search_path = '' AS $$
BEGIN
  -- Verweesde claims van een afgekapte run teruggeven aan de wachtrij.
  UPDATE public.uitgaande_mail
     SET status = 'wacht'
   WHERE status = 'bezig'
     AND geclaimd_op < NOW() - INTERVAL '10 minutes';

  RETURN QUERY
  UPDATE public.uitgaande_mail
     SET status = 'bezig', geclaimd_op = NOW()
   WHERE id IN (
     SELECT id FROM public.uitgaande_mail
      WHERE status = 'wacht' AND volgende_poging_op <= NOW()
      ORDER BY volgende_poging_op
      LIMIT p_limiet
      FOR UPDATE SKIP LOCKED
   )
  RETURNING *;
END;
$$;

-- Hoe ver loopt de wachtrij achter? Meet vóór het verwerken, anders wist een
-- run zijn eigen bewijs uit en meldt een uren durende uitval keurig nul.
CREATE OR REPLACE FUNCTION outbox_achterstand()
RETURNS TABLE (wachtend INT, oudste_seconden INT, opgegeven INT)
LANGUAGE sql SET search_path = '' AS $$
  SELECT
    COUNT(*) FILTER (WHERE status = 'wacht')::INT,
    COALESCE(MAX(EXTRACT(EPOCH FROM NOW() - volgende_poging_op))
             FILTER (WHERE status = 'wacht'), 0)::INT,
    COUNT(*) FILTER (WHERE status = 'opgegeven')::INT
  FROM public.uitgaande_mail;
$$;

REVOKE ALL ON FUNCTION rate_limit_hit(TEXT, TEXT, INT) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION claim_outbox_batch(INT) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION outbox_achterstand() FROM PUBLIC, anon;
