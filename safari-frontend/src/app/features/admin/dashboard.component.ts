import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AdminService } from '../../core/services/admin.service';
import { TripService } from '../../core/services/trip.service';
import { ApiError } from '../../core/api/api-error';
import { AdminStats, Trip } from '../../core/models/models';
import { ImageFallbackDirective } from '../../shared/ui/image-fallback/image-fallback.directive';
import { MoneyPipe } from '../../shared/ui/pipes/money.pipe';

/** Dashboard: the 7 metric tiles (handoff §3 AdminStats, 1:1 with GET /admin/stats) plus
 *  a derived client-side seat-occupancy panel (top-N trips by fill %) and the newest trips
 *  table. Rating/occupancy not provided by stats — derived from GET /trips. */
@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [RouterLink, ImageFallbackDirective, MoneyPipe],
  template: `
    <div class="adm-head">
      <div>
        <h1>Operations overview</h1>
        <div class="sub">Live platform counts</div>
      </div>
      <a class="btn btn-cta" routerLink="/admin/trips/new">+ New trip</a>
    </div>

    @if (loading()) {
      <div class="statgrid">
        @for (i of [1,2,3,4,5,6,7,8]; track i) {
          <div class="stat"><div class="skel skel-line" style="width:60%"></div><div class="skel" style="height:30px;width:40%"></div></div>
        }
      </div>
    } @else if (error()) {
      <div class="banner err">{{ error() }}</div>
    } @else {
      @if (stats(); as s) {
      <div class="statgrid">
        <div class="stat"><div class="k">Total users</div><div class="v">{{ s.totalUsers }}</div><div class="d">registered accounts</div></div>
        <div class="stat"><div class="k">Admins</div><div class="v">{{ s.totalAdmins }}</div><div class="d">operator accounts</div></div>
        <div class="stat"><div class="k">Trips on sale</div><div class="v">{{ s.totalTrips }}</div><div class="d">in the catalogue</div></div>
        <div class="stat"><div class="k">All bookings</div><div class="v">{{ s.totalReservations }}</div><div class="d">confirmed + cancelled</div></div>
        <div class="stat"><div class="k">Active bookings</div><div class="v">{{ s.activeReservations }}</div><div class="d">currently confirmed</div></div>
        <div class="stat"><div class="k">Reviews</div><div class="v">{{ s.totalReviews }}</div><div class="d">published by travelers</div></div>
        <div class="stat"><div class="k">Saved trips</div><div class="v">{{ s.totalFavorites }}</div><div class="d">favourites across users</div></div>
        <div class="stat note"><p>All seven counts map 1:1 to GET /admin/stats</p></div>
      </div>

      <div class="admgrid2">
        <div class="admpanel">
          <h2>Seat occupancy</h2>
          <div class="p-sub">Derived client-side from catalogue seat counts</div>
          @for (o of occupancy(); track o.id) {
            <div class="occrow">
              <span class="trip-name">{{ o.destination }}</span>
              <div class="track"><div class="fill" [class.hot]="o.pct >= 80" [style.width.%]="o.pct"></div></div>
              <span class="pct">{{ o.booked }}/{{ o.total }} · {{ o.pct }}%</span>
            </div>
          }
        </div>
        <div class="admpanel">
          <h2>Newest trips</h2>
          <div class="p-sub">Latest additions to the catalogue</div>
          <table class="table">
            <thead><tr><th>Trip</th><th>Price</th><th>Seats</th><th></th></tr></thead>
            <tbody>
              @for (t of newest(); track t.id) {
                <tr>
                  <td>
                    <div class="thumbcell">
                      <img [src]="t.imageUrl || ''" alt="" appImageFallback>
                      <div><b>{{ t.destination }}</b><span class="mono">{{ t.country || '—' }}</span></div>
                    </div>
                  </td>
                  <td class="num">{{ t.price | money }}</td>
                  <td class="num">{{ t.availableSeats }}/{{ t.totalSeats }}</td>
                  <td class="acts"><a class="btn btn-ghost btn-sm" routerLink="/admin/trips/{{ t.id }}/edit">Edit</a></td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </div>
      }
    }
  `,
  styleUrl: './admin.common.scss'
})
export class DashboardComponent implements OnInit {
  private adminApi = inject(AdminService);
  private tripApi = inject(TripService);

  protected loading = signal(true);
  protected error = signal<string | null>(null);
  protected stats = signal<AdminStats | null>(null);
  protected occupancy = signal<{ id: number; destination: string; booked: number; total: number; pct: number }[]>([]);
  protected newest = signal<Trip[]>([]);

  ngOnInit(): void {
    this.adminApi.stats().subscribe({
      next: s => {
        this.stats.set(s);
        // Derived occupancy + newest trips need GET /trips across the catalogue.
        this.tripApi.list({ size: 300, sort: 'createdAt,desc' }).subscribe({
          next: p => {
            const trips = p.content ?? [];
            this.newest.set(trips.slice(0, 5));
            this.occupancy.set(
              trips.map(t => ({
                id: t.id,
                destination: t.destination,
                booked: t.totalSeats - t.availableSeats,
                total: t.totalSeats,
                pct: t.totalSeats ? Math.round((t.totalSeats - t.availableSeats) / t.totalSeats * 100) : 0
              }))
                .sort((a, b) => b.pct - a.pct)
                .slice(0, 6)
            );
          },
          error: () => undefined
        });
        this.loading.set(false);
      },
      error: (e: ApiError) => { this.error.set(e.message); this.loading.set(false); }
    });
  }
}
