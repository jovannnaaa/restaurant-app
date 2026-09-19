import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { PageResponse, Reservation, ReservationRequest, ReservationStatus } from '../models/models';

@Injectable({ providedIn: 'root' })
export class ReservationsService {
  private base = `${environment.apiBase}/reservations`;

  constructor(private http: HttpClient) {}

  list(q = '', statusFilter = '', date = '', page = 0, size = 20): Observable<PageResponse<Reservation>> {
    let params = new HttpParams()
      .set('page', page)
      .set('size', size);
    if (q) params = params.set('q', q);
    if (statusFilter) params = params.set('status', statusFilter);
    if (date) params = params.set('date', date);
    return this.http.get<PageResponse<Reservation>>(this.base, { params });
  }

  getOne(id: string): Observable<Reservation> {
    return this.http.get<Reservation>(`${this.base}/${id}`);
  }

  create(data: ReservationRequest): Observable<Reservation> {
    return this.http.post<Reservation>(this.base, data);
  }

  update(id: string, data: ReservationRequest): Observable<Reservation> {
    return this.http.put<Reservation>(`${this.base}/${id}`, data);
  }

  updateStatus(id: string, status: ReservationStatus): Observable<Reservation> {
    return this.http.patch<Reservation>(`${this.base}/${id}/status`, { status });
  }

  remove(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }
}
