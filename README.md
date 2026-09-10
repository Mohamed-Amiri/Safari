# SafariHub — Travel Booking Platform

A full-stack travel booking application: a Spring Boot REST API (`Safari-backend`) serving an Angular SPA (`safari-frontend`, branded **"Voyage"**). Users browse trips, book reservations, leave reviews and save favourites; admins manage trips and users from a dedicated dashboard.

## Repository Layout

```
SafariHub/
├── Safari-backend/     # Spring Boot 3 REST API (Java 17, MySQL, JWT)
└── safari-frontend/    # Angular 18 SPA ("Voyage")
```

## Tech Stack

| Layer    | Technology |
|----------|------------|
| Backend  | Java 17, Spring Boot 3.5 (Web, Data JPA, Security, Validation, Actuator), MySQL |
| Auth     | Stateless JWT (jjwt 0.12), BCrypt password hashing, role-based access (`USER` / `ADMIN`) |
| Mapping  | MapStruct 1.6 (entity ↔ DTO), Lombok |
| Docs     | springdoc-openapi (Swagger UI) |
| Frontend | Angular 18 (standalone components, lazy-loaded routes), TypeScript 5.5, SCSS, RxJS |
| Build    | Maven (wrapper included), Angular CLI 18 |

## Features

### Users
- Register / login with JWT; session persisted and re-validated on reload via `/auth/me`
- Explore trips with keyword search and filters (destination, country, category, price range) + pagination
- Trip detail page with availability, reviews and a booking panel
- Book and cancel reservations (seat counts enforced server-side)
- Save / unsave favourite trips (heart state hydrated on boot)
- Write, edit and delete reviews with star rating
- Account page: update profile, change password

### Admins
- Dashboard with platform stats (users, trips, reservations, reviews, favourites)
- Full trip CRUD (create / edit / delete, seat and pricing management)
- User management: list, promote to admin, delete

## Prerequisites

- **Java 17+** (JDK)
- **Maven 3.9+** (or use the included wrapper `mvnw`)
- **MySQL 8** running on `localhost:3306`
- **Node.js 18+** and npm

## Backend

### 1. Create the database

```sql
CREATE DATABASE IF NOT EXISTS SafariHub;
```

No schema migration is needed — Hibernate (`ddl-auto=update`) creates the tables, and a `DataSeeder` inserts a default admin plus 5 sample trips on first boot.

### 2. Configure

Defaults live in `Safari-backend/src/main/resources/application.properties`, with dev overrides in `application-dev.properties` (active profile: `dev`). The dev profile expects MySQL with user `root` and an **empty password**; adjust `application-dev.properties` if your local MySQL differs.

| Property | Default | Override via |
|---|---|---|
| `server.port` | `8081` | — |
| `spring.datasource.*` | `localhost:3306/SafariHub`, `root` / *(empty in dev)* | edit `application-dev.properties` |
| `app.jwt.secret` | dev key (rotate for production) | `JWT_SECRET` env var |
| `app.jwt.expiration-ms` | `86400000` (24 h) | `JWT_EXPIRATION_MS` |
| `app.cors-allowed-origins` | `http://localhost:4200,http://localhost:3000` | `CORS_ALLOWED_ORIGINS` |
| `app.admin.*` | `admin@safarihub.com` / `Admin@123` | `ADMIN_EMAIL`, `ADMIN_PASSWORD`, … |

### 3. Run

```bash
cd Safari-backend
./mvnw spring-boot:run          # Windows: mvnw.cmd spring-boot:run
```

Or run the prebuilt jar: `java -jar target/safarihub.jar`

- API base: `http://localhost:8081/api/v1`
- Swagger UI: `http://localhost:8081/swagger-ui.html`
- Health check: `http://localhost:8081/actuator/health`

### Default Admin Account

| Email | Password |
|---|---|
| `admin@safarihub.com` | `Admin@123` |

## Frontend

```bash
cd safari-frontend
npm install
npm start            # ng serve → http://localhost:4200
```

The API base URL is configured in `src/environments/environment.ts` (defaults to `http://localhost:8081/api/v1`).

Production build: `npm run build` (output in `dist/`).

## API Overview

All responses use a common envelope: `{ success, message, data, errors, timestamp }`. Public endpoints: `POST /auth/register`, `POST /auth/login`, `GET /trips/**`, `GET /reviews/trip/{tripId}`. Everything else requires a `Authorization: Bearer <token>` header.

| Area | Endpoints |
|---|---|
| Auth | `POST /api/v1/auth/register`, `POST /api/v1/auth/login`, `GET /api/v1/auth/me`, `PUT /api/v1/auth/profile`, `PATCH /api/v1/auth/change-password` |
| Trips | `GET /api/v1/trips` (search/filter/paginate), `GET /api/v1/trips/{id}`, `POST/PUT/DELETE /api/v1/trips[/{id}]` (admin) |
| Reservations | `POST /api/v1/reservations`, `PUT /api/v1/reservations/{id}/cancel`, `GET /api/v1/reservations/my` |
| Reviews | `GET /api/v1/reviews/trip/{tripId}`, `POST /api/v1/reviews`, `PUT/DELETE /api/v1/reviews/{id}` |
| Favorites | `POST /api/v1/favorites`, `DELETE /api/v1/favorites/{id}`, `GET /api/v1/favorites/my` |
| Admin | `GET /api/v1/admin/users`, `PUT /api/v1/admin/users/{id}/promote`, `DELETE /api/v1/admin/users/{id}`, `GET /api/v1/admin/stats` |

Full interactive documentation is available in Swagger UI once the backend is running.

## Docker (backend)

```bash
cd Safari-backend
./mvnw clean package -DskipTests
docker build -t safarihub-api .
docker run -p 8081:8081 --env JWT_SECRET=<your-256-bit-secret> safarihub-api
```

## Testing

```bash
# Backend (unit tests, H2 in-memory DB)
cd Safari-backend && ./mvnw test

# Frontend
cd safari-frontend && npm test
```

## Architecture Notes

- **Backend** follows a layered structure: `controller` → `service` (interface + impl) → `repository` (Spring Data JPA) with `entity` / `dto` / `mapper` (MapStruct) separation, a `security` package (JWT filter, `UserDetailsService`, method-level `@PreAuthorize`), and a `GlobalExceptionHandler` producing the standard error envelope.
- **Frontend** is organized as `core` (API access, auth, guards, interceptors, domain services), `features` (explore, trip-detail, bookings, saved, account, auth, admin), `layout` (public + admin shells), and `shared/ui` (reusable components, pipes, directives). Routes are lazy-loaded via `loadComponent`.
