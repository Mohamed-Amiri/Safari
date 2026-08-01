# SafariHub backend handoff for the Angular team

**Source reviewed:** Spring Boot implementation in `SafariHub/src/main/java` (not only the README).  
**API base URL (local):** `http://localhost:8081/api/v1`  
**Interactive contract:** `http://localhost:8081/swagger-ui.html`  
**Current CORS allow-list:** `http://localhost:4200`, `http://localhost:3000`; credentials are allowed. Configure the production Angular origin in `CORS_ALLOWED_ORIGINS`.

## 1. Domain model and relationships

| Entity | Important fields | Relationships and rules |
|---|---|---|
| `User` | `id`, first/last name, unique email, BCrypt password, `USER` or `ADMIN` role | Has many reservations, reviews, and favourites. Password is never returned. |
| `Trip` | destination, description, country, price, start/end dates, total/available seats, image URL, category | Has many reservations and reviews. `averageRating` and `reviewCount` are calculated from reviews at query time. |
| `Reservation` | reservation date, `CONFIRMED` or `CANCELLED` status | Belongs to one user and one trip. Only one **confirmed** booking per user/trip; a cancelled booking may be re-booked. A booking changes availability by exactly one seat. |
| `Review` | 1–5 rating, up-to-1,000-character comment | Belongs to one user and one trip. Exactly one review per user/trip. |
| `Favorite` | saved timestamp | Belongs to one user and one trip. Exactly one favourite per user/trip. |

All entities have a server-generated `id`, `createdAt`, `updatedAt`, and optimistic-lock `version`; only the selected response DTO fields are exposed. No request carries a user ID—the API derives the user from the JWT.

## 2. Cross-cutting HTTP contract

### Authentication

Authenticated requests must include:

```http
Authorization: Bearer <token>
Content-Type: application/json
```

`POST /auth/register` and `POST /auth/login` return a token immediately. Tokens are signed JWTs, expire after `86,400,000` ms (24 hours by default), and contain the email and role. There is no refresh or logout endpoint.

Use an Angular HTTP interceptor to attach the token to protected calls, an auth guard for signed-in routes, and a role guard for `ROLE_ADMIN` routes. On `401`, clear the local session and redirect to login. On `403`, show an access-denied state. Do not rely on client guards as authorization; the server remains authoritative.

### Envelope and data formats

Every response uses this envelope (null properties are omitted):

```json
{
  "success": true,
  "message": "Optional human-readable message",
  "data": {},
  "timestamp": "2026-07-13T12:34:56.789"
}
```

Validation/error response:

```json
{
  "success": false,
  "message": "Validation failed",
  "timestamp": "2026-07-13T12:34:56.789",
  "errors": [{ "field": "email", "message": "Email must be valid" }]
}
```

Dates use `YYYY-MM-DD`; timestamps are ISO-8601 `LocalDateTime` values without an offset. Prices are JSON numbers and should be handled with a decimal/currency-safe presentation strategy.

| Status | Meaning for the UI |
|---|---|
| `200` | Read or mutation succeeded. |
| `201` | Account, trip, reservation, review, or favourite created. |
| `400` | Invalid payload, failed business rule, invalid query value, or an ownership failure. Display `message`; render `errors` against fields where present. |
| `401` | Missing/invalid/expired token. Clear session. |
| `403` | Signed-in user lacks admin permission. |
| `404` | Requested trip, reservation, review, favourite, or user does not exist. |
| `409` | Uniqueness/conflict: duplicate email, active booking, review, favourite, or optimistic-lock conflict. Refresh/reconcile before retrying. |
| `500` | Unexpected server error; use a generic recovery state. |

## 3. DTO reference

### Shared response types

| Type | Fields |
|---|---|
| `ApiResponse<T>` | `success` (boolean), optional `message`, optional `data`, `timestamp`, optional `errors[]` where each error has `field` and `message`. |
| `PagedResponse<T>` | `content[]`, plus `pagination`: zero-based `page`, `size`, `totalElements`, `totalPages`, `first`, `last`. |

### Resource types

| Response type | Fields |
|---|---|
| `User` | `id`, `firstName`, `lastName`, `fullName`, `email`, `role` (`ROLE_USER` or `ROLE_ADMIN`), `createdAt`. |
| `Trip` | `id`, `destination`, optional `description`, optional `country`, `price`, optional `startDate`/`endDate`, `availableSeats`, `totalSeats`, optional `imageUrl`/`category`, `averageRating`, `reviewCount`, `createdAt`. |
| `Reservation` | `id`, nested `user` (`User`), nested `trip` (`Trip`), `reservationDate`, `status` (`CONFIRMED` or `CANCELLED`), `createdAt`. |
| `Review` | `id`, `tripId`, `userId`, `userFullName`, `rating`, `comment`, `createdAt`. |
| `Favorite` | `id`, nested `trip` (`Trip`), `createdAt`. |
| `Auth` | `token`, `tokenType` (`Bearer`), `expiresInMs`, nested `user` (`User`). |
| `AdminStats` | `totalUsers`, `totalAdmins`, `totalTrips`, `totalReservations`, `activeReservations`, `totalReviews`, `totalFavorites`. |

## 4. Endpoint reference

### Auth and profile

| Method and path | Access | Request body / validation | Success data | Key outcomes |
|---|---|---|---|---|
| `POST /auth/register` | Public | `{firstName,lastName,email,password}`. Names required/max 60; email valid/max 150; password required, 6–100 chars. | `Auth` | `201`; always creates `ROLE_USER`; `409` when email exists. |
| `POST /auth/login` | Public | `{email,password}`; valid email, both required. | `Auth` | `200`; invalid credentials return `400` (not `401`). |
| `GET /auth/me` | Signed in | — | `User` | Current token subject is used to load the user. |
| `PUT /auth/profile` | Signed in | `{firstName,lastName,email}`; all required; same limits as registration. | `User` | `409` when changing to an existing email. See the email-token caveat below. |
| `PATCH /auth/change-password` | Signed in | `{currentPassword,newPassword}`; new password 6–100 chars. | `null` | `400` for wrong/current-equals-new password. |

### Public trip discovery

| Method and path | Access | Inputs | Success data | Notes |
|---|---|---|---|---|
| `GET /trips` | Public | Optional `keyword`, `destination`, `country`, `category`, `minPrice`, `maxPrice`, plus Spring pagination `page` (zero-based), `size` (default 20), `sort` (for example `price,asc`). | `PagedResponse<Trip>` | Keyword is a case-insensitive contains search over destination, description, and country. Destination/country are contains filters; category is case-insensitive exact match. No date, seat-availability, or rating filter exists. |
| `GET /trips/{id}` | Public | Path `id` | `Trip` | `404` if absent. |

Avoid exposing arbitrary `sort` controls in the UI. The backend does not whitelist fields; send known entity fields such as `price,asc`, `startDate,asc`, `destination,asc`, or `createdAt,desc`.

### Customer actions

| Method and path | Access | Request body / validation | Success data | Business rule and UX implication |
|---|---|---|---|---|
| `POST /reservations` | Signed in | `{tripId,reservationDate}`; both required; date today or later. | `Reservation` (`201`) | Requires a seat and no existing confirmed booking for the same user/trip. Decrements availability by one. The date is not checked against trip dates. |
| `PUT /reservations/{id}/cancel` | Owner only | — | Updated `Reservation` | Only the owner can cancel; can be cancelled once; increments availability by one. |
| `GET /reservations/my` | Signed in | — | `Reservation[]` | Newest first, includes cancelled and confirmed. |
| `POST /favorites` | Signed in | `{tripId}` required. | `Favorite` (`201`) | `409` if already saved. Save the returned favourite ID for removal. |
| `DELETE /favorites/{id}` | Owner only | — | `null` | Removal requires the **favourite ID**, not the trip ID. |
| `GET /favorites/my` | Signed in | — | `Favorite[]` | Newest first; each item includes a full trip object. |
| `GET /reviews/trip/{tripId}` | Public | Path `tripId` | `Review[]` | Newest first; `404` when trip does not exist. |
| `POST /reviews` | Signed in | `{tripId,rating,comment}`; rating 1–5; nonblank comment max 1,000. | `Review` (`201`) | A customer may review any trip; no completed-reservation requirement. One review per user/trip (`409` on duplicate). |
| `PUT /reviews/{id}` | Owner only | Same `ReviewRequest` as create. | Updated `Review` | `tripId` is validated as required but **ignored**; only rating/comment are updated. Submit the current trip ID. |
| `DELETE /reviews/{id}` | Owner only | — | `null` | Owner-only. |

### Admin actions

Every endpoint in this section requires `ROLE_ADMIN`; a `ROLE_USER` receives `403`.

| Method and path | Request body / validation | Success data | Notes |
|---|---|---|---|
| `POST /trips` | `TripRequest`: required destination (max 120), positive price, total seats >= 1; optional description max 2,000, country max 80, image URL max 600, category max 60, future start/end dates, end after start; available seats >= 0. | Created `Trip` (`201`) | If `availableSeats` is omitted or is `0`, the backend sets it to total seats. |
| `PUT /trips/{id}` | Same `TripRequest` fields and validation. | Updated `Trip` | Semantically a full edit, although nullable optional fields are not overwritten because MapStruct ignores nulls. No seat-consistency rule is enforced. |
| `DELETE /trips/{id}` | — | `null` | Fails with `400` if confirmed reservations exist. |
| `GET /admin/users` | — | `User[]` | No pagination or server-side search/sort. |
| `PUT /admin/users/{id}/promote` | — | `null` | `400` if already admin; no demotion operation. |
| `DELETE /admin/users/{id}` | — | `null` | An admin cannot delete themself. |
| `GET /admin/stats` | — | `AdminStats` | Dashboard totals; no trends or breakdowns. |

## 5. Roles, permissions, and session caveats

| Capability | Visitor | `ROLE_USER` | `ROLE_ADMIN` |
|---|:---:|:---:|:---:|
| Browse/search trip details and reviews | Yes | Yes | Yes |
| Register/login | Yes | Yes | Yes |
| Manage own profile/password, bookings, favourites, reviews | No | Yes | Yes |
| Create/edit/delete trips | No | No | Yes |
| See users/stats, promote/delete users | No | No | Yes |

Important implementation details:

1. **Email change breaks the current token session.** The JWT subject remains the old email, but profile update changes the database email. The next endpoint that resolves the user by JWT subject will fail with `400 "User not found"`. After a successful email change, the current frontend must clear the token and require a new login. Backend improvement: return a replacement token.
2. **Role changes take effect only after re-login.** The filter trusts the role embedded in the JWT. After promotion, the existing `ROLE_USER` token remains a user token until expiry; log in again to receive a new `ROLE_ADMIN` token. The reverse is also relevant if a future demotion is added.
3. **No token invalidation exists.** Logout is client-side only, password changes do not revoke tokens, and a deleted user can still present a structurally valid token until a user-resolving operation detects the missing account.

## 6. User journeys supported now

### Visitor: discover a trip

1. Land on the catalogue and request `GET /trips` with a default `page=0&size=...`.
2. Search/filter/sort with the supported parameters; show pagination from `data.pagination`.
3. Open a detail page using `GET /trips/{id}` and fetch `GET /reviews/trip/{id}` in parallel.
4. If booking, saving, or reviewing is selected while anonymous, preserve the intended trip/action and redirect to login or registration.

### New customer: register and book

1. Submit registration; on `201`, store `data.token` and `data.user`.
2. On the trip detail page, choose a reservation date (today or later) and submit `POST /reservations`.
3. On `201`, display a confirmation from the returned reservation and refresh the trip detail/list to update `availableSeats`.
4. On `400` no-seat or `409` duplicate booking, show the server message and restore the booking control.
5. The customer sees `GET /reservations/my`, can filter locally by `CONFIRMED`/`CANCELLED`, and can cancel a confirmed item after confirmation.

### Signed-in customer: save and review

1. Load `GET /favorites/my` after authentication or on the Saved Trips page; maintain a `tripId -> favoriteId` map so a card can toggle save/remove.
2. Submit a review from the trip page. After creation, refresh both trip details (aggregate rating) and review list.
3. In the review list, compare `review.userId` with `currentUser.id` to show edit/delete only for the owner. A customer may have one review per trip. The backend does not identify the current user's review separately.

### Signed-in customer: profile and password

1. Hydrate the account screen from `GET /auth/me`; use `PUT /auth/profile` for the full name/email form.
2. If email changes successfully, tell the user that they must sign in again, then clear auth state and navigate to login. If only name changes, refresh stored user data.
3. Use a separate current/new password form for `PATCH /auth/change-password`. Because tokens remain valid, optionally sign out after success as a frontend security policy.

### Admin: operate the platform

1. After admin login, show an admin-only navigation area. Fetch `GET /admin/stats` for the dashboard.
2. Manage trips with the trip form and `POST`/`PUT`; before deletion, warn that confirmed bookings block deletion and handle the returned `400`.
3. Fetch `GET /admin/users` for the user table; require confirmation for promotion/deletion. After promotion, advise the affected user to sign out/in. Never show a self-delete action.

## 7. Required Angular pages and reusable components

### Public and account surfaces

| Page/route area | Required components and API dependencies |
|---|---|
| Home/catalogue | Search input; destination/country/category/price filter panel; approved sort menu; trip-card grid; pagination; loading/empty/error states. `GET /trips`. |
| Trip detail | Hero/image fallback, trip facts, availability badge, ratings summary, reviews list, booking CTA/form, favourite toggle, review composer/editor. `GET /trips/{id}`, `GET /reviews/trip/{id}`; signed-in mutations. |
| Login and registration | Validated forms, field-error mapper, return URL/intended-action handling. `/auth/login`, `/auth/register`. |
| My reservations | Status tabs, reservation cards/table, cancel confirmation dialog. `GET /reservations/my`, cancel endpoint. |
| Saved trips | Trip cards with remove control. `GET /favorites/my`, remove endpoint. |
| Account/profile | Current user card, profile form, change-password form, explicit re-login flow after email update. `/auth/me`, profile/password endpoints. |

### Admin surfaces

| Page/route area | Required components and API dependencies |
|---|---|
| Admin dashboard | Seven metric cards: users, admins, trips, all reservations, active reservations, reviews, favourites. `GET /admin/stats`. |
| Admin trip management | Trip list using public search API; create/edit form; deletion confirmation and blocked-delete feedback. Admin trip endpoints. |
| Admin users | User table with role/status information, promote/delete confirmations, client-side search due to absent API filtering/pagination. `GET /admin/users`, promote/delete endpoints. |

### Application-level infrastructure

- `AuthService` / session store holding token, expiry, and user; restore cautiously on reload and validate with `/auth/me`.
- HTTP interceptor that adds `Authorization`, unwraps `ApiResponse<T>` consistently, maps validation field errors, and handles 401 centrally.
- `authGuard` and `adminGuard`, plus an `owner` predicate in review/reservation/favourite presentation components.
- Shared `ApiError`, form error presenter, confirmation dialog, toast/inline feedback, skeletons, empty states, image fallback, currency/date formatter, rating display/input, availability badge, and pagination control.

## 8. Backend gaps that materially affect UX

### Highest priority

1. **Return a new JWT after profile email changes** (or retain a stable immutable user ID as subject). Current behavior strands the active session.
2. **Refresh/revocation/logout model.** Add refresh-token rotation, logout/revocation, and invalidate sessions after password change, role change, or user deletion. This removes surprising stale privileges and supports a reliable session-expiry UX.
3. **Enforce trip-seat invariants on admin edit.** The API permits `availableSeats` greater than `totalSeats`, or lower than active bookings imply; it also does not protect `totalSeats` against booked capacity. Validate these fields and use concurrency-safe inventory updates.
4. **Make reservation semantics complete.** A booking has no travellers/quantity/contact details/payment/status beyond confirmed/cancelled; its chosen date is not tied to the trip's start date; cancellation has no cut-off. Product decisions and endpoints are needed before a production checkout can be designed.

### Important product/UX gaps

5. **Review eligibility/moderation:** anyone can review any trip, even without a reservation; no moderation/reporting exists. Add completed-trip eligibility and a moderation workflow if ratings are trusted content.
6. **Favourite state in discovery:** trip responses do not expose `isFavorite` or favourite ID for the current user. The UI must fetch all favourites and join client-side. Add an authenticated catalogue projection or bulk favourite-ID endpoint for scale.
7. **Trip discovery facets:** no endpoint returns available categories, destinations, price bounds, dates, or availability; filters must be hard-coded or derived from a loaded page. Add a facets endpoint or controlled vocabularies.
8. **Customer booking support:** customers cannot see a booking by ID, alter a reservation, download confirmation, contact support, or receive notifications. Admins cannot list/manage reservations.
9. **Admin user operations do not scale:** `GET /admin/users` is unpaged, unfiltered, and unsorted; there is no demotion/suspension/reactivation, audit history, or user detail endpoint.
10. **Media:** trips only accept a remote image URL; there is no upload, validation, or responsive image metadata.

### Technical/API contract improvements

11. **Clearer authorization semantics:** ownership violations currently return `400`, while role violations return `403`. Use `403` for ownership access denials to simplify client handling.
12. **Explicit update contracts:** review update should not require an ignored `tripId`; use a separate update DTO. Trip `PUT` currently behaves partially for optional nulls; define full-replace vs `PATCH` behavior.
13. **Delete integrity:** deletion of a trip with active reservations is protected, but favourites are not represented as a cascade relationship on `Trip`; test/fix referential behavior for a trip that has favourites to avoid a database-level failure surfacing as `500`.
14. **Pagination/sort hardening:** validate max page size and whitelist sort fields/directions to produce predictable, safe UI behavior.
15. **Dates/time zones:** return offset-aware timestamps (`Instant`/UTC) and document pricing currency/locale. Current timestamps have no timezone and the API has no currency field.

## 9. Initial frontend implementation order

1. API client/envelope/error handling, auth storage/interceptor/guards.
2. Catalogue and detail/review read experience.
3. Registration/login, then favourites and booking/reservation journeys.
4. Profile/password (including forced re-login after email change).
5. Admin dashboard/trips/users behind role guard.
6. Implement the higher-priority backend fixes before treating booking or account security as production-ready.
