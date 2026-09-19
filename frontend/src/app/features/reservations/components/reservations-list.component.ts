import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ReservationsService } from '../../../core/services/reservations.service';
import { Reservation, ReservationStatus, PageResponse } from '../../../core/models/models';
import { ReservationFormComponent } from './reservation-form.component';

@Component({
  selector: 'app-reservations-list',
  standalone: true,
  imports: [CommonModule, FormsModule, ReservationFormComponent],
  template: `
    <div class="page-wrapper">
      <div class="page-header">
        <div class="header-title">
          <span class="header-icon">📋</span>
          <div>
            <h1>Reservations</h1>
            <p class="subtitle">{{ page.totalElements }} total reservations</p>
          </div>
        </div>
        <button class="btn btn-primary" (click)="openAdd()">+ New Reservation</button>
      </div>

      <div class="filters-bar">
        <div class="search-wrap">
          <span class="search-icon">⌕</span>
          <input class="search-input" [(ngModel)]="q" placeholder="Search by name, email, phone…" (keyup.enter)="search()" />
        </div>
        <select class="filter-select" [(ngModel)]="statusFilter" (change)="search()">
          <option value="">All statuses</option>
          <option value="pending">Pending</option>
          <option value="confirmed">Confirmed</option>
          <option value="cancelled">Cancelled</option>
          <option value="completed">Completed</option>
        </select>
        <input class="filter-input" type="date" [(ngModel)]="dateFilter" (change)="search()" />
        <button class="btn btn-outline" (click)="search()">Search</button>
        <button class="btn btn-ghost" (click)="clearFilters()">Clear</button>
      </div>

      <div class="table-card">
        <div *ngIf="loading" class="state-message">
          <div class="spinner"></div><span>Loading…</span>
        </div>
        <div *ngIf="error && !loading" class="state-message error"><span>⚠ {{ error }}</span></div>
        <div *ngIf="!loading && rows.length === 0 && !error" class="state-message empty">
          <span class="empty-icon">📋</span><span>No reservations found.</span>
        </div>

        <div *ngIf="!loading && rows.length > 0" class="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Guest</th><th>Contact</th><th>Table</th>
                <th>Party</th><th>Date & Time</th><th>Status</th><th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let r of rows">
                <td>
                  <div class="guest-cell">
                    <span class="avatar">{{ r.guest_name[0].toUpperCase() }}</span>
                    <span class="guest-name">{{ r.guest_name }}</span>
                  </div>
                </td>
                <td>
                  <div class="contact-cell">
                    <span>{{ r.guest_email }}</span>
                    <span class="muted" *ngIf="r.guest_phone">{{ r.guest_phone }}</span>
                  </div>
                </td>
                <td>
                  <span *ngIf="r.table" class="table-badge">#{{ r.table.number }} <span class="muted">({{ r.table.capacity }}p)</span></span>
                  <span *ngIf="!r.table" class="muted">—</span>
                </td>
                <td class="center">{{ r.party_size }}</td>
                <td>
                  <div class="date-cell">
                    <span>{{ r.reservation_date | date:'MMM d, y' }}</span>
                    <span class="muted">{{ r.reservation_date | date:'HH:mm' }}</span>
                  </div>
                </td>
                <td>
                  <span class="status-badge" [class]="'status-' + r.status">{{ r.status }}</span>
                </td>
                <td>
                  <div class="action-group">
                    <button class="btn-icon" title="Edit" (click)="openEdit(r)">✎</button>
                    <select class="status-select" [value]="r.status" (change)="changeStatus(r, $any($event.target).value)">
                      <option value="pending">Pending</option>
                      <option value="confirmed">Confirmed</option>
                      <option value="cancelled">Cancelled</option>
                      <option value="completed">Completed</option>
                    </select>
                    <button class="btn-icon danger" title="Delete" (click)="remove(r)">✕</button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="pagination" *ngIf="page.totalPages > 1">
          <button class="btn btn-outline btn-sm" [disabled]="currentPage === 0" (click)="goTo(currentPage-1)">← Prev</button>
          <span class="page-info">Page {{ currentPage+1 }} of {{ page.totalPages }}</span>
          <button class="btn btn-outline btn-sm" [disabled]="currentPage+1 >= page.totalPages" (click)="goTo(currentPage+1)">Next →</button>
        </div>
      </div>
    </div>

    <div class="modal-backdrop" *ngIf="modalOpen" (click)="closeModal($event)">
      <div class="modal-box">
        <div class="modal-header">
          <h2>{{ editing ? 'Edit Reservation' : 'New Reservation' }}</h2>
          <button class="modal-close" (click)="modalOpen=false">✕</button>
        </div>
        <app-reservation-form [initial]="editing" (saved)="onSaved($event)" (cancelled)="modalOpen=false" />
      </div>
    </div>
  `,
  styleUrls: ['./reservations-list.component.scss']
})
export class ReservationsListComponent implements OnInit {
  rows: Reservation[] = [];
  page: PageResponse<Reservation> = { content: [], page: 0, size: 20, totalElements: 0, totalPages: 0, first: true, last: true, empty: true };
  loading = false; error: string | null = null;
  q = ''; statusFilter = ''; dateFilter = ''; currentPage = 0;
  modalOpen = false; editing: Reservation | null = null;

  constructor(private svc: ReservationsService) {}
  ngOnInit() { this.load(); }

  load() {
    this.loading = true; this.error = null;
    this.svc.list(this.q, this.statusFilter, this.dateFilter, this.currentPage).subscribe({
      next: res => { this.page = res; this.rows = res.content; this.loading = false; },
      error: e => { this.error = e.message || 'Failed to load'; this.loading = false; }
    });
  }

  search() { this.currentPage = 0; this.load(); }
  clearFilters() { this.q = ''; this.statusFilter = ''; this.dateFilter = ''; this.search(); }
  goTo(p: number) { this.currentPage = p; this.load(); }
  openAdd() { this.editing = null; this.modalOpen = true; }
  openEdit(r: Reservation) { this.editing = r; this.modalOpen = true; }
  closeModal(e: MouseEvent) { if ((e.target as HTMLElement).classList.contains('modal-backdrop')) this.modalOpen = false; }
  onSaved(_: Reservation) { this.modalOpen = false; this.load(); }

  changeStatus(r: Reservation, status: ReservationStatus) {
    this.svc.updateStatus(r.id!, status).subscribe({
      next: updated => { const i = this.rows.findIndex(x => x.id === r.id); if (i > -1) this.rows[i] = updated; },
      error: e => alert('Could not update status: ' + (e.message || e))
    });
  }

  remove(r: Reservation) {
    if (!confirm('Delete reservation for "' + r.guest_name + '"?')) return;
    this.svc.remove(r.id!).subscribe({ next: () => this.load(), error: e => alert('Error: ' + e.message) });
  }
}
