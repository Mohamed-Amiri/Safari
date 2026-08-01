import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from './auth.service';

/**
 * Central 401 handler: clears the session and bounces to /login?returnUrl=<original path+query>.
 * Translated: 401 "missing/invalid/expired token" (handoff §2). Other statuses are left for
 * ApiService to map into ApiError → component-level error UI. We only short-circuit on 401 to
 * avoid swallowing 400/403/409 that features must surface verbatim.
 *
 * A timestamp guard deduplicates redirect firing when several in-flight calls all return 401
 * at once (only the first redirects; the rest just clear+rethrow).
 */
let last401At = 0;
export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  return next(req).pipe(
    catchError((err: HttpErrorResponse) => {
      // Skip the central redirect for session-validation + auth calls. /auth/me is a probe,
      // not an authenticated content request — a 401 there (stale/expired token on boot)
      // must NOT bounce to /login: AuthService.restoreSession() clears the session itself
      // and lets the app boot to its current route. Redirecting during APP_INITIALIZER
      // hijacks the router before the requested page mounts.
      const isValidationOrAuth =
        req.url.includes('/auth/me') ||
        req.url.includes('/auth/login') ||
        req.url.includes('/auth/register');
      if (err.status === 401 && !isValidationOrAuth) {
        const now = Date.now();
        const already = now - last401At < 1500;
        last401At = now;
        const url = req.urlWithParams;
        let returnUrl = url.split('/api/v1')[1] ?? '';
        auth.clearSession();
        if (!already) router.navigate(['/login'], { queryParams: { returnUrl } });
      }
      return throwError(() => err);
    })
  );
};
