import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../core/auth/auth.service';
import { ConfirmDialogService } from '../../shared/ui/confirm-dialog/confirm-dialog.service';
import { ToastService } from '../../shared/ui/toast/toast.service';
import { ApiError } from '../../core/api/api-error';
import { User } from '../../core/models/models';
import { FieldErrorComponent } from '../../shared/ui/field-error/field-error.component';
import { IsoDateTimePipe } from '../../shared/ui/pipes/date.pipe';
import { initials } from '../../shared/ui/util/display.util';

@Component({
  selector: 'app-account',
  standalone: true,
  imports: [ReactiveFormsModule, FieldErrorComponent, IsoDateTimePipe],
  template: `
    <div class="wrap" style="min-height:60vh">
      <div class="pagehead">
        <div>
          <h1>Account settings</h1>
          <p class="sub">Your profile, credentials and membership details.</p>
        </div>
      </div>

      @if (user(); as me) {
        <div class="acct">
          <aside class="idcard">
            <div class="who">
              <span class="avatar lg">{{ avatar }}</span>
              <div>
                <div class="nm">{{ me.fullName }}</div>
                <div class="em">{{ me.email }}</div>
              </div>
            </div>
            <div class="facts2">
              <span>MEMBER SINCE {{ me.createdAt | isoDateTime }}</span>
              <span>ROLE <span class="rolepill" [class.admin]="me.role==='ROLE_ADMIN'" [class.user]="me.role==='ROLE_USER'">{{ me.role.replace('ROLE_', '') }}</span></span>
            </div>
          </aside>

          <div>
            <div class="panel">
              <h2>Profile details</h2>
              <p class="p-sub">Changing your email signs you out — a fresh sign-in issues a new session token.</p>
              <form [formGroup]="profile" (ngSubmit)="saveProfile()" novalidate>
                <div class="formrow">
                  <div class="field">
                    <label for="pf-fn">First name</label>
                    <input class="inp" [class.error]="profileField('firstName')" id="pf-fn" formControlName="firstName" maxlength="60">
                    <app-field-error [message]="profileField('firstName')" />
                  </div>
                  <div class="field">
                    <label for="pf-ln">Last name</label>
                    <input class="inp" [class.error]="profileField('lastName')" id="pf-ln" formControlName="lastName" maxlength="60">
                    <app-field-error [message]="profileField('lastName')" />
                  </div>
                </div>
                <div class="field">
                  <label for="pf-em">Email address</label>
                  <input class="inp" [class.error]="profileField('email')" id="pf-em" type="email" formControlName="email" maxlength="150">
                  <app-field-error [message]="profileField('email')" />
                </div>
                <div class="foot"><button class="btn btn-primary" type="submit" [disabled]="savingProfile()">Save profile</button></div>
              </form>
            </div>

            <div class="panel">
              <h2>Password</h2>
              <p class="p-sub">6–100 characters. Existing sessions stay signed in after a change.</p>
              <form [formGroup]="password" (ngSubmit)="changePwd()" novalidate>
                <div class="formrow">
                  <div class="field">
                    <label for="pw-cur">Current password</label>
                    <input class="inp" [class.error]="pwdField('currentPassword')" id="pw-cur" type="password" formControlName="currentPassword">
                    <app-field-error [message]="pwdField('currentPassword')" />
                  </div>
                  <div class="field">
                    <label for="pw-new">New password</label>
                    <input class="inp" [class.error]="pwdField('newPassword')" id="pw-new" type="password" formControlName="newPassword">
                    <app-field-error [message]="pwdField('newPassword')" />
                  </div>
                </div>
                <div class="foot"><button class="btn btn-ghost" type="submit" [disabled]="savingPwd()">Update password</button></div>
              </form>
            </div>
          </div>
        </div>
      } @else if (failed()) {
        <div class="banner err">Couldn't load your profile.</div>
      }
    </div>
  `,
  styles: [`
    .pagehead{padding:34px 0 8px;display:flex;align-items:flex-end;justify-content:space-between;gap:18px;flex-wrap:wrap}
    .pagehead h1{font-size:29px;font-weight:750}
    .pagehead .sub{color:var(--muted);font-size:14px;margin-top:6px}
    .acct{display:grid;grid-template-columns:300px 1fr;gap:40px;padding:14px 0 70px;align-items:start}
    .idcard{border:1px solid var(--line2);border-radius:6px;background:var(--paper);padding:22px;position:sticky;top:88px}
    .idcard .who{display:flex;gap:14px;align-items:center;margin-bottom:16px}
    .idcard .nm{font-family:var(--ff-d);font-weight:700;font-size:18px}
    .idcard .em{font-family:var(--ff-m);font-size:11px;color:var(--muted);margin-top:2px;word-break:break-all}
    .idcard .facts2{border-top:1px solid var(--line);padding-top:14px;display:flex;flex-direction:column;gap:9px;font-family:var(--ff-m);font-size:11px;color:var(--muted);letter-spacing:.03em}
    .avatar.lg{width:56px;height:56px;border-radius:3px;background:var(--green-soft);color:var(--green);font-weight:700;font-size:19px;display:flex;align-items:center;justify-content:center;border:1px solid var(--green-line)}
    .panel{border:1px solid var(--line2);border-radius:6px;background:var(--paper);padding:24px;margin-bottom:22px}
    .panel h2{font-size:18px;margin-bottom:4px}
    .panel .p-sub{color:var(--muted);font-size:13px;margin-bottom:20px}
    .panel .foot{display:flex;justify-content:flex-end;gap:10px;border-top:1px solid var(--line);padding-top:16px;margin-top:6px}
    @media (max-width:1080px){ .acct{grid-template-columns:1fr} .idcard{position:static} }
  `]
})
export class AccountComponent implements OnInit {
  private auth = inject(AuthService);
  private router = inject(Router);
  private dialog = inject(ConfirmDialogService);
  private toast = inject(ToastService);
  private fb = inject(FormBuilder);

  protected user = signal<User | null>(null);
  protected failed = signal(false);
  protected savingProfile = signal(false);
  protected savingPwd = signal(false);
  protected profileErrors: Record<string, string> = {};
  protected pwdErrors: Record<string, string> = {};

  protected profile: FormGroup = this.fb.group({
    firstName: ['', [Validators.required, Validators.maxLength(60)]],
    lastName: ['', [Validators.required, Validators.maxLength(60)]],
    email: ['', [Validators.required, Validators.email, Validators.maxLength(150)]]
  });
  protected password: FormGroup = this.fb.group({
    currentPassword: ['', [Validators.required]],
    newPassword: ['', [Validators.required, Validators.minLength(6), Validators.maxLength(100)]]
  });

  protected get avatar(): string {
    const u = this.user();
    return u ? initials(u.firstName, u.lastName) : '–';
  }

  ngOnInit(): void {
    this.auth.me().subscribe({
      next: u => {
        this.user.set(u);
        this.profile.patchValue({ firstName: u.firstName, lastName: u.lastName, email: u.email });
      },
      error: () => { this.user.set(null); this.failed.set(true); }
    });
  }

  protected profileField(field: string): string | null {
    const c = this.profile.controls[field];
    if (c?.touched && c?.invalid) {
      if (c.errors?.['required']) return `${cap(field)} is required.`;
      if (c.errors?.['email']) return 'Enter a valid email address.';
      if (c.errors?.['maxlength']) return `Maximum ${c.errors['maxlength'].requiredLength} characters.`;
    }
    return this.profileErrors[field] ?? null;
  }

  protected pwdField(field: string): string | null {
    const c = this.password.controls[field];
    if (c?.touched && c?.invalid) {
      if (c.errors?.['required']) return `${field === 'currentPassword' ? 'Current password' : 'New password'} is required.`;
      if (c.errors?.['minlength']) return 'Password must be 6–100 characters.';
    }
    return this.pwdErrors[field] ?? null;
  }

  saveProfile(): void {
    this.profileErrors = {};
    if (this.profile.invalid) { this.profile.markAllAsTouched(); return; }
    const v = this.profile.value as { firstName: string; lastName: string; email: string };
    const me = this.user();
    if (!me) return;
    const emailChanged = v.email.toLowerCase() !== me.email.toLowerCase();

    if (!emailChanged) {
      // Name-only change → PATCH (PUT) the profile, refresh stored user, toast.
      this.savingProfile.set(true);
      this.auth.updateProfile(v).subscribe({
        next: updated => {
          this.auth.refreshUser(updated);
          this.user.set(updated);
          this.savingProfile.set(false);
          this.toast.success('Profile updated');
        },
        error: (e: ApiError) => this.finishProfileError(e)
      });
      return;
    }

    // Email change → confirm dialog → on OK, push update then clear session + force /login
    // (the JWT subject is the old email; any user-resolving call after this 400s).
    this.dialog.show({
      title: 'Change email and sign out?',
      body: `Your session token is tied to ${me.email}. After changing to ${v.email} the API can no longer resolve the old token, so you'll be signed out and need to sign in again.`,
      confirmText: 'Change email & sign out', cancelText: 'Keep current email',
      onOk: () => {
        this.auth.updateProfile(v).subscribe({
          next: () => {
            this.toast.success('Email updated to ' + v.email + '. Please sign in again.');
            this.auth.clearSession();
            this.router.navigate(['/login'], { queryParams: { flash: `Email updated to ${v.email}. Please sign in again to start a fresh session.` } });
          },
          error: (e: ApiError) => this.finishProfileError(e)
        });
      }
    });
  }

  private finishProfileError(e: ApiError): void {
    this.savingProfile.set(false);
    if (e.fieldError('email')) this.profileErrors = { email: e.fieldError('email')! };
    else this.toast.error(e.message);
  }

  changePwd(): void {
    this.pwdErrors = {};
    if (this.password.invalid) { this.password.markAllAsTouched(); return; }
    const v = this.password.value as { currentPassword: string; newPassword: string };
    if (v.newPassword === v.currentPassword) {
      this.pwdErrors = { newPassword: 'New password must be different from the current one.' };
      return;
    }
    this.savingPwd.set(true);
    this.auth.changePassword(v).subscribe({
      next: () => {
        this.savingPwd.set(false);
        this.password.reset();
        this.toast.success('Password updated');
      },
      error: (e: ApiError) => {
        this.savingPwd.set(false);
        // 400 for wrong current / current-equals-new — surface inline.
        if (e.fieldError('currentPassword')) this.pwdErrors = { currentPassword: e.fieldError('currentPassword')! };
        else if (e.fieldError('newPassword')) this.pwdErrors = { newPassword: e.fieldError('newPassword')! };
        else this.toast.error(e.message);
      }
    });
  }
}

function cap(field: string): string {
  return field === 'firstName' ? 'First name' : field === 'lastName' ? 'Last name' : 'Email';
}
