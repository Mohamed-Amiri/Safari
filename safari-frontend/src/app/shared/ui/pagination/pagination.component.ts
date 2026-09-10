import { Component, EventEmitter, Input, Output } from '@angular/core';

/**
 * Zero-based pagination control. Emits the absolute page index on change.
 * Matches the prototype's .pager markup (prev/numbered/next + an info span).
 * `total` is the full result count; `size` the page size; `page` the current index.
 */
@Component({
  selector: 'app-pagination',
  standalone: true,
  template: `
    @if (pages > 1) {
      <div class="pager">
        <button [disabled]="page === 0" (click)="go(page - 1)">←</button>
        @for (p of pageNumbers; track p) {
          <button [class.cur]="p === page" (click)="go(p)">{{ p + 1 }}</button>
        }
        <button [disabled]="page >= pages - 1" (click)="go(page + 1)">→</button>
        <span class="info">SHOWING {{ from }}–{{ to }} OF {{ total }}</span>
      </div>
    }
  `,
  styles: [`
    .pager{display:flex;align-items:center;justify-content:center;gap:6px;margin-top:34px}
    .pager button{min-width:38px;height:38px;padding:0 10px;border:1px solid var(--line2);background:var(--paper);border-radius:3px;font-family:var(--ff-m);font-size:13px;color:var(--ink2)}
    .pager button:hover{border-color:var(--ink2)}
    .pager button.cur{background:var(--green);border-color:var(--green);color:#fff}
    .pager button[disabled]{opacity:.35;cursor:default}
    .pager .info{font-family:var(--ff-m);font-size:11px;color:var(--muted);margin-left:14px;letter-spacing:.04em}
  `]
})
export class PaginationComponent {
  @Input({ required: true }) total = 0;
  @Input({ required: true }) size = 9;
  @Input({ required: true }) page = 0;
  @Output() pageChange = new EventEmitter<number>();

  get pages(): number { return Math.max(1, Math.ceil(this.total / this.size)); }
  get pageNumbers(): number[] { return Array.from({ length: this.pages }, (_, i) => i); }
  get from(): number { return this.total ? this.page * this.size + 1 : 0; }
  get to(): number { return Math.min(this.total, (this.page + 1) * this.size); }

  go(p: number): void {
    if (p < 0 || p >= this.pages || p === this.page) return;
    this.pageChange.emit(p);
  }
}
