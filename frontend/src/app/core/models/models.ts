export interface Table {
  id?: string;
  number: number;
  capacity: number;
  location?: string;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface TableRequest {
  number: number;
  capacity: number;
  location?: string;
  is_active: boolean;
}

export type ReservationStatus = 'pending' | 'confirmed' | 'cancelled' | 'completed';

export interface Reservation {
  id?: string;
  guest_name: string;
  guest_email: string;
  guest_phone?: string;
  table?: Table;
  party_size: number;
  reservation_date: string;
  duration_minutes: number;
  status: ReservationStatus;
  special_requests?: string;
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

export interface ReservationRequest {
  guest_name: string;
  guest_email: string;
  guest_phone?: string | null;
  table_id: string;
  party_size: number;
  reservation_date: string;
  duration_minutes: number;
  status: ReservationStatus;
  special_requests?: string | null;
  notes?: string | null;
}

export interface PageResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
  empty: boolean;
}
