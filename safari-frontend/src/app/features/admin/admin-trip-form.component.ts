import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { TripService } from '../../core/services/trip.service';
import { ToastService } from '../../shared/ui/toast/toast.service';
import { ApiError } from '../../core/api/api-error';
import { Trip, TripRequest } from '../../core/models/models';
import { TripCardComponent } from '../explore/trip-card.component';
import { NotFoundComponent } from '../../errors/not-found.component';

/** Create/edit a trip. The form mirrors TripRequest validation (handoff §4); live preview
 *  re-renders the public trip card from the current form value as the admin types.
 *  availableSeats blank/0 → omitted so the server sets it to totalSeats on create. */
@Component({
  selector: 'app-admin-trip-form',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, TripCardComponent, NotFoundComponent],
  template: `
    <div class="adm-head">
      <div>
        <h1>{{ editing() ? 'Edit trip' : 'New trip' }}</h1>
        <div class="sub">{{ editing() ? 'PUT /trips/' + id() : 'POST /trips' }} · validation mirrors TripRequest</div>
      </div>
      <a class="btn btn-ghost" routerLink="/admin/trips">Back to trips</a>
    </div>

    @if (notFound()) {
      <div class="bigcode"><div class="code">404</div><h2>Trip not found</h2><a class="btn btn-primary" routerLink="/admin/trips">Back to trips</a></div>
    } @else {
      <div class="tripform">
        <form class="admpanel" [formGroup]="form" (ngSubmit)="submit()" novalidate>
          <div class="field">
            <label>Destination *</label>
            <input class="inp" [class.error]="fieldError('destination')" formControlName="destination" maxlength="120" placeholder="e.g. Amalfi Coast Escape">
            @if (fieldError('destination')) { <div class="err">{{ fieldError('destination') }}</div> }
          </div>
          <div class="formrow">
            <div class="field">
              <label>Country</label>
              <input class="inp" [class.error]="fieldError('country')" formControlName="country" maxlength="80" placeholder="Italy">
              @if (fieldError('country')) { <div class="err">{{ fieldError('country') }}</div> }
            </div>
            <div class="field">
              <label>Category</label>
              <input class="inp" [class.error]="fieldError('category')" formControlName="category" list="cats" placeholder="Cultural">
              <datalist id="cats">
                @for (c of categories; track c) { <option [value]="c"> }
              </datalist>
              @if (fieldError('category')) { <div class="err">{{ fieldError('category') }}</div> }
            </div>
          </div>
          <div class="formrow">
            <div class="field">
              <label>Start date</label>
              <input class="inp" [class.error]="fieldError('startDate')" type="date" formControlName="startDate">
              <div class="hint">Must be in the future</div>
              @if (fieldError('startDate')) { <div class="err">{{ fieldError('startDate') }}</div> }
            </div>
            <div class="field">
              <label>End date</label>
              <input class="inp" [class.error]="fieldError('endDate')" type="date" formControlName="endDate">
              <div class="hint">Must be after the start date</div>
              @if (fieldError('endDate')) { <div class="err">{{ fieldError('endDate') }}</div> }
            </div>
          </div>
          <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:14px">
            <div class="field">
              <label>Price (USD) *</label>
              <input class="inp" [class.error]="fieldError('price')" type="number" min="1" step="1" formControlName="price" placeholder="2450">
              @if (fieldError('price')) { <div class="err">{{ fieldError('price') }}</div> }
            </div>
            <div class="field">
              <label>Total seats *</label>
              <input class="inp" [class.error]="fieldError('totalSeats')" type="number" min="1" formControlName="totalSeats" placeholder="12">
              @if (fieldError('totalSeats')) { <div class="err">{{ fieldError('totalSeats') }}</div> }
            </div>
            <div class="field">
              <label>Available seats</label>
              <input class="inp" [class.error]="fieldError('availableSeats')" type="number" min="0" formControlName="availableSeats" placeholder="auto">
              <div class="hint">Blank or 0 = matches total</div>
              @if (fieldError('availableSeats')) { <div class="err">{{ fieldError('availableSeats') }}</div> }
            </div>
          </div>
          <div class="field">
            <label>Image URL</label>
            <input class="inp" [class.error]="fieldError('imageUrl')" formControlName="imageUrl" maxlength="600" placeholder="https://…">
            <div class="hint">Remote URL only — the API has no upload yet</div>
            @if (fieldError('imageUrl')) { <div class="err">{{ fieldError('imageUrl') }}</div> }
          </div>
          <div class="field">
            <label>Description</label>
            <textarea class="inp" [class.error]="fieldError('description')" formControlName="description" rows="5" maxlength="2000" placeholder="What makes this trip worth booking?"></textarea>
            <div class="charcount">{{ descLen() }} / 2000</div>
            @if (fieldError('description')) { <div class="err">{{ fieldError('description') }}</div> }
          </div>
          <div style="display:flex;justify-content:flex-end;gap:10px;border-top:1px solid var(--line);padding-top:16px">
            <a class="btn btn-ghost" routerLink="/admin/trips">Cancel</a>
            <button class="btn btn-cta" type="submit" [disabled]="saving()">{{ editing() ? 'Save changes' : 'Publish trip' }}</button>
          </div>
        </form>

        <div class="prevbox">
          <div class="t">Live catalogue preview</div>
          <app-trip-card [trip]="previewTrip()" [preview]="true" />
          <div class="note">This is exactly how the trip card renders on the Explore page. Ratings appear once travelers review the trip.</div>
        </div>
      </div>
    }
  `,
  styleUrl: './admin.common.scss',
  styles: [`
    .charcount{font-family:var(--ff-m);font-size:10.5px;color:var(--faint);text-align:right;margin-top:5px}
    .err{color:var(--bad);font-size:12.5px;margin-top:5px;font-weight:500}
  `]
})
export class AdminTripFormComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private tripApi = inject(TripService);
  private toast = inject(ToastService);
  private fb = inject(FormBuilder);

  protected categories = ['Cultural', 'Adventure', 'Beach & Coast', 'City Break', 'Nature & Wildlife', 'Food & Wine', 'Mountain & Trek', 'Luxury Escape', 'Relaxation'];
  protected id = signal<string | null>(null);
  protected editing = computed(() => this.id() !== null);
  protected notFound = signal(false);
  protected saving = signal(false);
  protected fieldErrors = signal<Record<string, string>>({});

  protected form: FormGroup = this.fb.group({
    destination: ['', [Validators.required, Validators.maxLength(120)]],
    country: ['', [Validators.maxLength(80)]],
    category: ['', [Validators.maxLength(60)]],
    startDate: [''],
    endDate: [''],
    price: [null, [Validators.required, Validators.min(0.01)]],
    totalSeats: [null, [Validators.required, Validators.min(1)]],
    availableSeats: [null, [Validators.min(0)]],
    imageUrl: ['', [Validators.maxLength(600)]],
    description: ['', [Validators.maxLength(2000)]]
  });

  protected descLen = computed(() => (this.form.value.description ?? '').length);

  /** Shape of the form value. Kept explicit (rather than Record<string,any>) so dot access
   *  is allowed under noPropertyAccessFromIndexSignature, and loose enough that blank text
   *  ("") and null seats stay distinguishable — casting to Partial<Trip> would tighten
   *  availableSeats to a non-null number and break the `=== ''` checks below. */
  private formValue(): TripFormValue {
    return this.form.value as TripFormValue;
  }

  /** Compose a Trip-shaped preview object from the live form values so the trip card
   *  updates as the admin types. availableSeats blanks fall back to totalSeats (same as server). */
  protected previewTrip = computed<Trip>(() => {
    const v = this.formValue();
    const total = Number(v.totalSeats ?? 0) || 0;
    const avail = (v.availableSeats === '' || v.availableSeats === null || v.availableSeats === undefined)
      ? total : Number(v.availableSeats);
    return {
      id: 0,
      destination: v.destination || 'Untitled trip',
      description: v.description ?? null,
      country: v.country || null,
      price: Number(v.price ?? 0) || 0,
      startDate: v.startDate || null,
      endDate: v.endDate || null,
      totalSeats: total,
      availableSeats: avail,
      imageUrl: v.imageUrl || null,
      category: v.category || null,
      averageRating: null,
      reviewCount: 0,
      createdAt: '2026-01-01T00:00:00'
    };
  });

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.id.set(id);
      this.tripApi.get(id).subscribe({
        next: t => this.form.patchValue({
          destination: t.destination,
          country: t.country ?? '',
          category: t.category ?? '',
          startDate: t.startDate ?? '',
          endDate: t.endDate ?? '',
          price: t.price,
          totalSeats: t.totalSeats,
          availableSeats: t.availableSeats,
          imageUrl: t.imageUrl ?? '',
          description: t.description ?? ''
        }),
        error: (e: ApiError) => {
          if (e.status === 404) this.notFound.set(true);
          else this.toast.error(e.message);
        }
      });
    }
  }

  protected fieldError(field: string): string | null {
    const c = this.form.get(field);
    if (c?.touched && c?.invalid) {
      if (c.errors?.['required']) {
        if (field === 'destination') return 'Destination is required.';
        if (field === 'price') return 'Price must be a positive number.';
        if (field === 'totalSeats') return 'Total seats must be at least 1.';
      }
      if (c.errors?.['maxlength']) return `Maximum ${c.errors['maxlength'].requiredLength} characters.`;
      if (c.errors?.['min']) return field === 'price' ? 'Price must be a positive number.' : 'Total seats must be at least 1.';
    }
    return this.fieldErrors()[field] ?? null;
  }

  submit(): void {
    this.fieldErrors.set({});
    // Extra: availableSeats ≤ totalSeats (client guard — API does not enforce yet).
    const v = this.formValue();
    if (v.availableSeats !== '' && v.availableSeats != null && v.totalSeats && Number(v.availableSeats) > Number(v.totalSeats)) {
      this.fieldErrors.set({ availableSeats: 'Available seats cannot exceed total seats. (Client-side guard — the API does not enforce this yet.)' });
      return;
    }
    if (v.startDate && v.endDate && v.endDate <= v.startDate) {
      this.fieldErrors.set({ endDate: 'End date must be after the start date.' });
      return;
    }
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }

    const payload: TripRequest = {
      destination: (v.destination ?? '').trim(),
      country: (v.country || '').trim() || null,
      category: (v.category || '').trim() || null,
      price: Number(v.price),
      startDate: v.startDate || null,
      endDate: v.endDate || null,
      totalSeats: Number(v.totalSeats),
      // Blank or 0 → omit, server sets to totalSeats on create; for edit we send what's typed.
      availableSeats: (v.availableSeats === '' || v.availableSeats === null || Number(v.availableSeats) === 0) ? null : Number(v.availableSeats),
      imageUrl: (v.imageUrl || '').trim() || null,
      description: (v.description || '').trim() || null
    };

    this.saving.set(true);
    const id = this.id();
    const op = id ? this.tripApi.update(id, payload) : this.tripApi.create(payload);
    op.subscribe({
      next: () => {
        this.saving.set(false);
        this.toast.success(id ? 'Trip updated' : 'Trip published to the catalogue');
        this.router.navigate(['/admin/trips']);
      },
      error: (e: ApiError) => {
        this.saving.set(false);
        if (e.fieldErrors && Object.keys(e.fieldErrors).length) this.fieldErrors.set(e.fieldErrors);
        else this.toast.error(e.message);
      }
    });
  }
}

/** Form-value shape for the trip form. Strings carry blank-as-'' text inputs; seats are
 *  number|(null|'' for "blank → auto") so the preview/submit code can tell them apart. */
interface TripFormValue {
  destination: string;
  country: string;
  category: string;
  startDate: string;
  endDate: string;
  price: string | number | null;
  totalSeats: string | number | null;
  availableSeats: string | number | null;
  imageUrl: string;
  description: string;
}
