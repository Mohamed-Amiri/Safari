import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../api/api.service';
import { Review, ReviewRequest } from '../models/models';

@Injectable({ providedIn: 'root' })
export class ReviewService {
  private api = inject(ApiService);

  forTrip(tripId: number | string): Observable<Review[]> { return this.api.get<Review[]>(`/reviews/trip/${tripId}`); }
  create(body: ReviewRequest): Observable<Review> { return this.api.post<Review>('/reviews', body); }
  /** PUT must include the current tripId — required-but-ignored by the backend (handoff §4).
   *  Callers pass the in-scope trip so validation passes; only rating/comment are persisted. */
  update(reviewId: number | string, body: ReviewRequest): Observable<Review> {
    return this.api.put<Review>(`/reviews/${reviewId}`, body);
  }
  remove(reviewId: number | string): Observable<void> { return this.api.delete<void>(`/reviews/${reviewId}`); }
}
