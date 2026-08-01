/** Small presentational helpers ported from the prototype's 03-app.js utils.
 *  Keep them as pure functions so templates can {{ }} call them via method bindings. */

export function starGlyphs(n: number | null | undefined): string {
  const v = Math.round(Number(n ?? 0));
  return '★'.repeat(Math.min(5, Math.max(0, v))) + '☆'.repeat(5 - Math.min(5, Math.max(0, v)));
}

export function daysBetween(a: string, b: string): number {
  if (!a || !b) return 0;
  return Math.round((new Date(b).getTime() - new Date(a).getTime()) / 86400000);
}

/** Initials from a name pair, matching the prototype's initials() helper.
 *  Returns '–' for a missing user. */
export function initials(first: string, last: string): string {
  if (!first && !last) return '–';
  return ((first?.[0] ?? '') + (last?.[0] ?? '')).toUpperCase();
}

/** Inline heart SVG (filled / outline) as used on the fav button + save action. */
export function heartSvg(filled: boolean): string {
  return `<svg width="15" height="15" viewBox="0 0 24 24" fill="${filled ? 'var(--clay)' : 'none'}" stroke="${filled ? 'var(--clay)' : 'currentColor'}" stroke-width="2" stroke-linejoin="round"><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 1 0-7.8 7.8l1 1L12 21.2l7.8-7.8 1-1a5.5 5.5 0 0 0 0-7.8z"/></svg>`;
}

/** Sun-over-horizon logo mark — kept exactly as the prototype regardless of the product rename. */
export const LOGO_SVG = `<svg width="27" height="27" viewBox="0 0 28 28" aria-hidden="true"><rect width="28" height="28" rx="4" fill="#1e4632"/><circle cx="14" cy="14.5" r="6.2" fill="#e0a33c"/><rect x="4" y="15.4" width="20" height="1.7" fill="#12281c"/><rect x="7" y="19.4" width="14" height="1.2" fill="#12281c" opacity=".55"/></svg>`;
