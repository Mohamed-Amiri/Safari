import { Component, EventEmitter, Input, Output } from '@angular/core';

/**
 * 5-button star picker for the review composer/editor. Click sets the value and emits;
 * the parent owns the draft. The prototype reused .starpick/.on classes verbatim.
 */
@Component({
  selector: 'app-star-input',
  standalone: true,
  template: `
    <div class="starpick">
      @for (v of [1,2,3,4,5]; track v) {
        <button type="button" [class.on]="value >= v" (click)="pick(v)" [attr.aria-label]="v + ' star'">★</button>
      }
    </div>
  `,
  styles: [`
    .starpick{display:flex;gap:3px;margin-bottom:12px}
    .starpick button{background:none;border:none;font-size:24px;color:var(--sand3);padding:0 2px;line-height:1}
    .starpick button.on{color:var(--clay)}
  `]
})
export class StarInputComponent {
  @Input() value = 0;
  @Output() valueChange = new EventEmitter<number>();

  pick(v: number): void {
    this.value = v;
    this.valueChange.emit(v);
  }
}
