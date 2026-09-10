-- ============================================================================
-- Image refresh for the 4 demo trips — local, authentically sourced JPEGs.
--
-- Run this ONCE against your local MySQL `SafariHub` schema:
--   mysql -u root SafariHub < update-trip-images.sql
--   (your mysql.exe: D:\Users\Mohamed\Downloads\Compressed\mysql-8.0.46-winx64\mysql-8.0.46-winx64\bin\mysql.exe)
--
-- Scope: marrakech.jpg, chefchaouen.jpg, merzouga.jpg, fes.jpg already live
-- under safari-frontend/src/assets/trips/. Angular (see angular.json) mounts
-- src/assets/* at the browser path /* (i.e. /trips/marrakech.jpg), so the
-- frontend renders these via <img [src]="trip.imageUrl"> with no other wiring.
--
-- Essaouira is the user's manually created trip and is deliberately NOT
-- touched here — it keeps its existing image_url and content.
-- ============================================================================

UPDATE trips
SET image_url = '/trips/marrakech.jpg'
WHERE destination = 'Marrakech';

UPDATE trips
SET image_url = '/trips/chefchaouen.jpg'
WHERE destination = 'Chefchaouen';

UPDATE trips
SET image_url = '/trips/merzouga.jpg'
WHERE destination = 'Merzouga Desert';

UPDATE trips
SET image_url = '/trips/fes.jpg'
WHERE destination = 'Fes';

-- Sanity check (run after):
-- SELECT id, destination, image_url FROM trips ORDER BY id;
