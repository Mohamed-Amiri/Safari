import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from './auth.service';

/**
 * Attaches "Authorization: Bearer <token>" to every outbound request when a token is
 * stored. Content-Type defaults to application/json for bodies handled by HttpClient.
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const token = inject(AuthService).token;
  if (!token || req.headers.has('Authorization')) return next(req);
  const reqWithAuth = req.clone({
    setHeaders: { Authorization: `Bearer ${token}` }
  });
  return next(reqWithAuth);
};
