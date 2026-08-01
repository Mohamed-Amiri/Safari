import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

/**
 * Inline heart icon (filled / outline). Rendered as a real <svg> in the template
 * and not passed through [innerHTML]/{{ }} — both of those fail for SVG: text
 * interpolation prints the raw markup as literal text, and [innerHTML] is run
 * through DomSanitizer which silently strips <svg>. A component reference keeps
 * the glyph in the DOM and lets us bind fill/stroke to the `filled` input.
 */
@Component({
  selector: 'app-heart',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <svg width="15" height="15" viewBox="0 0 24 24"
         [attr.fill]="filled ? 'var(--clay)' : 'none'"
         [attr.stroke]="filled ? 'var(--clay)' : 'currentColor'"
         stroke-width="2" stroke-linejoin="round" aria-hidden="true">
      <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 1 0-7.8 7.8l1 1L12 21.2l7.8-7.8 1-1a5.5 5.5 0 0 0 0-7.8z"/>
    </svg>
  `
})
export class HeartIconComponent {
  /** Solid (saved) vs outline. Mirrors heartSvg(filled) in display.util. */
  @Input() filled = false;
}
