import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { PageResponse, Table, TableRequest } from '../models/models';

@Injectable({ providedIn: 'root' })
export class TablesService {
  private base = `${environment.apiBase}/tables`;

  constructor(private http: HttpClient) {}

  list(q = '', page = 0, size = 20): Observable<PageResponse<Table>> {
    const params = new HttpParams()
      .set('q', q)
      .set('page', page)
      .set('size', size);
    return this.http.get<PageResponse<Table>>(this.base, { params });
  }

  getAll(): Observable<PageResponse<Table>> {
    return this.list('', 0, 100);
  }

  getOne(id: string): Observable<Table> {
    return this.http.get<Table>(`${this.base}/${id}`);
  }

  create(data: TableRequest): Observable<Table> {
    return this.http.post<Table>(this.base, data);
  }

  update(id: string, data: TableRequest): Observable<Table> {
    return this.http.put<Table>(`${this.base}/${id}`, data);
  }

  remove(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }
}
