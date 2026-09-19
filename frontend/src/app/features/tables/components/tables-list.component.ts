import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TablesService } from '../../../core/services/tables.service';
import { Table, TableRequest, PageResponse } from '../../../core/models/models';

@Component({
  selector: 'app-tables-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page-wrapper">
      <div class="page-header">
        <div class="header-title">
          <span class="header-icon">🪑</span>
          <div>
            <h1>Tables</h1>
            <p class="subtitle">{{ page.totalElements }} tables configured</p>
          </div>
        </div>
        <button class="btn btn-primary" (click)="openAdd()">+ Add Table</button>
      </div>

      <div class="filters-bar">
        <div class="search-wrap">
          <span class="search-icon">⌕</span>
          <input class="search-input" [(ngModel)]="q" placeholder="Search by location…" (keyup.enter)="search()" />
        </div>
        <button class="btn btn-outline" (click)="search()">Search</button>
        <button class="btn btn-ghost" (click)="clearFilters()">Clear</button>
      </div>

      <!-- Table grid -->
      <div class="cards-grid" *ngIf="!loading && rows.length > 0">
        <div class="table-card-item" *ngFor="let t of rows" [class.inactive]="!t.is_active">
          <div class="card-top">
            <div class="table-number">#{{ t.number }}</div>
            <span class="status-dot" [class.active]="t.is_active" [title]="t.is_active ? 'Active' : 'Inactive'"></span>
          </div>
          <div class="card-body">
            <div class="capacity-row">
              <span class="cap-icon">👥</span>
              <span>{{ t.capacity }} seats</span>
            </div>
            <div class="location-row" *ngIf="t.location">
              <span class="loc-icon">📍</span>
              <span>{{ t.location }}</span>
            </div>
          </div>
          <div class="card-actions">
            <button class="btn btn-outline btn-sm" (click)="openEdit(t)">Edit</button>
            <button class="btn btn-sm" [class.btn-ghost]="t.is_active" [class.btn-outline]="!t.is_active"
              (click)="toggleActive(t)">
              {{ t.is_active ? 'Deactivate' : 'Activate' }}
            </button>
            <button class="btn-icon danger" title="Delete" (click)="remove(t)">✕</button>
          </div>
        </div>
      </div>

      <div class="table-card" *ngIf="!loading && rows.length === 0">
        <div class="state-message empty">
          <span class="empty-icon">🪑</span>
          <span>No tables found. Add your first table!</span>
        </div>
      </div>

      <div class="table-card" *ngIf="loading">
        <div class="state-message">
          <div class="spinner"></div>
          <span>Loading…</span>
        </div>
      </div>

      <div class="pagination" *ngIf="page.totalPages > 1">
        <button class="btn btn-outline btn-sm" [disabled]="currentPage === 0" (click)="goTo(currentPage-1)">← Prev</button>
        <span class="page-info">Page {{ currentPage+1 }} of {{ page.totalPages }}</span>
        <button class="btn btn-outline btn-sm" [disabled]="currentPage+1 >= page.totalPages" (click)="goTo(currentPage+1)">Next →</button>
      </div>
    </div>

    <!-- Modal -->
    <div class="modal-backdrop" *ngIf="modalOpen" (click)="closeBackdrop($event)">
      <div class="modal-box">
        <div class="modal-header">
          <h2>{{ editing ? 'Edit Table' : 'Add Table' }}</h2>
          <button class="modal-close" (click)="modalOpen=false">✕</button>
        </div>
        <div class="form-wrap">
          <div *ngIf="serverError" class="server-error">{{ serverError }}</div>
          <div class="form-row">
            <div class="form-group">
              <label>Table Number *</label>
              <input [(ngModel)]="f.number" type="number" min="1" />
            </div>
            <div class="form-group">
              <label>Capacity *</label>
              <input [(ngModel)]="f.capacity" type="number" min="1" />
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>Location</label>
              <input [(ngModel)]="f.location" placeholder="window, patio, bar…" />
            </div>
            <div class="form-group">
              <label>Active</label>
              <select [(ngModel)]="f.is_active">
                <option [ngValue]="true">Yes</option>
                <option [ngValue]="false">No</option>
              </select>
            </div>
          </div>
          <div class="form-actions">
            <button class="btn btn-ghost" (click)="modalOpen=false">Cancel</button>
            <button class="btn btn-primary" [disabled]="saving" (click)="submit()">
              {{ saving ? 'Saving…' : (editing ? 'Save Changes' : 'Add Table') }}
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .page-wrapper { padding: 2rem; max-width: 1280px; margin: 0 auto; }

    .page-header {
      display: flex; align-items: center; justify-content: space-between; margin-bottom: 1.5rem;
      .header-title { display: flex; align-items: center; gap: 1rem; }
      .header-icon { font-size: 2.2rem; }
      h1 { font-family: var(--font-display); font-size: 1.8rem; font-weight: 700; color: var(--text-primary); margin: 0; }
      .subtitle { margin: 0; font-size: 0.85rem; color: var(--text-muted); }
    }

    .filters-bar {
      display: flex; gap: 0.75rem; align-items: center; margin-bottom: 1.5rem; flex-wrap: wrap;
      .search-wrap { position: relative; flex: 1 1 220px; }
      .search-icon { position: absolute; left: 0.75rem; top: 50%; transform: translateY(-50%); color: var(--text-muted); font-size: 1.1rem; pointer-events: none; }
      .search-input { width: 100%; padding: 0.55rem 0.75rem 0.55rem 2.2rem; border: 1.5px solid var(--border); border-radius: var(--radius); background: var(--surface); color: var(--text-primary); font-size: 0.9rem; outline: none; box-sizing: border-box; &:focus { border-color: var(--accent); } }
    }

    .cards-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 1rem; margin-bottom: 1.5rem; }

    .table-card-item {
      background: var(--surface); border: 1.5px solid var(--border); border-radius: var(--radius-lg); padding: 1.25rem; display: flex; flex-direction: column; gap: 0.85rem; transition: box-shadow 0.15s;
      &:hover { box-shadow: var(--shadow); }
      &.inactive { opacity: 0.55; }
    }

    .card-top { display: flex; align-items: center; justify-content: space-between; }
    .table-number { font-family: var(--font-display); font-size: 1.5rem; color: var(--text-primary); }
    .status-dot { width: 10px; height: 10px; border-radius: 50%; background: var(--border); &.active { background: #2e7d52; } }

    .card-body { display: flex; flex-direction: column; gap: 0.4rem; font-size: 0.875rem; color: var(--text-muted); }
    .capacity-row, .location-row { display: flex; align-items: center; gap: 0.4rem; }

    .card-actions { display: flex; align-items: center; gap: 0.4rem; flex-wrap: wrap; margin-top: auto; }

    .table-card { background: var(--surface); border: 1.5px solid var(--border); border-radius: var(--radius-lg); overflow: hidden; }

    .state-message { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 0.75rem; padding: 3.5rem 2rem; color: var(--text-muted); font-size: 0.95rem; &.empty { } .empty-icon { font-size: 2.5rem; } .spinner { width: 28px; height: 28px; border: 3px solid var(--border); border-top-color: var(--accent); border-radius: 50%; animation: spin 0.7s linear infinite; } }

    .pagination { display: flex; align-items: center; justify-content: center; gap: 1rem; padding: 1rem; .page-info { font-size: 0.85rem; color: var(--text-muted); } }

    .modal-backdrop { position: fixed; inset: 0; background: rgba(0,0,0,0.45); backdrop-filter: blur(3px); display: flex; align-items: center; justify-content: center; z-index: 100; padding: 1rem; }
    .modal-box { background: var(--surface); border-radius: var(--radius-lg); width: 100%; max-width: 480px; box-shadow: var(--shadow-lg); }
    .modal-header { display: flex; align-items: center; justify-content: space-between; padding: 1.25rem 1.5rem; border-bottom: 1px solid var(--border); h2 { font-family: var(--font-display); font-size: 1.2rem; font-weight: 700; margin: 0; } .modal-close { background: none; border: none; cursor: pointer; font-size: 1.1rem; color: var(--text-muted); padding: 0.25rem; &:hover { color: var(--text-primary); } } }
    .form-wrap { padding: 1.25rem 1.5rem; display: flex; flex-direction: column; gap: 1rem; }
    .server-error { background: var(--danger-soft); border: 1px solid var(--danger); border-radius: var(--radius); color: var(--danger); padding: 0.6rem 0.9rem; font-size: 0.85rem; }

    @keyframes spin { to { transform: rotate(360deg); } }
  `]
})
export class TablesListComponent implements OnInit {
  rows: Table[] = [];
  page: PageResponse<Table> = { content: [], page: 0, size: 20, totalElements: 0, totalPages: 0, first: true, last: true, empty: true };
  loading = false;
  q = '';
  currentPage = 0;

  modalOpen = false;
  editing: Table | null = null;
  saving = false;
  serverError: string | null = null;
  f: any = { number: '', capacity: 4, location: '', is_active: true };

  constructor(private svc: TablesService) {}
  ngOnInit() { this.load(); }

  load() {
    this.loading = true;
    this.svc.list(this.q, this.currentPage).subscribe({
      next: res => { this.page = res; this.rows = res.content; this.loading = false; },
      error: () => this.loading = false
    });
  }

  search() { this.currentPage = 0; this.load(); }
  clearFilters() { this.q = ''; this.search(); }
  goTo(p: number) { this.currentPage = p; this.load(); }

  openAdd() {
    this.editing = null;
    this.f = { number: '', capacity: 4, location: '', is_active: true };
    this.serverError = null;
    this.modalOpen = true;
  }

  openEdit(t: Table) {
    this.editing = t;
    this.f = { number: t.number, capacity: t.capacity, location: t.location ?? '', is_active: t.is_active };
    this.serverError = null;
    this.modalOpen = true;
  }

  closeBackdrop(e: MouseEvent) {
    if ((e.target as HTMLElement).classList.contains('modal-backdrop')) this.modalOpen = false;
  }

  submit() {
    if (!this.f.number || !this.f.capacity) { this.serverError = 'Number and capacity are required.'; return; }
    this.saving = true; this.serverError = null;
    const payload: TableRequest = { number: Number(this.f.number), capacity: Number(this.f.capacity), location: this.f.location || undefined, is_active: this.f.is_active };
    const req = this.editing ? this.svc.update(this.editing.id!, payload) : this.svc.create(payload);
    req.subscribe({
      next: () => { this.saving = false; this.modalOpen = false; this.load(); },
      error: e => { this.saving = false; this.serverError = e?.error ? JSON.stringify(e.error) : (e.message || 'Error'); }
    });
  }

  toggleActive(t: Table) {
    this.svc.update(t.id!, { number: t.number, capacity: t.capacity, location: t.location, is_active: !t.is_active })
      .subscribe({ next: () => this.load() });
  }

  remove(t: Table) {
    if (!confirm(`Delete Table #${t.number}?`)) return;
    this.svc.remove(t.id!).subscribe({ next: () => this.load() });
  }
}
