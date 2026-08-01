import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { combineLatest } from 'rxjs';
import { TripService, TripSort, TRIP_SORTS } from '../../core/services/trip.service';
import { ApiError } from '../../core/api/api-error';
import { PagedResponse, Trip } from '../../core/models/models';
import { TripCardComponent } from './trip-card.component';
import { PaginationComponent } from '../../shared/ui/pagination/pagination.component';
import { EmptyStateComponent } from '../../shared/ui/empty-state/empty-state.component';
import { SkelCardComponent } from '../../shared/ui/skeleton/skeleton.component';

/** Hard-coded category vocabulary — the backend exposes no facets endpoint (handoff §8 #7),
 *  and the prototype uses this same fixed list. Country options are DERIVED from loaded
 *  results on each page (see deriveCountries). */
const CATEGORIES = ['Cultural', 'Adventure', 'Beach & Coast', 'City Break', 'Nature & Wildlife', 'Food & Wine', 'Mountain & Trek', 'Luxury Escape', 'Relaxation'] as const;

@Component({
  selector: 'app-explore',
  standalone: true,
  imports: [ReactiveFormsModule, TripCardComponent, PaginationComponent, EmptyStateComponent, SkelCardComponent],
  templateUrl: './explore.component.html',
  styleUrl: './explore.component.scss'
})
export class ExploreComponent implements OnInit {
  private tripApi = inject(TripService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private fb = inject(FormBuilder);

  protected readonly sortOptions = TRIP_SORTS;
  protected readonly categories = CATEGORIES;

  protected data = signal<PagedResponse<Trip> | null>(null);
  protected loading = signal(true);
  protected error = signal<string | null>(null);

  /** filter form. keyword lives on the hero searchbar; the sidebar keeps destination/country/category/price. */
  protected filters = this.fb.group({
    keyword: [''],
    destination: [''],
    country: [''],
    category: [''],
    minPrice: [''],
    maxPrice: ['']
  });
  protected sort = signal<TripSort>('createdAt,desc');
  protected page = signal(0);
  protected filtersOpen = signal(false);

  protected countries = computed(() => {
    const trips = this.data()?.content ?? [];
    // Derived from loaded results — the API has no facets endpoint.
    return Array.from(new Set(trips.map(t => t.country).filter((c): c is string => !!c))).sort();
  });

  protected results = computed<Trip[]>(() => this.data()?.content ?? []);
  protected readonly size = 9;

  /** Total trips in the catalogue (best-effort count from the loaded page's totalElements).
   *  The hero trust strip shows a curated-trips count; the API supplies totalElements per query.
   *  We use the totalElements of the default (unfiltered) load for the trust strip. */
  protected totalTrips = signal(0);
  protected get totalElements(): number { return this.data()?.pagination.totalElements ?? 0; }

  protected scrollToResults(): void { scrollResultsIntoView(); }

  ngOnInit(): void {
    // Hydrate filters from query params (footer quick-links set ?category=…).
    const q = this.route.snapshot.queryParamMap;
    const patch: Record<string, string> = {};
    if (q.get('keyword')) patch['keyword'] = q.get('keyword')!;
    if (q.get('category')) patch['category'] = q.get('category')!;
    if (q.get('country')) patch['country'] = q.get('country')!;
    if (q.get('maxPrice')) patch['maxPrice'] = q.get('maxPrice')!;
    if (Object.keys(patch).length) this.filters.patchValue(patch);

    // One unfiltered request also seeds the trust-strip count.
    this.tripApi.list({ size: 1 }).subscribe(p => this.totalTrips.set(p.pagination.totalElements));

    this.filters.valueChanges.subscribe(() => { this.page.set(0); this.load(); });
    this.load();
  }

  protected load(): void {
    this.loading.set(true);
    this.error.set(null);
    const v = this.filters.value;
    this.tripApi.list({
      keyword: (v.keyword ?? '').trim() || undefined,
      destination: (v.destination ?? '').trim() || undefined,
      country: (v.country ?? '') || undefined,
      category: (v.category ?? '') || undefined,
      minPrice: (v.minPrice ?? '') || undefined,
      maxPrice: (v.maxPrice ?? '') || undefined,
      page: this.page(),
      size: this.size,
      sort: this.sort()
    }).subscribe({
      next: p => { this.data.set(p); this.loading.set(false); },
      error: (e: ApiError) => { this.error.set(e.message); this.loading.set(false); this.data.set(null); }
    });
  }

  protected setSort(value: TripSort): void { this.sort.set(value); this.page.set(0); this.load(); }
  protected gotoPage(p: number): void { this.page.set(p); this.load(); scrollResultsIntoView(); }

  protected toggleCategory(c: string): void {
    const cur = this.filters.value.category ?? '';
    this.filters.patchValue({ category: cur === c ? '' : c });
  }
  protected clearFilter(field: string): void { this.filters.patchValue({ [field]: '' }); }
  protected clearAll(): void {
    this.filters.reset({ keyword: '', destination: '', country: '', category: '', minPrice: '', maxPrice: '' });
    this.page.set(0);
    this.load();
  }
  protected toggleFilters(): void { this.filtersOpen.update(v => !v); }

  /** Active-filter chips for the chip row. Returns [{field,label}] in display order. */
  protected activeChips = computed(() => {
    const v = this.filters.value;
    const chips: { field: string; label: string }[] = [];
    if (v.keyword) chips.push({ field: 'keyword', label: '“' + v.keyword + '”' });
    if (v.destination) chips.push({ field: 'destination', label: 'Destination: ' + v.destination });
    if (v.country) chips.push({ field: 'country', label: v.country });
    if (v.category) chips.push({ field: 'category', label: v.category });
    if (v.minPrice) chips.push({ field: 'minPrice', label: 'From $' + Number(v.minPrice).toLocaleString() });
    if (v.maxPrice) chips.push({ field: 'maxPrice', label: 'Up to $' + Number(v.maxPrice).toLocaleString() });
    return chips;
  });
}

function scrollResultsIntoView(): void {
  setTimeout(() => document.querySelector('.results-head')?.scrollIntoView({ behavior: 'smooth' }), 0);
}
