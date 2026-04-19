import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { HeaderComponent } from '../header/header.component';
import { ToastComponent } from '../../shared/components/toast/toast.component';
import { LayoutService } from '../layout.service';

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [RouterOutlet, SidebarComponent, HeaderComponent, ToastComponent],
  templateUrl: './app-shell.component.html',
  styles: [`
    .app-shell-layout {
      display: flex;
      height: 100vh;
      overflow: hidden;
      background: var(--color-ledger-page);
    }
    .app-shell-content {
      display: flex;
      flex-direction: column;
      flex: 1;
      min-width: 0;
      overflow: hidden;
    }
    .app-shell-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 1.5rem;
      height: 3.5rem;
      flex-shrink: 0;
      background: var(--color-ledger-surface);
      border-bottom: 1px solid var(--color-ledger-border-lt);
    }
    .app-shell-main {
      flex: 1;
      overflow-y: auto;
      padding: 2rem;
      background: var(--color-ledger-page);
    }
    .sidebar-backdrop {
      display: none;
    }
    @media (max-width: 767px) {
      .app-shell-header {
        padding: 0 1rem;
      }
      .app-shell-main {
        padding: 1rem;
      }
      .sidebar-backdrop {
        display: block;
        position: fixed;
        inset: 0;
        z-index: 40;
        background: rgba(0, 0, 0, 0.5);
      }
    }
  `],
})
export class AppShellComponent {
  readonly layout = inject(LayoutService);
}
