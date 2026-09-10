import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../core/auth/auth.service';
import { ApiError } from '../../core/api/api-error';
import { FieldErrorComponent } from '../../shared/ui/field-error/field-error.component';
import { ToastService } from '../../shared/ui/toast/toast.service';
import { LOGO_SVG } from '../../shared/ui/util/display.util';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, FieldErrorComponent],
  template: `
    <div class="auth">
      <div class="pane">
        <a class="logoInline" routerLink="/" [innerHTML]="logo"></a>
        <div class="overline">Join Voyage</div>
        <h1>Create your account</h1>
        <p class="lead">Free to join. Reserve seats with no payment today.</p>
        @if (bannerErr()) { <div class="banner err">{{ bannerErr() }}</div> }
        <form [formGroup]="form" (ngSubmit)="submit()" novalidate>
          <div class="formrow">
            <div class="field">
              <label for="rg-fn">First name</label>
              <input class="inp" [class.error]="fieldError('firstName')" id="rg-fn" formControlName="firstName" maxlength="60">
              <app-field-error [message]="fieldError('firstName')" />
            </div>
            <div class="field">
              <label for="rg-ln">Last name</label>
              <input class="inp" [class.error]="fieldError('lastName')" id="rg-ln" formControlName="lastName" maxlength="60">
              <app-field-error [message]="fieldError('lastName')" />
            </div>
          </div>
          <div class="field">
            <label for="rg-em">Email address</label>
            <input class="inp" [class.error]="fieldError('email')" id="rg-em" type="email" formControlName="email" maxlength="150">
            <app-field-error [message]="fieldError('email')" />
          </div>
          <div class="field">
            <label for="rg-pw">Password</label>
            <div class="pwfield">
              <input class="inp" [class.error]="fieldError('password')" id="rg-pw" [type]="showPw() ? 'text' : 'password'" formControlName="password">
              <button class="pwtoggle" type="button" (click)="showPw.set(!showPw())" [attr.aria-pressed]="showPw()" [attr.aria-label]="showPw() ? 'Hide password' : 'Show password'">{{ showPw() ? 'Hide' : 'Show' }}</button>
            </div>
            <app-field-error [message]="fieldError('password')" />
            <div class="hint">6–100 characters</div>
          </div>
          <button class="btn btn-cta btn-block" type="submit" [disabled]="submitting()">Create account</button>
        </form>
        <p class="authswap">Already have an account? <a routerLink="/login">Sign in</a></p>
      </div>
      <div class="photo">
        <div class="scrim"></div>
        <div class="cap">
          <div class="q">"Booked Tuesday. On the trail by Friday. The reserve-now-pay-later model is how all travel should work."</div>
          <div class="loc">Sofia L. · Traveled to Marrakech 2026</div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host{display:block}
    .auth{display:grid;grid-template-columns:490px 1fr;min-height:calc(100vh - 0px)}
    .auth .pane{padding:54px 56px;max-width:560px}
    .logoInline{display:inline-flex;align-items:center;gap:10px;font-family:var(--ff-d);font-weight:800;font-size:20px;letter-spacing:-.02em;color:var(--ink);text-decoration:none;margin-bottom:24px}
    .logoInline ::ng-deep svg{flex:none}
    .auth .pane .overline{margin-bottom:12px}
    .auth .pane h1{font-size:31px;margin-bottom:8px}
    .auth .pane .lead{color:var(--muted);font-size:14.5px;margin-bottom:26px}
    .auth .photo{position:relative;background-image:url('/auth/register.jpg');background-size:cover;background-position:center;min-height:420px}
    .auth .photo .scrim{position:absolute;inset:0;background:linear-gradient(12deg,rgba(13,26,18,.72),rgba(13,26,18,.08) 55%)}
    .auth .photo .cap{position:absolute;left:34px;bottom:30px;color:#fff;z-index:2;max-width:420px}
    .auth .photo .cap .q{font-family:var(--ff-d);font-size:22px;font-weight:650;line-height:1.3}
    .auth .photo .cap .loc{font-family:var(--ff-m);font-size:10.5px;letter-spacing:.14em;text-transform:uppercase;color:var(--amber);margin-top:10px}
    .authswap{margin-top:22px;font-size:13.5px;color:var(--muted)}
    .pwfield{position:relative;display:flex;align-items:center}
    .pwfield .inp{padding-right:54px}
    .pwtoggle{position:absolute;right:8px;top:50%;transform:translateY(-50%);background:none;border:none;cursor:pointer;font-family:var(--ff-m);font-size:11px;letter-spacing:.08em;text-transform:uppercase;color:var(--muted);padding:4px 6px;border-radius:3px}
    .pwtoggle:hover{color:var(--ink);background:var(--sand2)}
    @media (max-width:1080px){ .auth{grid-template-columns:1fr} .auth .photo{display:none} }
    @media (max-width:620px){ .auth .pane{padding:38px 24px} }
  `]
})
export class RegisterComponent {
  private auth = inject(AuthService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private fb = inject(FormBuilder);
  private toast = inject(ToastService);

  protected logo = LOGO_SVG + 'Voyage';
  protected returnUrl = this.route.snapshot.queryParamMap.get('returnUrl') ?? '';
  protected bannerErr = signal<string | null>(null);
  protected submitting = signal(false);
  /** Show/hide password toggle on the password field. */
  protected showPw = signal(false);
  protected fieldErrors: Record<string, string> = {};

  protected form: FormGroup = this.fb.group({
    firstName: ['', [Validators.required, Validators.maxLength(60)]],
    lastName: ['', [Validators.required, Validators.maxLength(60)]],
    email: ['', [Validators.required, Validators.email, Validators.maxLength(150)]],
    password: ['', [Validators.required, Validators.minLength(6), Validators.maxLength(100)]]
  });

  protected fieldError(field: string): string | null {
    const c = this.form.controls[field];
    if (c?.touched && c?.invalid) {
      if (c.errors?.['required']) return `${label(field)} is required.`;
      if (c.errors?.['email']) return 'Enter a valid email address.';
      if (c.errors?.['maxlength']) return `Maximum ${c.errors['maxlength'].requiredLength} characters.`;
      if (c.errors?.['minlength']) return `Password must be at least ${c.errors['minlength'].requiredLength} characters.`;
    }
    return this.fieldErrors[field] ?? null;
  }

  submit(): void {
    this.bannerErr.set(null);
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.submitting.set(true);
    this.auth.register(this.form.value).subscribe({
      next: () => {
        // No auto sign-in: registration creates the account but the user must sign in
        // with their credentials to start an authenticated session. Pre-fill the email
        // and carry any pending returnUrl into the login flow.
        const email = this.form.value.email as string;
        this.toast.success('Account created — sign in to continue');
        this.router.navigate(['/login'], {
          queryParams: {
            email,
            ...(this.returnUrl ? { returnUrl: this.returnUrl } : {}),
            flash: `Welcome aboard — your account is ready. Sign in below to start booking.`
          }
        });
      },
      error: (e: ApiError) => {
        this.submitting.set(false);
        // Duplicate email → 409 lands on the email field (handoff §4).
        if (e.status === 409 || e.fieldError('email')) {
          this.fieldErrors = { ...this.fieldErrors, email: e.message };
        } else {
          this.bannerErr.set(e.message);
        }
      }
    });
  }
}

function label(field: string): string {
  switch (field) {
    case 'firstName': return 'First name';
    case 'lastName': return 'Last name';
    case 'email': return 'Email';
    case 'password': return 'Password';
    default: return field;
  }
}
