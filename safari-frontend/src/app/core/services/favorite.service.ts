import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { ApiService } from '../api/api.service';
import { Favorite, FavoriteRequest, Trip } from '../models/models';

/**
 * Favourites client with a client-side tripId→favoriteId map. The backend exposes no
 * "isFavorite" projection on trips (handoff §8 gap #6), so the UI joins client-side:
 * load GET /favorites/my once on session start, build the map, and toggle hearts across
 * the catalogue and detail page in sync. Removal requires the FAVOURITE id, not the trip id.
 */
@Injectable({ providedIn: 'root' })
export class FavoriteService {
  private api = inject(ApiService);

  private _map = signal<Map<number, number>>(new Map());
  /** tripId → favoriteId. Read-only signal for consumers to derive `isFavorite`. */
  readonly map = this._map.asReadonly();
  readonly count = computed(() => this._map().size);

  isFavorite(tripId: number): boolean { return this._map().has(tripId); }
  favoriteIdFor(tripId: number): number | null { return this._map().get(tripId) ?? null; }

  load(): Observable<Favorite[]> {
    return this.api.get<Favorite[]>('/favorites/my').pipe(
      tap(list => {
        const m = new Map<number, number>();
        for (const f of list ?? []) m.set(f.trip.id, f.id);
        this._map.set(m);
      })
    );
  }

  save(tripId: number): Observable<Favorite> {
    return this.api.post<Favorite>('/favorites', { tripId } as FavoriteRequest).pipe(
      tap(fav => this._map.update(m => { const n = new Map(m); n.set(fav.trip.id, fav.id); return n; }))
    );
  }

  remove(tripId: number): Observable<void> {
    const favId = this._map().get(tripId);
    if (favId === undefined) {
      // Defensive: nothing to remove. Return an empty observable so callers stay uniform.
      return new Observable<void>(sub => { sub.next(); sub.complete(); });
    }
    return this.api.delete<void>(`/favorites/${favId}`).pipe(
      tap(() => this._map.update(m => { const n = new Map(m); n.delete(tripId); return n; }))
    );
  }

  clear(): void { this._map.set(new Map()); }
}
