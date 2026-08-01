# Task: Convert the SafariHub design prototype to a production Angular app named "Safari", connected to my Spring Boot backend

## Inputs — read both fully before writing any code
1. `safarihub-frontend/` — the approved UI/UX design prototype.
   - `safarihub.html` = the runnable single-file prototype (open it to see the target result)
   - `src/01-head.html` = the complete design-system CSS (tokens, components, layouts)
   - `src/02-data.js` = mock data store — its mutation functions encode the backend business rules and error semantics the UI expects
   - `src/03-app.js` = all public views (catalogue, trip detail, auth, bookings, saved, account)
   - `src/04-admin.js` = admin console, router, event wiring
   This prototype is the source of truth for look, layout, spacing, copy tone, states (loading/empty/error), and interaction patterns. Reproduce it faithfully.
2. `FRONTEND_BACKEND_HANDOFF.md` — the authoritative API contract (endpoints, DTOs, response envelope, status codes, roles, session caveats). Follow it exactly. Do NOT modify the backend.

Backend base URL (local): `http://localhost:8081/api/v1` — Swagger at `http://localhost:8081/swagger-ui.html`. CORS already allows `http://localhost:4200`.

## Rename requirement
The product is renamed **SafariHub → Safari**. Apply it everywhere user-facing and project-level:
- wordmark in header/footer/auth pages (keep the sun-over-horizon logo mark), all `<title>` / route titles ("Safari — Explore trips"), README, toasts/copy
- Angular workspace/project/package name: `safari-frontend`
- After building, run a rename audit (`grep -ri safarihub`) and fix any leftovers.

## Deliverable
A new Angular workspace `safari-frontend/` (Angular 18+, standalone components, no NgModules, typed reactive forms, functional guards/interceptors). No mock data in production code. No UI component library — hand-roll the components exactly as designed in the prototype CSS.

## Architecture
```
src/app/
  core/
    models/        # from handoff §3: ApiResponse<T>, PagedResponse<T>, User, Trip,
                   # Reservation, Review, Favorite, AuthResponse, AdminStats
    api/           # ApiService on HttpClient: unwraps {success,message,data,timestamp,errors[]},
                   # maps errors[] → field-level errors, exposes typed methods
    auth/          # AuthService: login/register/me/updateProfile/changePassword;
                   # stores token+user+expiry (expiresInMs) in localStorage; restores session
                   # on boot by validating GET /auth/me; authInterceptor attaches
                   # "Authorization: Bearer <token>" and handles 401 centrally
                   # (clear session → /login?returnUrl=...); authGuard + adminGuard
                   # (UX only — the server stays authoritative)
    services/      # TripService, ReservationService, ReviewService, FavoriteService, AdminService
  shared/ui/       # RatingScore, AvailabilityBadge, StarInput, ConfirmDialog, ToastService+container,
                   # Pagination, Skeleton, EmptyState, FieldError, image-fallback directive,
                   # currency (USD) + date pipes (API dates are YYYY-MM-DD)
  features/
    explore/       # hero + search bar, filter sidebar, category chips, sort, grid, pagination
    trip-detail/   # facts strip, sticky booking panel, reviews (histogram, composer, own-review edit/delete)
    auth/          # login, register (field validation per handoff limits)
    bookings/      # status tabs (client-side), cancel flow with confirm dialog
    saved/         # favourites grid
    account/       # profile form + change-password form
    admin/         # dashboard (7 stats), trips (table+search, create/edit form with live card preview,
                   # delete + blocked-delete dialog), users (table, promote/delete)
  layout/          # public header/footer shell + admin sidebar shell
```

## Routes (mirror the prototype's hash routes as real routes)
| Route | Guard | API calls |
|---|---|---|
| `/` | — | `GET /trips` (keyword, destination, country, category, minPrice, maxPrice, page, size, sort) |
| `/trips/:id` | — | `GET /trips/{id}` + `GET /reviews/trip/{id}` in parallel |
| `/login`, `/register` | — | `POST /auth/login`, `POST /auth/register` (both return token — store and redirect to returnUrl) |
| `/bookings` | authGuard | `GET /reservations/my`, `PUT /reservations/{id}/cancel` |
| `/saved` | authGuard | `GET /favorites/my`, `DELETE /favorites/{id}` |
| `/account` | authGuard | `GET /auth/me`, `PUT /auth/profile`, `PATCH /auth/change-password` |
| `/admin` | adminGuard | `GET /admin/stats` (+ `GET /trips` for the derived occupancy panel) |
| `/admin/trips`, `/admin/trips/new`, `/admin/trips/:id/edit` | adminGuard | `GET /trips`, `POST /trips`, `PUT /trips/{id}`, `DELETE /trips/{id}` |
| `/admin/users` | adminGuard | `GET /admin/users`, `PUT /admin/users/{id}/promote`, `DELETE /admin/users/{id}` |
| `**` | — | 404 screen (as designed) |

## Behaviors that MUST survive the port (cross-check against src/02-data.js and the handoff)
- Invalid login returns HTTP **400** with a message (not 401) — show it as the form banner.
- Booking: date must be today or later; one confirmed booking per user/trip (**409** → show server message); success shows the reservation REF; refresh the trip afterwards so `availableSeats` updates. Sold-out trips show the disabled state from the prototype.
- Cancel: owner-only, frees one seat; cancelled rows get "Book again".
- Reviews: one per user/trip (**409**); owner-only edit/delete decided by `review.userId === currentUser.id`; `PUT /reviews/{id}` must include the current `tripId` (required but ignored by the API); refresh trip + review list after mutations.
- Favourites: `GET /favorites/my` on session start; maintain a `tripId → favoriteId` map because removal requires the **favourite ID**. Heart toggles on cards and detail must stay in sync.
- Profile: changing email strands the JWT — after a successful email change, show the dialog (as in the prototype), clear the session, and force re-login. Name-only changes just refresh stored user data.
- Admin: promote/delete need confirm dialogs; promotion takes effect at the target user's next login (JWT embeds the role) — surface that caveat; never render self-delete; trip deletion with confirmed bookings returns **400** — show the blocked-delete dialog from the prototype.
- 401 anywhere → clear session → `/login?returnUrl=…` (and return the user there after login, like the prototype's intent flow). 403 → the designed access-denied screen.
- Sorting: only send whitelisted sorts (`createdAt,desc`, `price,asc`, `price,desc`, `startDate,asc`, `destination,asc`). Pagination is zero-based; send `size=9` to match the prototype grid.
- Country filter options: there is no facets endpoint — derive from loaded results (as the prototype does) and note it in a code comment.
- Prices are plain numbers — format as USD; API dates are `YYYY-MM-DD`, timestamps have no timezone.

## Remove (demo-only affordances in the prototype)
- The bottom-right role-switcher pill, the one-click demo sessions on the login page, the artificial 340ms skeleton delay (keep skeletons, tie them to real request state), and the entire in-memory mock store.

## Design fidelity
- Port `src/01-head.html` CSS: the `:root` tokens become global CSS custom properties in `styles.scss`; move component-specific blocks into the matching component styles. Keep the Google Fonts links (Bricolage Grotesque, Instrument Sans, IBM Plex Mono) in `index.html`.
- Preserve: sharp 3–6px radii, 1px hairline borders instead of shadows, the solid green rating score badge, dot+mono availability text, mono overlines/labels, the booking REF styling, empty states, and the admin sidebar register.
- Keep the broken-image fallback (branded SVG data URI) as a directive on all trip images.
- Use `environment.ts` for `apiBaseUrl` (default `http://localhost:8081/api/v1`).

## Process
Work in phases and commit after each one:
1. Scaffold workspace + port design tokens, fonts, and shared UI components
2. Core layer: models, ApiService, AuthService, interceptor, guards
3. Explore + Trip detail (read-only) — verify against the running backend
4. Auth flows, then bookings / saved / account
5. Admin console
6. Final pass: rename audit, loading/empty/error states everywhere, keyboard focus styles, clean `ng build`

If the backend isn't running, still complete everything and list the manual verification steps at the end.

## Acceptance checklist (verify with the backend running)
- Register → auto sign-in (token stored); duplicate email → 409 shown on the email field
- Search/filter/sort/paginate the catalogue; open a trip; reviews render
- Book a trip (seats drop), attempt duplicate booking (409 message), cancel (seats restored)
- Save/unsave from card and detail; `/saved` stays in sync
- Post, edit, delete own review; aggregate rating updates
- Name-only profile edit (toast) vs email edit (forced re-login path)
- Admin: stats load; trip create/edit/delete incl. the blocked-delete case; promote + delete user; self-delete never rendered
- Guest visiting `/bookings` → redirected to login and returned after sign-in; USER visiting `/admin` → 403 screen
