import { Component, Input } from '@angular/core';
import { Availability, availMeta } from './availability.util';

/** Dot + mono availability label: green / amber(low ≤3) / red(sold out). */
@Component({
  selector: 'app-availability-badge',
  standalone: true,
  template: `<span class="avail" [class.low]="av.cls === 'low'" [class.out]="av.cls === 'out'">{{ av.text }}</span>`,
  styles: [``]   // styles live globally (see .avail in styles.scss)
})
export class AvailabilityBadgeComponent {
  @Input({ required: true }) set seats(value: number | null | undefined) {
    this.av = availMeta(value);
  }
  protected av: Availability = availMeta(0);
}
