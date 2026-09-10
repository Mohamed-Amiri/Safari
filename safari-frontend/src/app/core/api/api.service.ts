import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/models';
import { ApiError } from './api-error';

/**
 * Central HTTP entry point. Every call unwraps the { success, data, message, errors, timestamp }
 * envelope (handoff §2): success=true yields data (or a typed payload), success=false throws an
 * ApiError carrying message + a field→message map. Low-level transport (status codes, error
 * casing) lives here so feature services stay one-liners and components see a single error type.
 *
 * get/post returns Observable<T> where T is the data payload; the void variants return void.
 */
@Injectable({ providedIn: 'root' })
export class ApiService {
  private http = inject(HttpClient);
  private readonly base = environment.apiBaseUrl;

  get<T>(path: string, params?: Record<string, string | number | null | undefined>): Observable<T> {
    return this.http.get<ApiResponse<T>>(this.url(path), { params: this.toParams(params) }).pipe(
      map(r => this.unwrap<T>(r)),
      catchError(err => throwApiError(err))
    );
  }

  post<T>(path: string, body: unknown | null = null): Observable<T> {
    return this.http.post<ApiResponse<T>>(this.url(path), body ?? {}).pipe(
      map(r => this.unwrap<T>(r)),
      catchError(err => throwApiError(err))
    );
  }

  put<T>(path: string, body: unknown | null = null): Observable<T> {
    return this.http.put<ApiResponse<T>>(this.url(path), body ?? {}).pipe(
      map(r => this.unwrap<T>(r)),
      catchError(err => throwApiError(err))
    );
  }

  patch<T>(path: string, body: unknown | null = null): Observable<T> {
    return this.http.patch<ApiResponse<T>>(this.url(path), body ?? {}).pipe(
      map(r => this.unwrap<T>(r)),
      catchError(err => throwApiError(err))
    );
  }

  delete<T = void>(path: string): Observable<T> {
    return this.http.delete<ApiResponse<T>>(this.url(path)).pipe(
      map(r => this.unwrap<T>(r)),
      catchError(err => throwApiError(err))
    );
  }

  private url(path: string): string {
    return this.base + (path.startsWith('/') ? path : '/' + path);
  }

  /** Reject responses whose envelope marks success=false; otherwise return data (or null
   *  for empty/204-style payloads like change-password/delete). */
  private unwrap<T>(r: ApiResponse<T>): T {
    if (!r.success) throw ApiError.fromResponse(r, 200);
    return (r.data ?? null) as T;
  }

  private toParams(src?: Record<string, string | number | null | undefined>): HttpParams {
    let p = new HttpParams();
    if (!src) return p;
    for (const [k, v] of Object.entries(src)) {
      if (v === null || v === undefined || v === '') continue;
      p = p.set(k, String(v));
    }
    return p;
  }
}

function throwApiError(err: HttpErrorResponse): Observable<never> {
  // The error interceptor handles 401 centrally (clear + redirect); it re-throws a sentinel
  // that we propagate unchanged so subscribers short-circuit their UI work.
  throw ApiError.fromHttp(err);
}
