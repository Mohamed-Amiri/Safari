import { Component, EventEmitter, Input, OnChanges, Output, computed, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ReservationService } from '../../core/services/reservation.service';
import { FavoriteService } from '../../core/services/favorite.service';
import { AuthService } from '../../core/auth/auth.service';
import { ToastService } from '../../shared/ui/toast/toast.service';
import { ConfirmDialogService } from '../../shared/ui/confirm-dialog/confirm-dialog.service';
import { ApiError } from '../../core/api/api-error';
import { Reservation, Trip } from '../../core/models/models';
import { Observable } from 'rxjs';
import { RatingScoreComponent } from '../../shared/ui/rating/score/rating-score.component';
import { AvailabilityBadgeComponent } from '../../shared/ui/availability/availability-badge.component';
import { MoneyPipe } from '../../shared/ui/pipes/money.pipe';
import { IsoDatePipe } from '../../shared/ui/pipes/date.pipe';
import { availMeta } from '../../shared/ui/availability/availability.util';
import { heartSvg } from '../../shared/ui/util/display.util';

/**
 * Sticky booking card. Renders one of four states (prototype bookingPanel()):
 *  - signed-in + already booked → booked-note with REF + manage/cancel
 *  - signed-in + sold-out → disabled + save-this-trip
 *  - signed-in + seats available → date picker + Reserve / Save
 *  - guest → date picker (readonly) + "Sign in to book" + "Sign in to save"
 *
 * Emits `mutated` after any seat-affecting action so TripDetail re-fetches the trip+reviews.
 */
@Component({
  selector: 'app-booking-panel',
  standalone: true,
  imports: [ReactiveFormsModule, RatingScoreComponent, AvailabilityBadgeComponent, MoneyPipe, IsoDatePipe, RouterLink],
  template: `
    <aside class="bookcard">
      <div class="inner">
        <div class="pricebig"><span class="amt">{{ trip.price | money }}</span><span class="per">/ person</span></div>
        <div class="prow"><span class="mono" style="font-size:10px;letter-spacing:.1em;color:var(--muted)">FIXED PRICE · USD</span>
          <app-rating-score [rating]="trip.averageRating ?? null" />
        </div>
        <hr>

        @if (signedIn(); as me) {
          @if (existingReservation(); as res) {
            <div class="booked-note">
              <div class="ttl">✓ You're booked on this trip</div>
              Travel date {{ res.reservationDate | isoDate }}<br>
              <span class="mono">REF {{ ref(res.id) }}</span>
            </div>
            <div class="actions">
              <a class="btn btn-ghost btn-block" routerLink="/bookings">Manage in My bookings</a>
              <button class="btn btn-danger btn-block" type="button" (click)="cancel(res)">Cancel booking</button>
            </div>
          } @else if (soldOut()) {
            <div class="avail out" style="margin-bottom:14px">{{ av().text }}</div>
            <button class="btn btn-cta btn-block" disabled>Sold out</button>
            <div class="help" style="margin-top:10px">Cancellations release seats instantly — save this trip to check back.</div>
            <div class="actions">
              <button class="btn btn-ghost btn-block" type="button" (click)="toggleSave()"><span [innerHTML]="heart(faved())"></span> {{ faved() ? 'Saved' : 'Save this trip' }}</button>
            </div>
          } @else {
            <form [formGroup]="form" (ngSubmit)="book()">
              <label class="lbl" for="bk-date">Travel date</label>
              <input class="inp" type="date" id="bk-date" formControlName="reservationDate" [min]="today">
              <div class="help">{{ trip.startDate ? 'Group departs ' + (trip.startDate | isoDate) : 'Today or later' }}</div>
              @if (bookingError()) { <div class="err">{{ bookingError() }}</div> }
              <div class="prow" style="margin-top:14px">
                <span class="avail" [class.low]="av().cls==='low'" [class.out]="av().cls==='out'">{{ av().text }}</span>
                <span class="mono" style="font-size:10.5px;color:var(--faint)">GROUP MAX {{ trip.totalSeats }}</span>
              </div>
              <div class="actions">
                <button class="btn btn-cta btn-block" type="submit">Reserve my seat</button>
                <button class="btn btn-ghost btn-block" type="button" (click)="toggleSave()">{{ heart(faved()) }} {{ faved() ? 'Saved' : 'Save for later' }}</button>
              </div>
            </form>
          }
        } @else {
          <label class="lbl" for="bk-date-g">Travel date</label>
          <input class="inp" type="date" id="bk-date-g" [min]="today" [value]="dateDefault" disabled>
          <div class="prow" style="margin-top:14px">
            <span class="avail" [class.low]="av().cls==='low'" [class.out]="av().cls==='out'">{{ av().text }}</span>
            <span class="mono" style="font-size:10.5px;color:var(--faint)">GROUP MAX {{ trip.totalSeats }}</span>
          </div>
          <div class="actions">
            <button class="btn btn-cta btn-block" type="button" [disabled]="soldOut()" (click)="needLogin('Sign in to reserve your seat')">{{ soldOut() ? 'Sold out' : 'Sign in to book' }}</button>
            <button class="btn btn-ghost btn-block" type="button" (click)="needLogin('Sign in to save trips')">{{ heart(false) }} Save for later</button>
          </div>
          <div class="help" style="margin-top:12px">New here? <a routerLink="/register">Create a free account</a> — it takes 30 seconds.</div>
        }
      </div>
      <div class="fineprint">
        <b>✓</b> No payment today — a booking reserves your seat<br>
        <b>✓</b> Free cancellation, any time before departure<br>
        <b>✓</b> One confirmed booking per traveler per trip
      </div>
    </aside>
  `,
  styles: [`
    .bookcard{border:1px solid var(--line2);background:var(--paper);border-radius:6px;position:sticky;top:88px;overflow:hidden}
    .bookcard .inner{padding:22px}
    .bookcard .pricebig{display:flex;align-items:baseline;gap:7px}
    .bookcard .pricebig .amt{font-family:var(--ff-d);font-weight:800;font-size:30px;letter-spacing:-.02em}
    .bookcard .pricebig .per{color:var(--muted);font-size:13px}
    .bookcard .prow{display:flex;justify-content:space-between;align-items:center;margin-top:4px}
    .bookcard hr{border:none;border-top:1px solid var(--line);margin:16px 0}
    .bookcard .lbl{display:block;font-size:12.5px;font-weight:650;margin-bottom:6px}
    .bookcard .help{font-family:var(--ff-m);font-size:10.5px;color:var(--muted);margin-top:6px;letter-spacing:.02em}
    .bookcard .err{color:var(--bad);font-size:12.5px;margin-top:8px;font-weight:500}
    .bookcard .actions{display:flex;flex-direction:column;gap:9px;margin-top:16px}
    .bookcard .fineprint{background:var(--sand2);border-top:1px solid var(--line);padding:13px 22px;font-family:var(--ff-m);font-size:10.5px;color:var(--muted);line-height:1.9;letter-spacing:.02em}
    .bookcard .fineprint b{color:var(--ok);font-weight:600}
    .booked-note{background:var(--green-soft);border:1px solid var(--green-line);border-radius:4px;padding:13px 14px;font-size:13.5px;line-height:1.55}
    .booked-note .ttl{font-weight:700;color:var(--green);display:flex;gap:7px;align-items:center;margin-bottom:3px}
    .booked-note .mono{font-size:11px;color:var(--muted)}
    @media (max-width:860px){ .bookcard{position:static} }
  `]
})
export class BookingPanelComponent implements OnChanges {
  @Input({ required: true }) trip!: Trip;
  @Output() mutated = new EventEmitter<void>();

  private reservations = inject(ReservationService);
  private favorites = inject(FavoriteService);
  private auth = inject(AuthService);
  private toast = inject(ToastService);
  private dialog = inject(ConfirmDialogService);
  private fb = inject(FormBuilder);
  private router = inject(Router);

  protected av = signal(availMeta(undefined));
  protected soldOut = computed(() => this.av().out);
  protected signedIn = computed(() => this.auth.isLoggedIn());
  protected faved = computed(() => this.trip ? this.favorites.isFavorite(this.trip.id) : false);
  protected existingReservation = signal<Reservation | null>(null);
  protected bookingError = signal<string | null>(null);

  protected today = new Date().toISOString().slice(0, 10);
  // trip is a required @Input but is undefined during field-initializer time (before the
  // parent binds it), so guard against that here — otherwise this.startDate/.availableSeats
  // throw and abort the whole detail view. The real values re-bind in ngOnChanges/ngOnInit.
  protected dateDefault = (this.trip?.startDate && this.trip.startDate > this.today) ? this.trip.startDate : this.today;

  protected form: FormGroup = this.fb.group({
    reservationDate: [this.dateDefault, [Validators.required]]
  });

  /** Recompute the input-derived fields once the parent binds the trip. The field
   *  initializers above ran while trip was still undefined, so we patch everything in
   *  here on the first (and any subsequent) input change. */
  ngOnChanges(): void {
    const t = this.trip;
    if (!t) return;
    this.av.set(availMeta(t.availableSeats));
    if (t.startDate && t.startDate > this.today) {
      this.dateDefault = t.startDate;
      if (this.form) this.form.get('reservationDate')?.setValue(this.dateDefault);
    }
  }

  /** Load the current user's confirmed reservation for THIS trip, if any. Called once on
   *  init by TripDetail via @Input refresh cycle; we lazily fetch in ngOnInit below. */
  ngOnInit(): void {
    if (!this.signedIn()) return;
    this.reservations.mine().subscribe({
      next: list => {
        const r = list.find(x => x.trip.id === this.trip.id && x.status === 'CONFIRMED');
        this.existingReservation.set(r ?? null);
      },
      error: () => { this.existingReservation.set(null); }
    });
  }

  protected ref(id: number): string { return 'RSV-' + String(id).padStart(4, '0'); }
  protected heart(filled: boolean): string { return heartSvg(filled); }

  protected book(): void {
    if (this.form.invalid) return;
    this.bookingError.set(null);
    this.reservations.book({
      tripId: this.trip.id,
      reservationDate: this.form.value.reservationDate
    }).subscribe({
      next: res => {
        this.existingReservation.set(res);
        this.toast.success('Booking confirmed · REF ' + this.ref(res.id));
        this.mutated.emit();
      },
      error: (e: ApiError) => {
        // 409 duplicate, 400 sold-out / bad date → show inline + toast the message.
        this.bookingError.set(e.message);
        this.toast.error(e.message);
      }
    });
  }

  protected cancel(res: Reservation): void {
    this.dialog.show({
      tone: 'danger', title: 'Cancel this booking?',
      body: `Your seat on ${this.trip.destination} (REF ${this.ref(res.id)}) will be released immediately and go back on sale. Cancellation is free.`,
      confirmText: 'Cancel booking', cancelText: 'Keep booking',
      onOk: () => {
        this.reservations.cancel(res.id).subscribe({
          next: () => {
            this.existingReservation.set(null);
            this.toast.success('Booking cancelled — your seat was released');
            this.mutated.emit();
          },
          error: (e: ApiError) => this.toast.error(e.message)
        });
      }
    });
  }

  protected toggleSave(): void {
    const id = this.trip.id;
    const wasSaved = this.faved();
    // Union of Observable<Favorite> | Observable<void> has non-mergeable subscribe signatures;
    // widen to Observable<unknown> so the .subscribe call resolves cleanly.
    const op: Observable<unknown> = wasSaved ? this.favorites.remove(id) : this.favorites.save(id);
    op.subscribe({
      error: (e: ApiError) => this.toast.error(e.message),
      complete: () => this.toast.success(wasSaved ? 'Removed from saved trips' : 'Saved — find it under Saved trips')
    });
  }

  protected needLogin(message: string): void {
    this.toast.info(message);
    this.router.navigate(['/login'], { queryParams: { returnUrl: `/trips/${this.trip.id}` } });
  }
}
