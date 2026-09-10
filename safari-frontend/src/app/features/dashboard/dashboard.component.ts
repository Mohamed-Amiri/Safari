import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';
import { ReservationService } from '../../core/services/reservation.service';
import { FavoriteService } from '../../core/services/favorite.service';
import { ToastService } from '../../shared/ui/toast/toast.service';
import { ConfirmDialogService } from '../../shared/ui/confirm-dialog/confirm-dialog.service';
import { ApiError } from '../../core/api/api-error';
import { Favorite, Reservation, Trip, User } from '../../core/models/models';
import { TripCardComponent } from '../explore/trip-card.component';
import { ImageFallbackDirective } from '../../shared/ui/image-fallback/image-fallback.directive';
import { MoneyPipe } from '../../shared/ui/pipes/money.pipe';
import { IsoDatePipe } from '../../shared/ui/pipes/date.pipe';
import { initials } from '../../shared/ui/util/display.util';

/** Signed-in landing page. Greeting + at-a-glance counts + next upcoming booking (with
 *  manage/cancel) + saved-trips strip + quick actions. Replaces "send users back to the
 *  catalogue" as the post-login destination for ROLE_USER (admins still go to /admin). */
@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [RouterLink, TripCardComponent, ImageFallbackDirective, MoneyPipe, IsoDatePipe],
  template: `
    @if (me(); as u) {
      <div class="wrap" style="min-height:60vh">
        <div class="pagehead">
          <div>
            <div class="overline">Your trips</div>
            <h1>Welcome back, {{ u.firstName }}</h1>
            <p class="sub">Here's what's coming up and what you've saved.</p>
          </div>
          <span class="avatar lg">{{ avatar(u) }}</span>
        </div>

        <div class="stats">
          <a class="statbox" routerLink="/bookings">
            <div class="n">{{ confirmedCount() }}</div>
            <div class="k">Confirmed booking{{ confirmedCount() === 1 ? '' : 's' }}</div>
          </a>
          <a class="statbox" routerLink="/saved">
            <div class="n">{{ savedCount() }}</div>
            <div class="k">Saved trip{{ savedCount() === 1 ? '' : 's' }}</div>
          </a>
          <a class="statbox" routerLink="/account">
            <div class="n">{{ '–' }}</div>
            <div class="k">Account & password</div>
          </a>
        </div>

        @if (loading()) {
          <div class="panel"><div class="skel skel-line" style="width:40%"></div><div class="skel" style="height:60px;margin-top:12px"></div></div>
        } @else if (error()) {
          <div class="banner err">{{ error() }}</div>
        } @else {
          <div class="panel">
            <div class="ph"><h2>Your next trip</h2>
              @if (nextUp()) { <a class="linklike" routerLink="/bookings">All bookings →</a> }
            </div>
            @if (nextUp(); as r) {
              <a class="nexttrip" routerLink="/trips/{{ r.trip.id }}">
                <img [src]="r.trip.imageUrl || ''" [alt]="r.trip.destination" appImageFallback>
                <div class="ntbody">
                  <div class="nttop">
                    <div>
                      <div class="ntwhere">{{ r.trip.destination }}</div>
                      <div class="ntwhen">Departs {{ r.reservationDate | isoDate }} · REF {{ ref(r.id) }}</div>
                    </div>
                    <div class="ntprice">{{ r.trip.price | money }}<span>/ person</span></div>
                  </div>
                  <div class="ntacts" (click)="$event.preventDefault()">
                    <a class="btn btn-ghost btn-sm" routerLink="/bookings">Manage booking</a>
                    <button class="btn btn-danger btn-sm" type="button" (click)="cancel(r)">Cancel booking</button>
                  </div>
                </div>
              </a>
            } @else {
              <div class="empty">
                <p>You have no upcoming trips yet.</p>
                <a class="btn btn-cta btn-sm" routerLink="/">Browse trips</a>
              </div>
            }
          </div>

          <div class="panel">
            <div class="ph"><h2>Saved for later</h2>
              @if (savedTrips().length) { <a class="linklike" routerLink="/saved">See all saved →</a> }
            </div>
            @if (savedTrips().length) {
              <div class="savegrid">
                @for (t of savedTrips(); track t.id) { <app-trip-card [trip]="t" /> }
              </div>
            } @else {
              <div class="empty">
                <p>No saved trips yet — tap the heart on any trip to keep it here.</p>
                <a class="btn btn-ghost btn-sm" routerLink="/">Explore trips</a>
              </div>
            }
          </div>
        }
      </div>
    }
  `,
  styles: [`
    :host{display:block}
    .pagehead{padding:34px 0 8px;display:flex;align-items:flex-start;justify-content:space-between;gap:18px;flex-wrap:wrap}
    .pagehead h1{font-size:29px;font-weight:750;margin-top:4px}
    .pagehead .sub{color:var(--muted);font-size:14px;margin-top:6px}
    .avatar.lg{width:56px;height:56px;border-radius:3px;background:var(--green-soft);color:var(--green);font-weight:700;font-size:19px;display:flex;align-items:center;justify-content:center;border:1px solid var(--green-line);flex:none}
    .stats{display:grid;grid-template-columns:repeat(3,1fr);gap:14px;margin:22px 0}
    .statbox{border:1px solid var(--line2);border-radius:6px;background:var(--paper);padding:18px 20px;text-decoration:none;display:block}
    .statbox:hover{border-color:var(--green-line);text-decoration:none}
    .statbox .n{font-family:var(--ff-d);font-weight:800;font-size:30px;line-height:1;color:var(--ink)}
    .statbox .k{font-family:var(--ff-m);font-size:10.5px;letter-spacing:.08em;text-transform:uppercase;color:var(--muted);margin-top:8px}
    .panel{border:1px solid var(--line2);border-radius:6px;background:var(--paper);padding:22px;margin-bottom:18px}
    .panel .ph{display:flex;align-items:center;justify-content:space-between;margin-bottom:14px}
    .panel .ph h2{font-size:17px}
    .linklike{background:none;border:none;cursor:pointer;font-family:var(--ff-m);font-size:11px;letter-spacing:.06em;text-transform:uppercase;color:var(--green)}
    .nexttrip{display:flex;gap:16px;text-decoration:none;color:inherit;align-items:stretch}
    .nexttrip img{width:160px;height:104px;object-fit:cover;border-radius:5px;flex:none;background:var(--sand3)}
    .nexttrip .ntbody{flex:1;display:flex;flex-direction:column;justify-content:space-between;min-width:0}
    .nexttrip .ntwhere{font-family:var(--ff-d);font-weight:700;font-size:19px}
    .nexttrip .ntwhen{font-family:var(--ff-m);font-size:11.5px;color:var(--muted);margin-top:4px;letter-spacing:.03em}
    .nexttrip .ntprice{font-family:var(--ff-d);font-weight:800;font-size:18px;color:var(--ink);text-align:right;white-space:nowrap}
    .nexttrip .ntprice span{font-family:var(--ff-m);font-size:11px;color:var(--muted);font-weight:400}
    .nexttrip .ntacts{display:flex;gap:9px;margin-top:12px}
    .empty{padding:18px 0;text-align:center}
    .empty p{color:var(--muted);font-size:14px;margin-bottom:14px}
    .savegrid{display:grid;grid-template-columns:repeat(3,1fr);gap:18px}
    @media (max-width:1080px){ .stats{grid-template-columns:1fr} .savegrid{grid-template-columns:repeat(2,1fr)} .nexttrip img{width:120px;height:90px} }
    @media (max-width:620px){ .savegrid{grid-template-columns:1fr} .nexttrip{flex-direction:column} .nexttrip img{width:100%;height:140px} }
  `]
})
export class DashboardComponent implements OnInit {
  private auth = inject(AuthService);
  private reservations = inject(ReservationService);
  private favorites = inject(FavoriteService);
  private toast = inject(ToastService);
  private dialog = inject(ConfirmDialogService);

  protected loading = signal(true);
  protected error = signal<string | null>(null);
  private all = signal<Reservation[]>([]);

  protected me = computed<User | null>(() => this.auth.user());
  /** Next upcoming confirmed reservation (earliest future departure; falls back to the
   *  most recent confirmed one if all dates are in the past). */
  protected nextUp = computed<Reservation | null>(() => {
    const confirmed = this.all().filter(r => r.status === 'CONFIRMED');
    if (!confirmed.length) return null;
    const future = confirmed
      .filter(r => !r.reservationDate || r.reservationDate >= todayStr())
      .sort((a, b) => (a.reservationDate || '').localeCompare(b.reservationDate || ''));
    if (future.length) return future[0];
    return confirmed.sort((a, b) => (b.reservationDate || '').localeCompare(a.reservationDate || ''))[0];
  });
  protected confirmedCount = computed(() => this.all().filter(r => r.status === 'CONFIRMED').length);
  /** Saved trips rendered from the favorites payload (each Favorite carries the full Trip). */
  protected savedTrips = computed<Trip[]>(() => this._saved().map(f => f.trip));
  private _saved = signal<Favorite[]>([]);

  ngOnInit(): void {
    // Reservations + favorites both need a live call here (favorites are also hydrated at
    // boot for the heart state, but we keep the grid's source local for a stable Trip[]).
    this.reservations.mine().subscribe({
      next: list => { this.all.set(list ?? []); this.loading.set(false); },
      error: (e: ApiError) => { this.error.set(e.message); this.loading.set(false); }
    });
    // load() also refreshes the shared favorite map, keeping hearts in sync.
    this.favorites.load().subscribe({ next: list => this._saved.set(list ?? []) });
  }

  protected savedCount(): number { return this._saved().length; }

  protected avatar(u: User): string { return initials(u.firstName, u.lastName); }
  protected ref(id: number): string { return 'RSV-' + String(id).padStart(4, '0'); }

  protected cancel(r: Reservation): void {
    this.dialog.show({
      tone: 'danger', title: 'Cancel this booking?',
      body: `Your seat on ${r.trip.destination} (REF ${this.ref(r.id)}) will be released immediately and go back on sale. Cancellation is free.`,
      confirmText: 'Cancel booking', cancelText: 'Keep booking',
      onOk: () => {
        this.reservations.cancel(r.id).subscribe({
          next: () => {
            this.all.update(list => list.map(x => x.id === r.id ? { ...x, status: 'CANCELLED' } : x));
            this.toast.success('Booking cancelled — your seat was released');
          },
          error: (e: ApiError) => this.toast.error(e.message)
        });
      }
    });
  }
}

/** Today as YYYY-MM-DD (local) for the "upcoming" comparison. Kept module-scoped so it is
 *  stable across change-detection passes within a session. */
function todayStr(): string {
  const d = new Date();
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}
