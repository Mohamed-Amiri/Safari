import { APP_INITIALIZER, ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { routes } from './app.routes';
import { authInterceptor } from './core/auth/auth.interceptor';
import { errorInterceptor } from './core/auth/error.interceptor';
import { AuthService } from './core/auth/auth.service';
import { FavoriteService } from './core/services/favorite.service';
import { firstValueFrom } from 'rxjs';

/** Runs before the app renders: validate the stored JWT via GET /auth/me, and (if signed in)
 *  hydrate the favourite map so hearts render in the correct state on the first paint. */
function restoreOnBoot(auth: AuthService, favorites: FavoriteService) {
  return () =>
    auth.restoreSession()
      .then(() => (auth.isLoggedIn() ? firstValueFrom(favorites.load()).then(() => undefined) : Promise.resolve()))
      .catch(() => undefined);
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes, withComponentInputBinding()),
    provideHttpClient(withInterceptors([authInterceptor, errorInterceptor])),
    {
      provide: APP_INITIALIZER,
      useFactory: restoreOnBoot,
      multi: true,
      deps: [AuthService, FavoriteService]
    }
  ]
};
