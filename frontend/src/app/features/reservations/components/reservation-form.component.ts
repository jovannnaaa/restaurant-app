import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ReservationsService } from '../../../core/services/reservations.service';
import { TablesService } from '../../../core/services/tables.service';
import { Reservation, ReservationRequest, Table } from '../../../core/models/models';

@Component({
  selector: 'app-reservation-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="form-wrap">
      <div *ngIf="serverError" class="server-error">{{ serverError }}</div>

      <div class="form-row">
        <div class="form-group">
          <label>Guest Name *</label>
          <input [(ngModel)]="f.guest_name" name="guest_name" placeholder="Ana Jovanovska" required />
        </div>
        <div class="form-group">
          <label>Email *</label>
          <input [(ngModel)]="f.guest_email" name="guest_email" type="email" placeholder="ana@example.com" required />
        </div>
      </div>

      <div class="form-row">
        <div class="form-group">
          <label>Phone</label>
          <input [(ngModel)]="f.guest_phone" name="guest_phone" placeholder="+389 70 000 000" />
        </div>
        <div class="form-group">
          <label>Party Size *</label>
          <input [(ngModel)]="f.party_size" name="party_size" type="number" min="1" required />
        </div>
      </div>

      <div class="form-row">
        <div class="form-group">
          <label>Table *</label>
          <select [(ngModel)]="f.table_id" name="table_id" required>
            <option value="">— select table —</option>
            <option *ngFor="let t of tables" [value]="t.id">
              Table #{{ t.number }} ({{ t.capacity }} seats){{ t.location ? ' · ' + t.location : '' }}
            </option>
          </select>
        </div>
        <div class="form-group">
          <label>Duration (min)</label>
          <input [(ngModel)]="f.duration_minutes" name="duration_minutes" type="number" min="15" />
        </div>
      </div>

      <div class="form-row">
        <div class="form-group">
          <label>Date & Time *</label>
          <input [(ngModel)]="f.reservation_date" name="reservation_date" type="datetime-local" required />
        </div>
        <div class="form-group">
          <label>Status</label>
          <select [(ngModel)]="f.status" name="status">
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="cancelled">Cancelled</option>
            <option value="completed">Completed</option>
          </select>
        </div>
      </div>

      <div class="form-group">
        <label>Special Requests</label>
        <textarea [(ngModel)]="f.special_requests" name="special_requests" placeholder="Dietary requirements, seating preferences…"></textarea>
      </div>

      <div class="form-group">
        <label>Staff Notes</label>
        <textarea [(ngModel)]="f.notes" name="notes" placeholder="Internal notes for staff…"></textarea>
      </div>

      <div class="form-actions">
        <button class="btn btn-ghost" type="button" (click)="cancelled.emit()">Cancel</button>
        <button class="btn btn-primary" type="button" [disabled]="saving" (click)="submit()">
          {{ saving ? 'Saving…' : (initial ? 'Save Changes' : 'Create Reservation') }}
        </button>
      </div>
    </div>
  `,
  styles: [`
    .form-wrap { padding: 1.25rem 1.5rem; display: flex; flex-direction: column; gap: 1rem; }
    .server-error {
      background: var(--danger-soft);
      border: 1px solid var(--danger);
      border-radius: var(--radius);
      color: var(--danger);
      padding: 0.6rem 0.9rem;
      font-size: 0.85rem;
    }
  `]
})
export class ReservationFormComponent implements OnInit {
  @Input() initial: Reservation | null = null;
  @Output() saved = new EventEmitter<Reservation>();
  @Output() cancelled = new EventEmitter<void>();

  tables: Table[] = [];
  saving = false;
  serverError: string | null = null;

  f: any = {
    guest_name: '', guest_email: '', guest_phone: '',
    table_id: '', party_size: 2,
    reservation_date: '', duration_minutes: 90,
    status: 'pending', special_requests: '', notes: ''
  };

  constructor(
    private resSvc: ReservationsService,
    private tblSvc: TablesService
  ) {}

  ngOnInit() {
    this.tblSvc.getAll().subscribe(p => this.tables = p.content.filter(t => t.is_active));
    if (this.initial) {
      this.f = {
        guest_name: this.initial.guest_name,
        guest_email: this.initial.guest_email,
        guest_phone: this.initial.guest_phone ?? '',
        table_id: this.initial.table?.id ?? '',
        party_size: this.initial.party_size,
        reservation_date: this.toLocalDatetime(this.initial.reservation_date),
        duration_minutes: this.initial.duration_minutes,
        status: this.initial.status,
        special_requests: this.initial.special_requests ?? '',
        notes: this.initial.notes ?? ''
      };
    }
  }

  toLocalDatetime(iso: string): string {
    if (!iso) return '';
    const d = new Date(iso);
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }

  submit() {
    if (!this.f.guest_name || !this.f.guest_email || !this.f.table_id || !this.f.reservation_date) {
      this.serverError = 'Please fill in all required fields.';
      return;
    }
    this.saving = true;
    this.serverError = null;

    const payload: ReservationRequest = {
      guest_name: this.f.guest_name,
      guest_email: this.f.guest_email,
      guest_phone: this.f.guest_phone || null,
      table_id: this.f.table_id,
      party_size: Number(this.f.party_size),
      reservation_date: new Date(this.f.reservation_date).toISOString(),
      duration_minutes: Number(this.f.duration_minutes),
      status: this.f.status,
      special_requests: this.f.special_requests || null,
      notes: this.f.notes || null
    };

    const req = this.initial
      ? this.resSvc.update(this.initial.id!, payload)
      : this.resSvc.create(payload);

    req.subscribe({
      next: r => { this.saving = false; this.saved.emit(r); },
      error: e => {
        this.saving = false;
        this.serverError = e?.error ? JSON.stringify(e.error) : (e.message || 'An error occurred.');
      }
    });
  }
}
