import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ReservationService } from '../../core/services/reservation.service';
import { ToastService } from '../../shared/ui/toast/toast.service';
import { ConfirmDialogService } from '../../shared/ui/confirm-dialog/confirm-dialog.service';
import { ApiError } from '../../core/api/api-error';
import { Reservation, ReservationStatus } from '../../core/models/models';
import { ImageFallbackDirective } from '../../shared/ui/image-fallback/image-fallback.directive';
import { MoneyPipe } from '../../shared/ui/pipes/money.pipe';
import { IsoDatePipe, IsoDateTimePipe } from '../../shared/ui/pipes/date.pipe';
import { EmptyStateComponent } from '../../shared/ui/empty-state/empty-state.component';

@Component({
  selector: 'app-bookings',
  standalone: true,
  imports: [RouterLink, ImageFallbackDirective, MoneyPipe, IsoDatePipe, IsoDateTimePipe, EmptyStateComponent],
  template: `
    <div class="wrap" style="min-height:60vh">
      <div class="pagehead">
        <div>
          <h1>My bookings</h1>
          <p class="sub">Reservations are free to cancel — a cancelled seat goes straight back on sale.</p>
        </div>
      </div>

      @if (loading()) {
        <div style="padding:40px 0;text-align:center;color:var(--muted)">Loading your bookings…</div>
      } @else if (error()) {
        <div class="banner err">{{ error() }}</div>
      } @else {
        <div class="tabs">
          <button class="tab" [class.on]="tab()==='ALL'" (click)="tab.set('ALL')">All<span class="n">{{ all().length }}</span></button>
          <button class="tab" [class.on]="tab()==='CONFIRMED'" (click)="tab.set('CONFIRMED')">Confirmed<span class="n">{{ confirmed().length }}</span></button>
          <button class="tab" [class.on]="tab()==='CANCELLED'" (click)="tab.set('CANCELLED')">Cancelled<span class="n">{{ cancelled().length }}</span></button>
        </div>

        <div style="padding-bottom:60px">
          @if (!all().length) {
            <app-empty-state overline="NO BOOKINGS YET" title="Your adventures will live here"
              body="Reserve a seat on any trip — no payment needed today — and it appears in this list instantly.">
              <a class="btn btn-cta" routerLink="/">Explore trips</a>
            </app-empty-state>
          } @else if (!visible().length) {
            <app-empty-state overline="NOTHING HERE" [title]="'No ' + tab().toLowerCase() + ' bookings'"
              body="Switch tabs to see the rest of your booking history." />
          } @else {
            @for (r of visible(); track r.id) {
              <div class="resrow">
                <img class="thumb" [src]="r.trip.imageUrl || ''" alt="" appImageFallback>
                <div>
                  <h3><a routerLink="/trips/{{ r.trip.id }}">{{ r.trip.destination }}</a></h3>
                  <div class="rmeta">REF {{ ref(r.id) }} · {{ r.trip.country || '' }} · TRAVEL {{ r.reservationDate | isoDate }} · BOOKED {{ r.createdAt | isoDateTime }}</div>
                </div>
                <div class="right">
                  <span class="st" [class.confirmed]="r.status==='CONFIRMED'" [class.cancelled]="r.status==='CANCELLED'">{{ r.status }}</span>
                  <span class="rprice">{{ r.trip.price | money }}</span>
                  @if (r.status === 'CONFIRMED') {
                    <button class="btn btn-danger btn-sm" type="button" (click)="cancel(r)">Cancel booking</button>
                  } @else {
                    <a class="btn btn-ghost btn-sm" routerLink="/trips/{{ r.trip.id }}">Book again</a>
                  }
                </div>
              </div>
            }
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .pagehead{padding:34px 0 8px;display:flex;align-items:flex-end;justify-content:space-between;gap:18px;flex-wrap:wrap}
    .pagehead h1{font-size:29px;font-weight:750}
    .pagehead .sub{color:var(--muted);font-size:14px;margin-top:6px}
    .tabs{display:flex;gap:24px;border-bottom:1px solid var(--line2);margin:18px 0 4px}
    .tab{background:none;border:none;padding:11px 2px;font-size:14.5px;font-weight:600;color:var(--muted);border-bottom:2px solid transparent;margin-bottom:-1px;cursor:pointer}
    .tab:hover{color:var(--ink)}
    .tab.on{color:var(--ink);border-bottom-color:var(--clay)}
    .tab .n{font-family:var(--ff-m);font-size:11px;color:var(--faint);margin-left:5px}
    .resrow{display:grid;grid-template-columns:118px 1fr auto;gap:20px;padding:20px 0;border-bottom:1px solid var(--line);align-items:center}
    .resrow .thumb{width:118px;height:84px;border-radius:4px;object-fit:cover;background:var(--sand3)}
    .resrow h3{font-size:16.5px;font-weight:700}
    .resrow h3 a{color:var(--ink)}
    .resrow h3 a:hover{color:var(--green);text-decoration:none}
    .resrow .rmeta{font-family:var(--ff-m);font-size:10.5px;letter-spacing:.07em;text-transform:uppercase;color:var(--muted);margin-top:5px;line-height:2}
    .resrow .right{display:flex;flex-direction:column;align-items:flex-end;gap:9px}
    .resrow .rprice{font-family:var(--ff-d);font-weight:750;font-size:17px}
    @media (max-width:860px){
      .resrow{grid-template-columns:88px 1fr;row-gap:10px}
      .resrow .thumb{width:88px;height:64px}
      .resrow .right{grid-column:1/-1;flex-direction:row;align-items:center;justify-content:space-between}
    }
  `]
})
export class BookingsComponent implements OnInit {
  private reservations = inject(ReservationService);
  private toast = inject(ToastService);
  private dialog = inject(ConfirmDialogService);

  protected loading = signal(true);
  protected error = signal<string | null>(null);
  protected all = signal<Reservation[]>([]);
  protected tab = signal<'ALL' | ReservationStatus>('ALL');

  protected confirmed = computed(() => this.all().filter(r => r.status === 'CONFIRMED'));
  protected cancelled = computed(() => this.all().filter(r => r.status === 'CANCELLED'));

  /** Filter the list alphabetically by status, newest-first (API already returns newest first). */
  protected visible = computed(() => {
    const t = this.tab();
    const list = this.all();
    return t === 'ALL' ? list : list.filter(r => r.status === t);
  });

  ngOnInit(): void { this.load(); }

  protected load(): void {
    this.loading.set(true);
    this.reservations.mine().subscribe({
      next: list => { this.all.set(list ?? []); this.loading.set(false); },
      error: (e: ApiError) => { this.error.set(e.message); this.loading.set(false); }
    });
  }

  protected ref(id: number): string { return 'RSV-' + String(id).padStart(4, '0'); }

  cancel(r: Reservation): void {
    this.dialog.show({
      tone: 'danger', title: 'Cancel this booking?',
      body: `Your seat on ${r.trip.destination} (REF ${this.ref(r.id)}) will be released immediately and go back on sale. Cancellation is free.`,
      confirmText: 'Cancel booking', cancelText: 'Keep booking',
      onOk: () => {
        this.reservations.cancel(r.id).subscribe({
          next: updated => {
            this.all.update(list => list.map(x => x.id === updated.id ? updated : x));
            this.toast.success('Booking cancelled — your seat was released');
          },
          error: (e: ApiError) => this.toast.error(e.message)
        });
      }
    });
  }
}
