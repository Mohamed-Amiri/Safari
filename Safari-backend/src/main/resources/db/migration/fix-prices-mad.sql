-- ============================================================================
-- fix-prices-mad.sql — convert stored trip prices from USD to MAD at the
-- display rate previously hardcoded in the frontend (MoneyPipe.USD_TO_MAD=10.1).
--
-- Run ONCE against your TiDB database, e.g.:
--   mysql -h <host> -P 4000 -u <user> -p <database> < fix-prices-mad.sql
--
-- After this the frontend renders prices directly in MAD (no conversion),
-- so the values below must stay in MAD.
-- This file is NOT executed automatically; run it manually.
-- ============================================================================

UPDATE trips SET price = ROUND(price * 10.1, 0);

-- Sanity check (run after):
-- SELECT id, destination, price FROM trips ORDER BY id;
