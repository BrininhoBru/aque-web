import { Component, HostBinding, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { LayoutService } from '../layout.service';

interface NavItem {
  path: string;
  label: string;
  icon: string;
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './sidebar.component.html',
  styles: [`
    :host {
      display: flex;
      flex-shrink: 0;
      overflow: hidden;
      transition: width 0.25s ease;
      width: 15rem;
    }
    :host.sidebar-closed {
      width: 0;
    }
    .sidebar {
      display: flex;
      flex-direction: column;
      width: 15rem;
      min-width: 15rem;
      height: 100%;
      flex-shrink: 0;
      background: var(--color-surface);
      border-right: 1px solid var(--color-border);
    }
    .sidebar-logo {
      padding: 1.5rem;
      border-bottom: 1px solid var(--color-border);
    }
    .sidebar-brand {
      font-family: var(--font-display);
      font-size: 1.5rem;
      font-weight: 700;
      color: #f1f5f9;
      letter-spacing: -0.03em;
    }
    .sidebar-nav {
      flex: 1;
      padding: 1rem 0.75rem;
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
      overflow-y: auto;
    }
    .sidebar-section-label {
      padding: 0 0.75rem;
      margin-bottom: 0.5rem;
      font-size: 0.7rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      color: var(--color-pending);
    }
    .nav-link {
      display: flex;
      align-items: center;
      gap: 0.65rem;
      padding: 0.5rem 0.75rem;
      border-radius: 8px;
      font-size: 0.875rem;
      font-weight: 500;
      color: #64748b;
      text-decoration: none;
      transition: all 0.15s ease;
    }
    .nav-link:hover {
      background: var(--color-surface2);
      color: #cbd5e1;
    }
    .nav-active {
      background: rgba(99, 102, 241, 0.12) !important;
      color: var(--color-primary-light) !important;
    }
    .sidebar-footer {
      padding: 0.75rem;
      border-top: 1px solid var(--color-border);
    }
    .sidebar-user {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.5rem 0.75rem;
      border-radius: 8px;
      background: var(--color-surface2);
    }
    .sidebar-avatar {
      width: 1.75rem;
      height: 1.75rem;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.75rem;
      font-weight: 700;
      font-family: var(--font-display);
      background: var(--color-primary);
      color: white;
      flex-shrink: 0;
    }
    .sidebar-username {
      font-size: 0.875rem;
      font-weight: 500;
      color: #cbd5e1;
    }
  `],
})
export class SidebarComponent {
  private readonly layout = inject(LayoutService);

  @HostBinding('class.sidebar-closed') get isClosed() {
    return !this.layout.sidebarOpen();
  }

  readonly mainNav: NavItem[] = [
    {
      path: '/dashboard',
      label: 'Dashboard',
      icon: `<svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24"><path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z"/></svg>`,
    },
    {
      path: '/transactions',
      label: 'Lançamentos',
      icon: `<svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24"><path d="M19 3H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2V5a2 2 0 00-2-2zm-7 14l-5-5 1.41-1.41L12 14.17l7.59-7.59L21 8l-9 9z"/></svg>`,
    },
  ];

  readonly secondaryNav: NavItem[] = [
    {
      path: '/recurring',
      label: 'Recorrentes',
      icon: `<svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24"><path d="M12 4V1L8 5l4 4V6c3.31 0 6 2.69 6 6s-2.69 6-6 6-6-2.69-6-6H4c0 4.42 3.58 8 8 8s8-3.58 8-8-3.58-8-8-8z"/></svg>`,
    },
    {
      path: '/categories',
      label: 'Categorias',
      icon: `<svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2l-5.5 9h11L12 2zm0 3.84L13.93 9h-3.87L12 5.84zM17.5 13c-2.49 0-4.5 2.01-4.5 4.5S15.01 22 17.5 22s4.5-2.01 4.5-4.5S19.99 13 17.5 13zm0 7a2.5 2.5 0 010-5 2.5 2.5 0 010 5zM3 21.5h8v-8H3v8zm2-6h4v4H5v-4z"/></svg>`,
    },
    {
      path: '/persons',
      label: 'Pessoas',
      icon: `<svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24"><path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/></svg>`,
    },
    {
      path: '/split',
      label: 'Divisão',
      icon: `<svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24"><path d="M17 12h-5v5h5v-5zM16 1v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19a2 2 0 002 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2h-1V1h-2zm3 18H5V8h14v11z"/></svg>`,
    },
  ];
}
