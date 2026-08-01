-- ============================================================
-- Villa Happ — RLS aanzetten op drop_notifications
--
-- Deze tabel bevat e-mailadressen maar viel bij het opzetten buiten het
-- RLS-blok in schema.sql. Zonder RLS mag de publieke anon-key (die in de
-- browser staat) de rijen lezen, aanvullen en verwijderen.
--
-- Net als bij de andere lijsten met persoonsgegevens: RLS aan, geen
-- publieke policies. Alle schrijf- en leesacties lopen via de service-role
-- key in de API-routes.
--
-- Draai dit op een bestaande database; verse databases krijgen het via
-- schema.sql.
-- ============================================================

ALTER TABLE drop_notifications ENABLE ROW LEVEL SECURITY;

-- Controle: verwacht rowsecurity = true voor élke tabel hieronder.
--   select tablename, rowsecurity
--   from pg_tables
--   where schemaname = 'public'
--   order by rowsecurity, tablename;
