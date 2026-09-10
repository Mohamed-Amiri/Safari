import { Directive, HostListener } from '@angular/core';
import { FALLBACK_IMG } from './fallback.const';

/**
 * Drop on any <img>. On native error it swaps the src to the branded fallback data-URI
 * (prototype used inline onerror="this.src=FB_IMG"). Clears onerror to avoid loops.
 * If the host has no src at all, swap immediately so empty image URLs render the brand
 * tile rather than a broken-image glyph.
 *
 * Usage: <img [src]="trip.imageUrl" appImageFallback alt="...">
 */
@Directive({ selector: 'img[appImageFallback]', standalone: true })
export class ImageFallbackDirective {
  @HostListener('error', ['$event'])
  onError(ev: Event): void {
    const img = ev.target as HTMLImageElement;
    if (!img || img.dataset['fellBack']) return;
    img.dataset['fellBack'] = '1';
    img.onerror = null;
    img.src = FALLBACK_IMG;
  }
}
