import { Component, computed, inject, Input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Trip } from '../../core/models/models';
import { FavoriteService } from '../../core/services/favorite.service';
import { AuthService } from '../../core/auth/auth.service';
import { RatingScoreComponent } from '../../shared/ui/rating/score/rating-score.component';
import { AvailabilityBadgeComponent } from '../../shared/ui/availability/availability-badge.component';
import { ImageFallbackDirective } from '../../shared/ui/image-fallback/image-fallback.directive';
import { MoneyPipe } from '../../shared/ui/pipes/money.pipe';
import { IsoDateShortPipe } from '../../shared/ui/pipes/date.pipe';
import { daysBetween, heartSvg, starGlyphs } from '../../shared/ui/util/display.util';
import { availMeta } from '../../shared/ui/availability/availability.util';

/**
 * Trip card — used by Explore, Saved, and the live admin form preview (preview mode strips
 * the link/router-interaction and the heart button). Mirrors tripCard() in 03-app.js.
 *
 * The heart toggle is rendered only for signed-in users outside preview mode; guests are
 * bounced by the parent feature (we emit toggle so the host decides routing vs. API call).
 */
@Component({
  selector: 'app-trip-card',
  standalone: true,
  imports: [
    RouterLink, RatingScoreComponent, AvailabilityBadgeComponent, ImageFallbackDirective,
    MoneyPipe, IsoDateShortPipe
  ],
  template: `
    <article class="tcard">
      <div class="tmedia">
        @if (!preview) {
          <a routerLink="/trips/{{ trip.id }}" tabindex="0">
            <img [src]="trip.imageUrl || ''" [alt]="trip.destination" loading="lazy" appImageFallback>
          </a>
        } @else {
          <img [src]="trip.imageUrl || ''" [alt]="trip.destination" appImageFallback aria-hidden="true">
        }
        @if (soldOut) { <div class="soldout-veil"></div> }
        <span class="chip dark cat">{{ trip.category || 'Trip' }}</span>
        @if (!preview && signedIn()) {
          <button class="favbtn" (click)="toggleFav($event)"
                  [innerHTML]="heart(faved())"
                  [attr.title]="faved() ? 'Remove from saved' : 'Save trip'"
                  aria-label="Save trip"></button>
        }
      </div>
      <div class="tbody">
        <div class="trow1">
          <h3>
            @if (!preview) { <a routerLink="/trips/{{ trip.id }}">{{ trip.destination || 'Untitled trip' }}</a> }
            @else { <span>{{ trip.destination || 'Untitled trip' }}</span> }
          </h3>
          <app-rating-score [rating]="trip.averageRating ?? null" />
        </div>
        <div class="tmeta">{{ trip.country || 'Various' }} · {{ duration }}{{ trip.startDate ? ' · dep ' + (trip.startDate | isoDateShort) : '' }}</div>
        @if (trip.reviewCount) {
          <div class="trating">
            <span class="stars">{{ starGlyphs(trip.averageRating) }}</span>
            <span>{{ trip.reviewCount }} review{{ (trip.reviewCount || 0) > 1 ? 's' : '' }}</span>
          </div>
        } @else {
          <div class="trating">No reviews yet</div>
        }
        <app-availability-badge [seats]="trip.availableSeats" />
        <div class="tfoot">
          <div class="price"><span class="from">From</span><span class="amt">{{ trip.price | money }}</span> <span class="per">/ person</span></div>
          @if (!preview) { <a class="tgo" routerLink="/trips/{{ trip.id }}">View trip →</a> }
        </div>
      </div>
    </article>
  `,
  styles: [`
    .tcard{background:var(--paper);border:1px solid var(--line);border-radius:5px;overflow:hidden;position:relative;display:flex;flex-direction:column;transition:border-color .18s}
    .tcard:hover{border-color:#b6ad8d}
    .tmedia{position:relative;aspect-ratio:3/2;overflow:hidden;background:var(--sand3)}
    .tmedia img{width:100%;height:100%;object-fit:cover;transition:transform .5s ease}
    .tcard:hover .tmedia img{transform:scale(1.035)}
    .tmedia .cat{position:absolute;top:10px;left:10px}
    .tmedia .soldout-veil{position:absolute;inset:0;background:rgba(248,245,236,.45)}
    .favbtn{position:absolute;top:10px;right:10px;width:32px;height:32px;border-radius:3px;background:rgba(255,254,250,.94);border:1px solid var(--line2);display:flex;align-items:center;justify-content:center;color:var(--ink2);z-index:3}
    .favbtn:hover{border-color:var(--clay);color:var(--clay)}
    .tbody{padding:15px 16px 16px;display:flex;flex-direction:column;gap:8px;flex:1}
    .trow1{display:flex;align-items:flex-start;justify-content:space-between;gap:10px}
    .tbody h3{font-size:17.5px;font-weight:700}
    .tbody h3 a{color:var(--ink)}
    .tbody h3 a:hover{color:var(--green);text-decoration:none}
    .tmeta{font-family:var(--ff-m);font-size:10.5px;letter-spacing:.09em;text-transform:uppercase;color:var(--muted)}
    .trating{display:flex;align-items:center;gap:8px;font-size:12.5px;color:var(--muted)}
    .tfoot{margin-top:auto;padding-top:11px;border-top:1px solid var(--line);display:flex;align-items:flex-end;justify-content:space-between}
    .price .from{font-family:var(--ff-m);font-size:9.5px;letter-spacing:.12em;text-transform:uppercase;color:var(--muted);display:block;margin-bottom:1px}
    .price .amt{font-family:var(--ff-d);font-weight:750;font-size:19px;letter-spacing:-.01em}
    .price .per{font-size:11.5px;color:var(--muted);font-weight:500}
    .tgo{font-weight:700;font-size:13.5px}
  `]
})
export class TripCardComponent {
  @Input({ required: true }) trip!: Trip;
  /** preview mode (admin form live card): no links, no heart, no route. */
  @Input() preview = false;

  private favorites = inject(FavoriteService);
  private auth = inject(AuthService);

  protected signedIn = computed(() => this.auth.isLoggedIn());
  protected faved = computed(() => this.favorites.isFavorite(this.trip.id));
  protected soldOut = availMeta(this.trip?.availableSeats).out;

  protected get duration(): string {
    return (this.trip.startDate && this.trip.endDate)
      ? (daysBetween(this.trip.startDate, this.trip.endDate) + ' days')
      : 'Dates flexible';
  }
  protected heart(filled: boolean): string { return heartSvg(filled); }
  protected starGlyphs = starGlyphs;

  /** prevent card-link navigation when clicking the heart; the host (explore/detail/saved)
   *  re-loads favourites after a toggle. */
  toggleFav(ev: MouseEvent): void {
    ev.preventDefault();
    ev.stopPropagation();
    const tripId = this.trip.id;
    if (this.faved()) {
      this.favorites.remove(tripId).subscribe();
    } else {
      this.favorites.save(tripId).subscribe();
    }
  }
}
