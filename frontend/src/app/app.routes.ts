import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', redirectTo: 'reservations', pathMatch: 'full' },
  {
    path: 'reservations',
    loadComponent: () =>
      import('./features/reservations/components/reservations-list.component')
        .then(m => m.ReservationsListComponent)
  },
  {
    path: 'tables',
    loadComponent: () =>
      import('./features/tables/components/tables-list.component')
        .then(m => m.TablesListComponent)
  },
  { path: '**', redirectTo: 'reservations' }
];
