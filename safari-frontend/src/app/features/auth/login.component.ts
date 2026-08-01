import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../core/auth/auth.service';
import { ApiError } from '../../core/api/api-error';
import { FieldErrorComponent } from '../../shared/ui/field-error/field-error.component';
import { LOGO_SVG } from '../../shared/ui/util/display.util';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, FieldErrorComponent],
  template: `
    <div class="auth">
      <div class="pane">
        <a class="logoInline" routerLink="/" [innerHTML]="logo"></a>
        <div class="overline">Welcome back</div>
        <h1>Sign in to Voyage</h1>
        <p class="lead">Your bookings, saved trips and reviews live here.</p>
        @if (flash()) { <div class="banner info">{{ flash() }}</div> }
        @if (bannerErr()) { <div class="banner err">{{ bannerErr() }}</div> }
        <form [formGroup]="form" (ngSubmit)="submit()" novalidate>
          <div class="field">
            <label for="lg-em">Email address</label>
            <input class="inp" [class.error]="fieldError('email')" id="lg-em" type="email" formControlName="email" placeholder="you@example.com">
            <app-field-error [message]="fieldError('email')" />
          </div>
          <div class="field">
            <label for="lg-pw">Password</label>
            <div class="pwfield">
              <input class="inp" [class.error]="fieldError('password')" id="lg-pw" [type]="showPw() ? 'text' : 'password'" formControlName="password" placeholder="••••••••">
              <button class="pwtoggle" type="button" (click)="showPw.set(!showPw())" [attr.aria-pressed]="showPw()" [attr.aria-label]="showPw() ? 'Hide password' : 'Show password'">{{ showPw() ? 'Hide' : 'Show' }}</button>
            </div>
            <app-field-error [message]="fieldError('password')" />
          </div>
          <button class="btn btn-primary btn-block" type="submit" [disabled]="submitting()">Sign in</button>
        </form>
        <p class="authswap">New to Voyage? <a routerLink="/register">Create a free account</a></p>
      </div>
      <div class="photo">
        <div class="scrim"></div>
        <div class="cap">
          <div class="q">"The best stories aren't filed by category — they're filed by place."</div>
          <div class="loc">Amalfi Coast · Italy</div>
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
    .auth .photo{position:relative;background-image:url('https://images.unsplash.com/photo-1545569310-3df6c1f6b2d0?fm=jpg&q=60&w=1600&auto=format&fit=crop');background-size:cover;background-position:center;min-height:420px}
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
export class LoginComponent {
  private auth = inject(AuthService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private fb = inject(FormBuilder);

  protected logo = LOGO_SVG + 'Voyage';
  protected returnUrl = this.route.snapshot.queryParamMap.get('returnUrl') ?? '';
  protected flash = signal<string | null>(this.route.snapshot.queryParamMap.get('flash'));
  protected bannerErr = signal<string | null>(null);
  /** field→message map from a 400/400-with-errors response */
  protected errors = signal<Record<string, string>>({});
  protected submitting = signal(false);
  /** Show/hide password toggle on the password field. */
  protected showPw = signal(false);
  protected fieldErrors: Record<string, string> = {};

  protected form: FormGroup = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]]
  });

  protected fieldError(field: string): string | null {
    if (this.form.controls[field]?.touched && this.form.controls[field]?.invalid) {
      const c = this.form.controls[field];
      if (c.errors?.['required']) return `${field === 'email' ? 'Email' : 'Password'} is required.`;
      if (c.errors?.['email']) return 'Enter a valid email address.';
    }
    return this.fieldErrors[field] ?? null;
  }

  submit(): void {
    this.flash.set(null);
    this.bannerErr.set(null);
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.submitting.set(true);
    this.auth.login(this.form.value).subscribe({
      next: res => {
        this.auth.storeSession(res);
        // Admins land in the console; regular users land on their dashboard.
        this.router.navigateByUrl(this.returnUrl || (res.user.role === 'ROLE_ADMIN' ? '/admin' : '/dashboard'));
      },
      error: (e: ApiError) => {
        this.submitting.set(false);
        // Invalid credentials return 400 (not 401) → pretty banner message (handoff §4).
        this.bannerErr.set(e.message || 'Invalid email or password.');
      }
    });
  }
}
