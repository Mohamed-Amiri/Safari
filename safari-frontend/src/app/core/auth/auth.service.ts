import { Injectable, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { lastValueFrom } from 'rxjs';
import { ApiService } from '../api/api.service';
import { AuthResponse, ChangePasswordRequest, LoginRequest, ProfileRequest, RegisterRequest, User } from '../models/models';

const TOKEN_KEY = 'voyage_token';
const USER_KEY = 'voyage_user';
const EXPIRY_KEY = 'voyage_expiry';

/**
 * Session store + auth API client. Holds token, expiry, and the decoded user in
 * localStorage; exposes a signal-backed currentUser so templates subsribe reactively.
 *
 * Boot flow: APP_INITIALIZER calls restoreSession(), which validates the stored token via
 * GET /auth/me synchronously before the app router resolves. On 401 the error interceptor
 * clears the session and redirects to /login?returnUrl=…; that path is also fired here for
 * the boot-time validation.
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private api = inject(ApiService);
  private router = inject(Router);

  private _user = signal<User | null>(this.readUser());
  readonly user = this._user.asReadonly();
  readonly isLoggedIn = computed(() => this._user() !== null);
  readonly isAdmin = computed(() => this._user()?.role === 'ROLE_ADMIN');

  get token(): string | null { return localStorage.getItem(TOKEN_KEY); }

  login(body: LoginRequest) {
    return this.api.post<AuthResponse>('/auth/login', body).pipe(
      // Map happens in AuthService so session state is central; see storeSession.
    );
  }

  register(body: RegisterRequest) {
    return this.api.post<AuthResponse>('/auth/register', body);
  }

  me() { return this.api.get<User>('/auth/me'); }

  updateProfile(body: ProfileRequest) { return this.api.put<User>('/auth/profile', body); }

  changePassword(body: ChangePasswordRequest) { return this.api.patch<void>('/auth/change-password', body); }

  /** Called by login/register upon a successful AuthResponse. Stores token + user + the
   *  computed expiry (now + expiresInMs). */
  storeSession(auth: AuthResponse): void {
    localStorage.setItem(TOKEN_KEY, auth.token);
    localStorage.setItem(USER_KEY, JSON.stringify(auth.user));
    const expiry = Date.now() + (auth.expiresInMs || 86_400_000);
    localStorage.setItem(EXPIRY_KEY, String(expiry));
    this._user.set(auth.user);
  }

  refreshUser(user: User): void {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    this._user.set(user);
  }

  logout(returnUrl?: string): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem(EXPIRY_KEY);
    this._user.set(null);
    this.router.navigate(['/login'], returnUrl ? { queryParams: { returnUrl } } : {});
  }

  clearSession(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem(EXPIRY_KEY);
    this._user.set(null);
  }

  /** Validate the stored token on boot. Resolves (with null on failure) so the
   *  APP_INITIALIZER can await it without surfacing errors. */
  restoreSession(): Promise<void> {
    if (!this.token) return Promise.resolve();
    return lastValueFrom(this.me())
      .then(user => { this._user.set(user ?? null); })
      .catch(() => { this.clearSession(); });
  }

  private readUser(): User | null {
    try {
      const raw = localStorage.getItem(USER_KEY);
      return raw ? JSON.parse(raw) as User : null;
    } catch {
      return null;
    }
  }
}
