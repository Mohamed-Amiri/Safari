import { Component, Input } from '@angular/core';

/** Catalogue skeleton card. Mirrors the prototype skel-card block. Used in the grid
 *  placeholder while GET /trips is in flight (no artificial delay — tied to real loading$). */
@Component({
  selector: 'app-skel-card',
  standalone: true,
  template: `
    <div class="skel-card">
      <div class="m skel"></div>
      <div class="b">
        <div class="skel skel-line" style="width:70%"></div>
        <div class="skel skel-line" style="width:45%"></div>
        <div class="skel skel-line" style="width:58%"></div>
      </div>
    </div>
  `
})
export class SkelCardComponent {}

/** Generic single-line skeleton strip. */
@Component({
  selector: 'app-skel-line',
  standalone: true,
  template: `<div class="skel skel-line" [style.width.%]="width"></div>`
})
export class SkelLineComponent {
  @Input() width = 100;
}
