import { inject } from '@angular/core';
import { CanActivateChildFn, CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';

/**
 * Guards /admin/** — requires a signed-in ROLE_ADMIN. Guests are sent to login;
 * signed-in travelers land on the 403 Forbidden screen. The role embedded in the
 * stored user is the UX signal; the backend still decides real authorization.
 */
export const adminGuard: CanActivateFn & CanActivateChildFn = (_route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  if (!auth.isLoggedIn()) {
    return router.createUrlTree(['/login'], { queryParams: { returnUrl: state.url } });
  }
  if (auth.isAdmin()) return true;
  return router.createUrlTree(['/forbidden']);
};
