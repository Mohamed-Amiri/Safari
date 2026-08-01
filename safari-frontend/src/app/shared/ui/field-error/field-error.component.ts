import { Component, Input } from '@angular/core';

/** Inline field error renderer (.err). Renders nothing when no message — keeps
 *  layout from shifting when an error clears. */
@Component({
  selector: 'app-field-error',
  standalone: true,
  template: `@if (message) { <div class="err">{{ message }}</div> }`
})
export class FieldErrorComponent {
  @Input() message: string | null = null;
}
