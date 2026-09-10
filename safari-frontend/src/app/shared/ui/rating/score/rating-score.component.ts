import { Component, Input } from '@angular/core';

/**
 * Compact rating badge: solid green score for trips with reviews, or the
 * outlined "New" tag when reviewCount === 0. Mirrors scoreBadge() in the prototype.
 */
@Component({
  selector: 'app-rating-score',
  standalone: true,
  template: `
    @if (rating !== null && rating !== undefined) {
      <span class="score" [class.lg]="large">{{ rating }}</span>
    } @else {
      <span class="newtag">New</span>
    }
  `,
  styles: [`.newtag{font-family:var(--ff-m);font-size:10px;letter-spacing:.1em;text-transform:uppercase;color:var(--clay);border:1px solid var(--clay);padding:2px 7px;border-radius:2px}`]
})
export class RatingScoreComponent {
  /** Average rating, or null/undefined when there are no reviews. */
  @Input() rating: number | null | null = null;
  @Input() large = false;
}
