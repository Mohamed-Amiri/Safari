import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { TripService } from '../../core/services/trip.service';
import { ReviewService } from '../../core/services/review.service';
import { AuthService } from '../../core/auth/auth.service';
import { ApiError } from '../../core/api/api-error';
import { Review, Trip } from '../../core/models/models';
import { BookingPanelComponent } from './booking-panel.component';
import { ReviewsComponent } from './reviews.component';
import { ImageFallbackDirective } from '../../shared/ui/image-fallback/image-fallback.directive';
import { RatingScoreComponent } from '../../shared/ui/rating/score/rating-score.component';
import { IsoDatePipe } from '../../shared/ui/pipes/date.pipe';
import { daysBetween, starGlyphs } from '../../shared/ui/util/display.util';
import { NotFoundComponent } from '../../errors/not-found.component';

@Component({
  selector: 'app-trip-detail',
  standalone: true,
  imports: [
    RouterLink, BookingPanelComponent, ReviewsComponent, ImageFallbackDirective,
    RatingScoreComponent, IsoDatePipe, NotFoundComponent
  ],
  templateUrl: './trip-detail.component.html',
  styleUrl: './trip-detail.component.scss'
})
export class TripDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private tripApi = inject(TripService);
  private reviewApi = inject(ReviewService);
  protected auth = inject(AuthService);

  protected trip = signal<Trip | null>(null);
  protected reviews = signal<Review[]>([]);
  protected loading = signal(true);
  protected notFound = signal(false);
  protected error = signal<string | null>(null);

  protected signedIn = computed(() => this.auth.isLoggedIn());
  protected starGlyphs = starGlyphs;

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) { this.notFound.set(true); this.loading.set(false); return; }
    forkJoin({
      trip: this.tripApi.get(id),
      reviews: this.reviewApi.forTrip(id)
    }).subscribe({
      next: r => { this.trip.set(r.trip); this.reviews.set(r.reviews ?? []); this.loading.set(false); },
      error: (e: ApiError) => {
        if (e.status === 404) this.notFound.set(true);
        else this.error.set(e.message);
        this.loading.set(false);
      }
    });
  }

  protected get duration(): string {
    const t = this.trip();
    if (!t?.startDate || !t.endDate) return '—';
    return daysBetween(t.startDate, t.endDate) + ' days';
  }

  protected seatsColor(seats: number): string {
    if (seats === 0) return 'var(--bad)';
    if (seats <= 3) return 'var(--warn)';
    return 'var(--ok)';
  }

  /** Re-fetch trip + reviews after a mutation (booking/cancel/review) so aggregate rating
   *  and availableSeats update. Called from the booking panel and reviews via @Output. */
  refresh(): void {
    const t = this.trip();
    if (!t) return;
    forkJoin({ trip: this.tripApi.get(t.id), reviews: this.reviewApi.forTrip(t.id) })
      .subscribe(r => { this.trip.set(r.trip); this.reviews.set(r.reviews ?? []); });
  }
}
