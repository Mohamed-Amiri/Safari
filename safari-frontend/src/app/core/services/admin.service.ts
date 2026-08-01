import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../api/api.service';
import { AdminStats, User } from '../models/models';

@Injectable({ providedIn: 'root' })
export class AdminService {
  private api = inject(ApiService);

  stats(): Observable<AdminStats> { return this.api.get<AdminStats>('/admin/stats'); }
  users(): Observable<User[]> { return this.api.get<User[]>('/admin/users'); }
  promote(userId: number | string): Observable<void> { return this.api.put<void>(`/admin/users/${userId}/promote`, null); }
  deleteUser(userId: number | string): Observable<void> { return this.api.delete<void>(`/admin/users/${userId}`); }
}
