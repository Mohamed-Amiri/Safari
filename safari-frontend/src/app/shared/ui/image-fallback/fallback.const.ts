/** Branded broken-image fallback (data-URI SVG) ported from prototype 02-data.js FB_IMG.
 *  Inline string literal so it is reusable by the fallback directive and any manual swap. */
export const FALLBACK_IMG =
  'data:image/svg+xml;utf8,' + encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="900" height="600" viewBox="0 0 900 600">` +
    `<rect width="900" height="600" fill="#1e4632"/>` +
    `<circle cx="450" cy="330" r="110" fill="#e0a33c"/>` +
    `<rect x="0" y="330" width="900" height="270" fill="#12281c"/>` +
    `<text x="450" y="560" text-anchor="middle" font-family="monospace" font-size="22" letter-spacing="6" fill="#8aa392">SAFARI</text>` +
    `</svg>`
  );
