import { Component, HostBinding, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { LayoutService } from '../layout.service';
import { MAIN_NAV, SECONDARY_NAV } from '../nav-items';

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
    @media (max-width: 767px) {
      :host {
        position: fixed;
        top: 0;
        left: 0;
        height: 100vh;
        height: 100dvh;
        z-index: 50;
        width: 15rem;
        overflow: visible;
        transition: transform 0.25s ease;
        box-shadow: 4px 0 32px rgba(0, 0, 0, 0.5);
      }
      :host.sidebar-closed {
        width: 15rem;
        transform: translateX(-100%);
      }
    }
    .sidebar {
      display: flex;
      flex-direction: column;
      width: 15rem;
      min-width: 15rem;
      height: 100%;
      flex-shrink: 0;
      background: var(--color-ledger-side-bg);
      border-right: none;
    }
    .sidebar-logo {
      padding: 1.25rem 1.25rem 1rem;
      border-bottom: 1px solid rgba(255,255,255,0.08);
    }
    .sidebar-brand {
      font-family: var(--font-serif);
      font-size: 1.375rem;
      font-weight: 700;
      color: var(--color-ledger-side-active);
      letter-spacing: -0.02em;
    }
    .sidebar-nav {
      flex: 1;
      padding: 0.75rem 0.75rem;
      display: flex;
      flex-direction: column;
      gap: 2px;
      overflow-y: auto;
    }
    .sidebar-section-label {
      padding: 0.5rem 0.75rem 0.25rem;
      font-size: 10px;
      font-weight: 500;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      color: var(--color-ledger-side-text);
      opacity: 0.5;
    }
    .nav-link {
      position: relative;
      display: flex;
      align-items: center;
      gap: 0.625rem;
      padding: 0.5rem 0.75rem;
      border-radius: 6px;
      font-size: 0.875rem;
      font-weight: 400;
      color: var(--color-ledger-side-text);
      text-decoration: none;
      transition: all 0.15s ease;
    }
    .nav-link:hover {
      background: rgba(255,255,255,0.06);
      color: var(--color-ledger-side-active);
    }
    .nav-active {
      background: rgba(255,255,255,0.10) !important;
      color: var(--color-ledger-side-active) !important;
      font-weight: 500 !important;
    }
    .nav-active::before {
      content: '';
      position: absolute;
      left: 0;
      width: 3px;
      height: 20px;
      background: var(--color-ledger-side-active);
      border-radius: 0 2px 2px 0;
    }
    .sidebar-footer {
      padding: 0.75rem;
      border-top: 1px solid rgba(255,255,255,0.08);
    }
    .sidebar-user {
      display: flex;
      align-items: center;
      gap: 0.625rem;
      padding: 0.5rem 0.75rem;
      border-radius: 6px;
      background: rgba(255,255,255,0.05);
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
      font-family: var(--font-serif);
      background: rgba(255,255,255,0.15);
      color: var(--color-ledger-side-active);
      flex-shrink: 0;
    }
    .sidebar-username {
      font-size: 0.875rem;
      font-weight: 500;
      color: var(--color-ledger-side-text);
    }
  `],
})
export class SidebarComponent {
  private readonly layout = inject(LayoutService);

  readonly mainNav = MAIN_NAV;
  readonly secondaryNav = SECONDARY_NAV;

  @HostBinding('class.sidebar-closed') get isClosed() {
    return !this.layout.sidebarOpen();
  }

  onNavClick(): void {
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      this.layout.close();
    }
  }
}
