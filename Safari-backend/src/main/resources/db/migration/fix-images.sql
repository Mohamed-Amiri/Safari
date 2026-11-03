-- ============================================================================
-- fix-images.sql — point every trip at the LOCAL images shipped with the
-- frontend (safari-frontend/src/assets/trips/*.jpg, served at /trips/*.jpg).
--
-- Run ONCE against your TiDB database, e.g.:
--   mysql -h <host> -P 4000 -u <user> -p <database> < fix-images.sql
--
-- This file is NOT executed automatically; run it manually.
-- ============================================================================

UPDATE trips SET image_url = '/trips/marrakech.jpg'    WHERE destination = 'Marrakech';
UPDATE trips SET image_url = '/trips/chefchaouen.jpg'  WHERE destination = 'Chefchaouen';
UPDATE trips SET image_url = '/trips/merzouga.jpg'      WHERE destination = 'Merzouga Desert';
UPDATE trips SET image_url = '/trips/fes.jpg'           WHERE destination = 'Fes';
UPDATE trips SET image_url = '/trips/essaouira.jpg'     WHERE destination = 'Essaouira';

-- Sanity check (run after):
-- SELECT id, destination, image_url FROM trips ORDER BY id;
