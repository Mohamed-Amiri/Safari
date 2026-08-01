import { Routes } from '@angular/router';
import { authGuard } from './core/auth/auth.guard';
import { adminGuard } from './core/auth/admin.guard';

/**
 * Path-routing mirror of the prototype's hash routes. Public pages render inside the
 * PublicLayout; login/register are full-bleed; admin pages render inside AdminLayout.
 * Feature components are lazy-loaded via loadComponent for lighter initial bundles.
 */
export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./layout/public-layout.component').then(m => m.PublicLayoutComponent),
    children: [
      { path: '', loadComponent: () => import('./features/explore/explore.component').then(m => m.ExploreComponent) },
      {
        path: 'dashboard', canActivate: [authGuard],
        loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent)
      },
      {
        path: 'trips/:id',
        loadComponent: () => import('./features/trip-detail/trip-detail.component').then(m => m.TripDetailComponent)
      },
      {
        path: 'bookings', canActivate: [authGuard],
        loadComponent: () => import('./features/bookings/bookings.component').then(m => m.BookingsComponent)
      },
      {
        path: 'saved', canActivate: [authGuard],
        loadComponent: () => import('./features/saved/saved.component').then(m => m.SavedComponent)
      },
      {
        path: 'account', canActivate: [authGuard],
        loadComponent: () => import('./features/account/account.component').then(m => m.AccountComponent)
      }
    ]
  },
  // Full-bleed auth screens (no header/footer)
  { path: 'login', loadComponent: () => import('./features/auth/login.component').then(m => m.LoginComponent) },
  { path: 'register', loadComponent: () => import('./features/auth/register.component').then(m => m.RegisterComponent) },
  { path: 'forbidden', loadComponent: () => import('./errors/forbidden.component').then(m => m.ForbiddenComponent) },
  {
    path: 'admin', canActivateChild: [adminGuard],
    loadComponent: () => import('./layout/admin-layout.component').then(m => m.AdminLayoutComponent),
    children: [
      { path: '', canActivate: [adminGuard], loadComponent: () => import('./features/admin/dashboard.component').then(m => m.DashboardComponent) },
      { path: 'trips', canActivate: [adminGuard], loadComponent: () => import('./features/admin/admin-trips.component').then(m => m.AdminTripsComponent) },
      {
        path: 'trips/new', canActivate: [adminGuard],
        loadComponent: () => import('./features/admin/admin-trip-form.component').then(m => m.AdminTripFormComponent)
      },
      {
        path: 'trips/:id/edit', canActivate: [adminGuard],
        loadComponent: () => import('./features/admin/admin-trip-form.component').then(m => m.AdminTripFormComponent)
      },
      { path: 'users', canActivate: [adminGuard], loadComponent: () => import('./features/admin/admin-users.component').then(m => m.AdminUsersComponent) }
    ]
  },
  { path: '**', loadComponent: () => import('./errors/not-found.component').then(m => m.NotFoundComponent) }
];
