import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FavoriteService } from '../../core/services/favorite.service';
import { ApiError } from '../../core/api/api-error';
import { Trip } from '../../core/models/models';
import { TripCardComponent } from '../explore/trip-card.component';
import { EmptyStateComponent } from '../../shared/ui/empty-state/empty-state.component';

@Component({
  selector: 'app-saved',
  standalone: true,
  imports: [RouterLink, TripCardComponent, EmptyStateComponent],
  template: `
    <div class="wrap" style="min-height:60vh">
      <div class="pagehead">
        <div>
          <h1>Saved trips</h1>
          <p class="sub">{{ trips().length ? trips().length + ' trip' + (trips().length > 1 ? 's' : '') + ' on your shortlist — tap the heart to remove.' : 'A private shortlist, synced to your account.' }}</p>
        </div>
      </div>

      @if (loading()) {
        <div style="padding:40px 0;text-align:center;color:var(--muted)">Loading your saved trips…</div>
      } @else if (error()) {
        <div class="banner err">{{ error() }}</div>
      } @else if (!trips().length) {
        <app-empty-state overline="NOTHING SAVED" title="Your shortlist is empty"
          body="Tap the heart on any trip to keep it here while you decide. Saved trips show live availability.">
          <a class="btn btn-cta" routerLink="/">Find a trip to save</a>
        </app-empty-state>
      } @else {
        <div class="trip-grid" style="padding-bottom:60px">
          @for (t of trips(); track t.id) { <app-trip-card [trip]="t" /> }
        </div>
      }
    </div>
  `,
  styles: [`
    .pagehead{padding:34px 0 8px;display:flex;align-items:flex-end;justify-content:space-between;gap:18px;flex-wrap:wrap}
    .pagehead h1{font-size:29px;font-weight:750}
    .pagehead .sub{color:var(--muted);font-size:14px;margin-top:6px}
    .trip-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:22px}
    @media (max-width:1080px){ .trip-grid{grid-template-columns:repeat(2,1fr)} }
    @media (max-width:620px){ .trip-grid{grid-template-columns:1fr} }
  `]
})
export class SavedComponent implements OnInit {
  private favorites = inject(FavoriteService);

  protected loading = signal(true);
  protected error = signal<string | null>(null);
  protected all = signal<Trip[]>([]);

  /** Re-derive the visible trips from the favourite map so remove() updates instantly
   *  (the FavoriteService map is the source of truth, kept in sync on heart toggles). */
  protected trips = computed(() => this.all().filter(t => this.favorites.isFavorite(t.id)));

  ngOnInit(): void {
    this.favorites.load().subscribe({
      next: list => { this.all.set((list ?? []).map(f => f.trip)); this.loading.set(false); },
      error: (e: ApiError) => { this.error.set(e.message); this.loading.set(false); }
    });
  }
}
