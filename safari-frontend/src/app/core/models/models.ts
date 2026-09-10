/** Domain + envelope interfaces for the SafariHub API backend (the frontend app itself is
 *  branded "Voyage"), per FRONTEND_BACKEND_HANDOFF.md §3. */

export type UserRole = 'ROLE_USER' | 'ROLE_ADMIN';
export type ReservationStatus = 'CONFIRMED' | 'CANCELLED';

/** Top-level envelope (handoff §2). Null properties are omitted by the server. */
export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
  timestamp?: string;
  errors?: ApiFieldError[];
}

export interface ApiFieldError {
  field: string;
  message: string;
}

/** A single element of the errors[] array; clients map this into per-field messages. */
export interface Pagination {
  page: number;          // zero-based
  size: number;
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
}

export interface PagedResponse<T> {
  content: T[];
  pagination: Pagination;
}

/* ---------- Resources ---------- */

export interface User {
  id: number;
  firstName: string;
  lastName: string;
  fullName?: string;
  email: string;
  role: UserRole;
  createdAt: string;     // ISO LocalDateTime, no offset
}

export interface Trip {
  id: number;
  destination: string;
  description?: string | null;
  country?: string | null;
  price: number;
  startDate?: string | null;   // YYYY-MM-DD
  endDate?: string | null;
  availableSeats: number;
  totalSeats: number;
  imageUrl?: string | null;
  category?: string | null;
  averageRating?: number | null;
  reviewCount?: number;
  createdAt: string;
}

export interface Reservation {
  id: number;
  user: User;
  trip: Trip;
  reservationDate: string;     // YYYY-MM-DD
  status: ReservationStatus;
  createdAt: string;
}

export interface Review {
  id: number;
  tripId: number;
  userId: number;
  userFullName: string;
  rating: number;
  comment: string;
  createdAt: string;
}

export interface Favorite {
  id: number;
  trip: Trip;
  createdAt: string;
}

export interface AuthResponse {
  token: string;
  tokenType: 'Bearer';
  expiresInMs: number;
  user: User;
}

export interface AdminStats {
  totalUsers: number;
  totalAdmins: number;
  totalTrips: number;
  totalReservations: number;
  activeReservations: number;
  totalReviews: number;
  totalFavorites: number;
}

/* ---------- Request bodies ---------- */

export interface LoginRequest { email: string; password: string; }
export interface RegisterRequest { firstName: string; lastName: string; email: string; password: string; }
export interface ProfileRequest { firstName: string; lastName: string; email: string; }
export interface ChangePasswordRequest { currentPassword: string; newPassword: string; }

export interface ReservationRequest { tripId: number; reservationDate: string; }
export interface ReviewRequest { tripId: number; rating: number; comment: string; }
export interface FavoriteRequest { tripId: number; }

/** Trip create/update payload. Optional fields are nullable; the backend (MapStruct) ignores
 *  nulls on PUT. availableSeats omitted/null/0 → server sets to totalSeats on create. */
export interface TripRequest {
  destination: string;
  description?: string | null;
  country?: string | null;
  price: number;
  startDate?: string | null;
  endDate?: string | null;
  totalSeats: number;
  availableSeats?: number | null;
  imageUrl?: string | null;
  category?: string | null;
}
