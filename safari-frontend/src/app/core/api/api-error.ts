import { HttpErrorResponse } from '@angular/common/http';
import { ApiFieldError, ApiResponse } from '../models/models';

/**
 * Application-level error raised by ApiService whenever a response comes back with
 * success=false AND when the HTTP call itself fails (network/non-2xx). Carries the
 * server message and a field→message map (from errors[]). Components use these two
 * for banners and inline field errors respectively.
 */
export class ApiError extends Error {
  /** human-readable, server-provided message (envelope.message, or a sensible fallback) */
  override readonly message: string;
  /** map of field name → first error message for that field */
  readonly fieldErrors: Record<string, string>;
  readonly status: number;

  constructor(message: string, fieldErrors: Record<string, string>, status: number) {
    super(message);
    this.name = 'ApiError';
    this.message = message;
    this.fieldErrors = fieldErrors;
    this.status = status;
  }

  /** fieldErrors['email'] for a given field, or null. */
  fieldError(field: string): string | null {
    return this.fieldErrors[field] ?? null;
  }

  /** True when an HTTP-layer failure happened (non-2xx) and we mapped it onto this. */
  get isHttpError(): boolean { return this.status > 0; }

  static fromResponse(body: ApiResponse<unknown> | null, status: number): ApiError {
    const message = body?.message ?? defaultForStatus(status);
    const fieldErrors = mapFieldErrors(body?.errors ?? []);
    return new ApiError(message, fieldErrors, status);
  }

  /** Convert a raw HttpErrorResponse into an ApiError, handling both our envelope (success:false)
   *  and unexpected error bodies. The 401 case is intercepted centrally in error.interceptor. */
  static fromHttp(err: HttpErrorResponse): ApiError {
    const body = err.error as ApiResponse<unknown> | null;
    if (body && typeof body === 'object' && 'success' in body) {
      return ApiError.fromResponse(body, err.status);
    }
    return new ApiError(defaultForStatus(err.status), {}, err.status);
  }
}

/** Turn the errors[] array into a { field: message } record (first message wins per field). */
export function mapFieldErrors(errors: ApiFieldError[]): Record<string, string> {
  const out: Record<string, string> = {};
  for (const e of errors) {
    if (e?.field && !(e.field in out)) out[e.field] = e.message;
  }
  return out;
}

function defaultForStatus(status: number): string {
  if (status === 0) return 'Network error — could not reach the server.';
  if (status === 403) return 'You do not have permission to do that.';
  if (status === 404) return 'That trip or resource was not found.';
  if (status === 409) return 'That action conflicts with an existing record.';
  if (status >= 500) return 'Something went wrong on the server. Please try again.';
  return 'The request could not be completed.';
}
