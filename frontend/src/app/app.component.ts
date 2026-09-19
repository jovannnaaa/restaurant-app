import { Component } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <div class="app-layout">
      <aside class="sidebar">
        <div class="sidebar-brand">
          <span class="brand-icon">🍽</span>
          <div>
            <div class="brand-name">Reserva</div>
            <div class="brand-sub">Restaurant Manager</div>
          </div>
        </div>
        <nav class="sidebar-nav">
          <a class="nav-item" routerLink="/reservations" routerLinkActive="active">
            <span class="nav-icon">📋</span>
            <span>Reservations</span>
          </a>
          <a class="nav-item" routerLink="/tables" routerLinkActive="active">
            <span class="nav-icon">🪑</span>
            <span>Tables</span>
          </a>
        </nav>
        <div class="sidebar-footer">
          <span class="footer-dot"></span>
          <span class="footer-text">MongoDB · Django · Angular</span>
        </div>
      </aside>
      <main class="main-content">
        <router-outlet />
      </main>
    </div>
  `,
  styles: [`
    .app-layout {
      display: flex;
      min-height: 100vh;
    }

    .sidebar {
      width: 220px;
      flex-shrink: 0;
      background: #1c1410;
      display: flex;
      flex-direction: column;
      padding: 1.5rem 1rem;
      gap: 2rem;
      position: sticky;
      top: 0;
      height: 100vh;
    }

    .sidebar-brand {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0 0.5rem;

      .brand-icon { font-size: 1.8rem; }
      .brand-name {
        font-family: var(--font-display);
        font-size: 1.2rem;
        color: #fff;
        line-height: 1.1;
      }
      .brand-sub {
        font-size: 0.7rem;
        color: #6b5e54;
        letter-spacing: 0.05em;
      }
    }

    .sidebar-nav {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
      flex: 1;
    }

    .nav-item {
      display: flex;
      align-items: center;
      gap: 0.65rem;
      padding: 0.65rem 0.85rem;
      border-radius: var(--radius);
      color: #a0918a;
      text-decoration: none;
      font-size: 0.9rem;
      font-weight: 500;
      transition: background 0.15s, color 0.15s;

      .nav-icon { font-size: 1rem; }

      &:hover { background: rgba(255,255,255,0.06); color: #e8ddd5; }
      &.active { background: var(--accent); color: #fff; }
    }

    .sidebar-footer {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.5rem;

      .footer-dot {
        width: 7px; height: 7px;
        border-radius: 50%;
        background: #2e7d52;
        flex-shrink: 0;
      }
      .footer-text { font-size: 0.7rem; color: #5a4e48; }
    }

    .main-content {
      flex: 1;
      min-width: 0;
      overflow-y: auto;
    }
  `]
})
export class AppComponent {}
