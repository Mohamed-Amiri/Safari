import { Component, Input } from '@angular/core';

/**
 * Dashed-border empty state: overline + title + body + optional CTA slot.
 * Use the projected CTA via <ng-content> (e.g. <a class="btn btn-cta" ...>).
 * Matches .empty in styles.scss.
 */
@Component({
  selector: 'app-empty-state',
  standalone: true,
  template: `
    <div class="empty">
      <div class="overline">{{ overline }}</div>
      <h3>{{ title }}</h3>
      <p>{{ body }}</p>
      <ng-content />
    </div>
  `
})
export class EmptyStateComponent {
  @Input({ required: true }) overline = '';
  @Input({ required: true }) title = '';
  @Input({ required: true }) body = '';
}
