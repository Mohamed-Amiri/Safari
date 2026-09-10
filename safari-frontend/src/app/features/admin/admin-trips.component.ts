import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TripService } from '../../core/services/trip.service';
import { ToastService } from '../../shared/ui/toast/toast.service';
import { ConfirmDialogService } from '../../shared/ui/confirm-dialog/confirm-dialog.service';
import { ApiError } from '../../core/api/api-error';
import { Trip } from '../../core/models/models';
import { ImageFallbackDirective } from '../../shared/ui/image-fallback/image-fallback.directive';
import { MoneyPipe } from '../../shared/ui/pipes/money.pipe';
import { IsoDateShortPipe } from '../../shared/ui/pipes/date.pipe';

@Component({
  selector: 'app-admin-trips',
  standalone: true,
  imports: [RouterLink, ImageFallbackDirective, MoneyPipe, IsoDateShortPipe],
  template: `
    <div class="adm-head">
      <div>
        <h1>Trip management</h1>
        <div class="sub">Create, edit and retire catalogue trips</div>
      </div>
      <a class="btn btn-cta" routerLink="/admin/trips/new">+ New trip</a>
    </div>

    @if (loading()) {
      <div style="padding:40px;text-align:center;color:var(--muted)">Loading trips…</div>
    } @else if (error()) {
      <div class="banner err">{{ error() }}</div>
    } @else {
      <div class="admpanel" style="padding:0">
        <div class="admtoolbar" style="padding:16px 18px 4px">
          <input class="inp" placeholder="Search destination, country or category…" [value]="query()" (input)="onSearch($event)">
          <div class="spacer"></div>
          <span class="cnt">{{ filtered().length }} SHOWN</span>
        </div>
        <div style="padding:6px 18px 16px;overflow-x:auto">
          <table class="table">
            <thead><tr><th>Trip</th><th>Category</th><th>Departs</th><th>Price</th><th>Seats sold</th><th>Rating</th><th style="text-align:right">Actions</th></tr></thead>
            <tbody>
              @if (!filtered().length) {
                <tr><td colspan="7" style="padding:34px;text-align:center;color:var(--muted)">{{ query() ? 'No trips match “' + query() + '”.' : 'No trips yet.' }}</td></tr>
              }
              @for (t of filtered(); track t.id) {
                <tr>
                  <td>
                    <div class="thumbcell">
                      <img [src]="t.imageUrl || ''" alt="" appImageFallback>
                      <div><b>{{ t.destination }}</b><span class="mono">{{ t.country || '—' }} · №{{ (t.id).toString().padStart(3, '0') }}</span></div>
                    </div>
                  </td>
                  <td><span class="chip">{{ t.category || '—' }}</span></td>
                  <td class="num">{{ t.startDate ? (t.startDate | isoDateShort) : '—' }}</td>
                  <td class="num">{{ t.price | money }}</td>
                  <td>
                    <div class="seatbar">
                      <div class="track"><div class="fill" [style.width.%]="pct(t)"></div></div>
                      <span class="num">{{ t.availableSeats }}/{{ t.totalSeats }}</span>
                    </div>
                  </td>
                  <td class="num">{{ t.averageRating ? t.averageRating + '★' : '—' }}</td>
                  <td class="acts">
                    <a class="btn btn-ghost btn-sm" routerLink="/admin/trips/{{ t.id }}/edit">Edit</a>
                    <button class="btn btn-danger btn-sm" type="button" (click)="remove(t)">Delete</button>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </div>
      <p class="caveat">Deleting a trip with confirmed bookings is refused by the API (400) — try “Amalfi Coast Escape” to see the blocked state.</p>
    }
  `,
  styleUrl: './admin.common.scss',
  styles: [`
    .caveat{font-family:var(--ff-m);font-size:10px;color:var(--faint);margin-top:12px;letter-spacing:.06em;text-transform:uppercase}
  `]
})
export class AdminTripsComponent implements OnInit {
  private tripApi = inject(TripService);
  private toast = inject(ToastService);
  private dialog = inject(ConfirmDialogService);

  protected loading = signal(true);
  protected error = signal<string | null>(null);
  protected all = signal<Trip[]>([]);
  protected query = signal('');

  /** Client-side search over destination/country/category — the trips endpoint has no
   *  server-side search filter that excludes keyword-content for admin's table needs. */
  protected filtered = computed(() => {
    const q = this.query().toLowerCase().trim();
    const list = this.all();
    return (q ? list.filter(t => [t.destination, t.country, t.category].some(x => x && x.toLowerCase().includes(q))) : list)
      .slice()
      .sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
  });

  ngOnInit(): void {
    this.tripApi.list({ size: 300 }).subscribe({
      next: p => { this.all.set(p.content ?? []); this.loading.set(false); },
      error: (e: ApiError) => { this.error.set(e.message); this.loading.set(false); }
    });
  }

  protected onSearch(ev: Event): void { this.query.set((ev.target as HTMLInputElement).value); }
  protected pct(t: Trip): number { return t.totalSeats ? Math.round((t.totalSeats - t.availableSeats) / t.totalSeats * 100) : 0; }

  remove(t: Trip): void {
    this.dialog.show({
      tone: 'danger', title: 'Delete this trip?',
      body: `“${t.destination}” will be removed from the catalogue, along with its reviews and saved-trip entries.`,
      confirmText: 'Delete trip', cancelText: 'Keep trip',
      onOk: () => {
        this.tripApi.remove(t.id).subscribe({
          next: () => { this.all.update(list => list.filter(x => x.id !== t.id)); this.toast.success('Trip deleted'); },
          // Confirmed-bookings → 400 blocked-delete
          error: (e: ApiError) => {
            if (e.status === 400) {
              this.dialog.show({
                tone: 'danger', okOnly: true, title: 'This trip can’t be deleted',
                body: e.message || `Confirmed bookings exist on “${t.destination}”. The API refuses deletion (400) until every confirmed booking is cancelled.`,
                confirmText: 'Understood'
              });
            } else {
              this.toast.error(e.message);
            }
          }
        });
      }
    });
  }
}
