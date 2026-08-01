import { inject } from '@angular/core';
import { CanActivateChildFn, CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';

/**
 * Routes a guest to /login and back to the intended URL via returnUrl. Used for
 * /bookings, /saved, /account. Note: client guards are UX-only — the server stays
 * authoritative (handoff §2 / §5).
 */
export const authGuard: CanActivateFn & CanActivateChildFn = (_route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  if (auth.isLoggedIn()) return true;
  return router.createUrlTree(['/login'], { queryParams: { returnUrl: state.url } });
};
