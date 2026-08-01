import { Component, EventEmitter, Input, Output, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { ReviewService } from '../../core/services/review.service';
import { AuthService } from '../../core/auth/auth.service';
import { ToastService } from '../../shared/ui/toast/toast.service';
import { ConfirmDialogService } from '../../shared/ui/confirm-dialog/confirm-dialog.service';
import { ApiError } from '../../core/api/api-error';
import { Review, Trip } from '../../core/models/models';
import { StarInputComponent } from '../../shared/ui/rating/star-input/star-input.component';
import { IsoDateTimePipe } from '../../shared/ui/pipes/date.pipe';
import { initials, starGlyphs } from '../../shared/ui/util/display.util';

@Component({
  selector: 'app-reviews',
  standalone: true,
  imports: [ReactiveFormsModule, StarInputComponent, IsoDateTimePipe, RouterLink],
  template: `
    <section id="revs">
      <div class="sechead"><h2>Traveler reviews</h2><span class="overline">1 review per traveler</span></div>

      @if (avg() !== null) {
        <div class="revsummary">
          <div class="agg">
            <div class="n">{{ avg()!.toFixed(1) }}</div>
            <div class="stars">{{ starGlyphs(avg()) }}</div>
            <div class="of">{{ reviewCount() }} traveler review{{ reviewCount() > 1 ? 's' : '' }}</div>
          </div>
          <div class="histo">
            @for (n of [5,4,3,2,1]; track n) {
              <div class="hrow">
                <span>{{ n }}★</span>
                <div class="track"><div class="fill" [style.width.%]="pct(n)"></div></div>
                <span>{{ count(n) }}</span>
              </div>
            }
          </div>
        </div>
      } @else {
        <p class="norev">No reviews yet — this is a brand-new departure. Travel it first and tell everyone.</p>
      }

      @if (ownReview(); as own) {
        @if (editing()) {
          <div class="composer"><h3>Edit your review</h3>
            <form [formGroup]="form" (ngSubmit)="saveEdit(own)">
              <app-star-input [(value)]="draftRating" />
              <textarea class="inp" rows="3" maxlength="1000" formControlName="comment"></textarea>
              <div class="charcount">{{ commentLength() }} / 1000</div>
              <div class="composer-actions">
                <button class="btn btn-ghost btn-sm" type="button" (click)="cancelEdit()">Discard changes</button>
                <button class="btn btn-primary btn-sm" type="submit">Save review</button>
              </div>
            </form>
          </div>
        } @else {
          <div class="rev own">
            <div class="rhead">
              <span class="avatar">{{ avatarFor(me()) }}</span>
              <span class="rname">{{ me()?.fullName }} <span class="owntag">Your review</span></span>
              <span class="rdate">{{ own.createdAt | isoDateTime }}</span>
              <div class="ractions">
                <button class="linklike" type="button" (click)="startEdit(own)">Edit</button>
                <button class="linklike danger" type="button" (click)="remove(own)">Delete</button>
              </div>
            </div>
            <div class="stars" style="margin-bottom:6px">{{ starGlyphs(own.rating) }}</div>
            <div class="rbody">{{ own.comment }}</div>
          </div>
        }
      } @else if (signedIn()) {
        <div class="composer"><h3>Share your experience</h3>
          <form [formGroup]="form" (ngSubmit)="post()">
            <app-star-input [(value)]="draftRating" />
            @if (ratingError()) { <div class="err">{{ ratingError() }}</div> }
            <textarea class="inp" rows="3" maxlength="1000" formControlName="comment" placeholder="How was the trip? Guides, wildlife, camps…"></textarea>
            <div class="charcount">{{ commentLength() }} / 1000</div>
            <div class="composer-actions">
              <button class="btn btn-primary btn-sm" type="submit">Post review</button>
            </div>
          </form>
        </div>
      } @else {
        <div class="banner info" style="display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap">
          <span>Been on this trip? Sign in to leave a review.</span>
          <a class="btn btn-ghost btn-sm" routerLink="/login" [queryParams]="{returnUrl: '/trips/' + trip.id}">Sign in</a>
        </div>
      }

      @for (rv of others(); track rv.id) {
        <div class="rev">
          <div class="rhead">
            <span class="avatar">{{ avatarForReview(rv) }}</span>
            <span class="rname">{{ rv.userFullName }}</span>
            <span class="rdate">{{ rv.createdAt | isoDateTime }}</span>
          </div>
          <div class="stars" style="margin-bottom:6px">{{ starGlyphs(rv.rating) }}</div>
          <div class="rbody">{{ rv.comment }}</div>
        </div>
      }
    </section>
  `,
  styles: [`
    :host{display:block}
    .revsummary{display:flex;gap:26px;align-items:flex-start;margin-bottom:24px;flex-wrap:wrap}
    .revsummary .agg .n{font-family:var(--ff-d);font-weight:800;font-size:44px;line-height:1}
    .revsummary .agg .of{color:var(--muted);font-size:13px}
    .norev{color:var(--muted);font-size:14px;margin-bottom:20px}
    .histo{flex:1;min-width:220px;max-width:340px;display:flex;flex-direction:column;gap:5px}
    .hrow{display:flex;align-items:center;gap:9px;font-family:var(--ff-m);font-size:11px;color:var(--muted)}
    .hrow .track{flex:1;height:7px;background:var(--sand3);border-radius:1px;overflow:hidden}
    .hrow .fill{height:100%;background:var(--clay)}
    .rev{padding:18px 0;border-top:1px solid var(--line)}
    .rev.own{background:var(--green-soft);border:1px solid var(--green-line);border-radius:5px;padding:16px;margin-bottom:8px}
    .rev .rhead{display:flex;align-items:center;gap:11px;margin-bottom:8px;flex-wrap:wrap}
    .rev .avatar{width:36px;height:36px;border-radius:3px;background:var(--green-soft);color:var(--green);font-weight:700;font-size:13px;display:flex;align-items:center;justify-content:center;border:1px solid var(--green-line)}
    .rev .rname{font-weight:650;font-size:14px;margin-right:auto}
    .rev .rdate{font-family:var(--ff-m);font-size:10.5px;color:var(--muted);letter-spacing:.04em}
    .rev .rbody{font-size:14.5px;color:var(--ink2);line-height:1.65;max-width:620px}
    .rev .ractions{display:flex;gap:12px}
    .linklike.danger{color:var(--bad)}
    .owntag{font-family:var(--ff-m);font-size:9.5px;letter-spacing:.12em;text-transform:uppercase;color:var(--green);border:1px solid var(--green-line);background:#fff;padding:2px 7px;border-radius:2px;margin-left:6px}
    .composer{border:1px solid var(--line2);border-radius:5px;background:var(--paper);padding:18px;margin-bottom:26px}
    .composer h3{font-size:15.5px;margin-bottom:10px}
    .charcount{font-family:var(--ff-m);font-size:10.5px;color:var(--faint);text-align:right;margin-top:5px}
    .composer-actions{display:flex;justify-content:flex-end;gap:9px;margin-top:8px}
    .err{color:var(--bad);font-size:12.5px;margin-top:5px;font-weight:500}
  `]
})
export class ReviewsComponent {
  private reviewApi = inject(ReviewService);
  protected auth = inject(AuthService);
  private toast = inject(ToastService);
  private dialog = inject(ConfirmDialogService);
  private fb = inject(FormBuilder);

  @Input({ required: true }) trip!: Trip;
  @Input({ required: true }) set reviews(value: Review[]) { this._reviews.set(value); }
  @Output() mutated = new EventEmitter<void>();

  private _reviews = signal<Review[]>([]);
  protected draftRating = signal(0);
  protected editing = signal<number | null>(null);
  protected ratingError = signal<string | null>(null);

  protected form: FormGroup = this.fb.group({ comment: [''] });

  protected signedIn = computed(() => this.auth.isLoggedIn());
  protected me = computed(() => this.auth.user());
  protected ownReview = computed(() => {
    const u = this.auth.user();
    if (!u) return null;
    return this._reviews().find(r => r.userId === u.id) ?? null;
  });
  protected others = computed(() => {
    const own = this.ownReview();
    const all = this._reviews();
    return own ? all.filter(r => r.id !== own.id) : all;
  });
  /** Average rating as a number (null when no reviews). The template renders it with
   *  toFixed(1) for the "4.0" label and passes it to starGlyphs (which wants a number). */
  protected avg = computed(() => {
    const rs = this._reviews();
    if (!rs.length) return null;
    return Math.round(rs.reduce((s, r) => s + r.rating, 0) / rs.length * 10) / 10;
  });
  protected reviewCount = computed(() => this._reviews().length);

  protected starGlyphs = starGlyphs;
  protected commentLength = computed(() => (this.form.value.comment ?? '').length);

  protected avatarFor(u: { firstName: string; lastName: string } | null): string {
    return u ? initials(u.firstName, u.lastName) : '–';
  }
  protected avatarForReview(rv: Review): string {
    const parts = rv.userFullName.trim().split(/\s+/);
    return initials(parts[0] ?? '', parts[parts.length - 1] ?? '');
  }

  protected count(n: number): number { return this._reviews().filter(r => r.rating === n).length; }
  protected pct(n: number): number {
    const rs = this._reviews();
    return rs.length ? Math.round(this.count(n) / rs.length * 100) : 0;
  }

  /** Create a fresh review. */
  post(): void {
    if (this.draftRating() < 1) { this.ratingError.set('Select a rating from 1 to 5.'); return; }
    this.ratingError.set(null);
    const comment = (this.form.value.comment ?? '').trim();
    if (!comment) { this.toast.error('Comment must not be blank.'); return; }
    this.reviewApi.create({ tripId: this.trip.id, rating: this.draftRating(), comment })
      .subscribe({
        next: () => { this.draftRating.set(0); this.form.reset({ comment: '' }); this.toast.success('Review posted — thank you!'); this.mutated.emit(); },
        error: (e: ApiError) => {
          if (e.fieldError('rating')) this.ratingError.set(e.fieldError('rating')!);
          else if (e.fieldError('comment')) this.toast.error(e.fieldError('comment')!);
          else this.toast.error(e.message);
        }
      });
  }

  startEdit(r: Review): void {
    this.editing.set(r.id);
    this.draftRating.set(r.rating);
    this.form.patchValue({ comment: r.comment });
    this.ratingError.set(null);
  }
  cancelEdit(): void { this.editing.set(null); this.draftRating.set(0); this.form.reset({ comment: '' }); }

  saveEdit(r: Review): void {
    if (this.draftRating() < 1) { this.ratingError.set('Select a rating from 1 to 5.'); return; }
    this.ratingError.set(null);
    const comment = (this.form.value.comment ?? '').trim();
    // PUT requires tripId (validated, ignored). Send the current trip id.
    this.reviewApi.update(r.id, { tripId: this.trip.id, rating: this.draftRating(), comment })
      .subscribe({
        next: () => { this.editing.set(null); this.draftRating.set(0); this.form.reset({ comment: '' }); this.toast.success('Review updated'); this.mutated.emit(); },
        error: (e: ApiError) => {
          if (e.fieldError('rating')) this.ratingError.set(e.fieldError('rating')!);
          else this.toast.error(e.message);
        }
      });
  }

  remove(r: Review): void {
    this.dialog.show({
      tone: 'danger', title: 'Delete your review?',
      body: 'This removes your rating and comment permanently. You can write a new review afterwards.',
      confirmText: 'Delete review', cancelText: 'Keep it',
      onOk: () => {
        this.reviewApi.remove(r.id).subscribe({
          next: () => { this.toast.success('Review deleted'); this.mutated.emit(); },
          error: (e: ApiError) => this.toast.error(e.message)
        });
      }
    });
  }
}
