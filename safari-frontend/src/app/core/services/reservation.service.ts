import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../api/api.service';
import { Reservation, ReservationRequest } from '../models/models';

@Injectable({ providedIn: 'root' })
export class ReservationService {
  private api = inject(ApiService);

  book(body: ReservationRequest): Observable<Reservation> { return this.api.post<Reservation>('/reservations', body); }
  cancel(id: number | string): Observable<Reservation> { return this.api.put<Reservation>(`/reservations/${id}/cancel`, null); }
  mine(): Observable<Reservation[]> { return this.api.get<Reservation[]>('/reservations/my'); }
}
