import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../api/api.service';
import { PagedResponse, Trip, TripRequest } from '../models/models';

export type TripSort = 'createdAt,desc' | 'price,asc' | 'price,desc' | 'startDate,asc' | 'destination,asc';

/** Whitelist of sort values the UI hands to the backend — see handoff §4 (and these match
 *  the prototype's sort menu exactly). Sending arbitrary sort fields is intentionally avoided. */
export const TRIP_SORTS: readonly TripSort[] = ['createdAt,desc', 'price,asc', 'price,desc', 'startDate,asc', 'destination,asc'];

export interface TripListParams {
  keyword?: string;
  destination?: string;
  country?: string;
  category?: string;
  minPrice?: string | number;
  maxPrice?: string | number;
  page?: number;
  size?: number;
  sort?: TripSort;
}

@Injectable({ providedIn: 'root' })
export class TripService {
  private api = inject(ApiService);

  list(params: TripListParams = {}): Observable<PagedResponse<Trip>> {
    return this.api.get<PagedResponse<Trip>>('/trips', {
      keyword: params.keyword ?? '',
      destination: params.destination ?? '',
      country: params.country ?? '',
      category: params.category ?? '',
      minPrice: params.minPrice ?? '',
      maxPrice: params.maxPrice ?? '',
      page: params.page ?? 0,
      size: params.size ?? 9,
      sort: params.sort ?? 'createdAt,desc'
    });
  }

  get(id: number | string): Observable<Trip> {
    return this.api.get<Trip>(`/trips/${id}`);
  }

  create(body: TripRequest): Observable<Trip> { return this.api.post<Trip>('/trips', body); }
  update(id: number | string, body: TripRequest): Observable<Trip> { return this.api.put<Trip>(`/trips/${id}`, body); }
  remove(id: number | string): Observable<void> { return this.api.delete<void>(`/trips/${id}`); }
}
