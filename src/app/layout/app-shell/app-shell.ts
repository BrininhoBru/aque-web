import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SidebarComponent } from '../sidebar/sidebar';
import { HeaderComponent } from '../header/header';
import { ToastComponent } from '../../shared/components/toast/toast.component';

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [RouterOutlet, SidebarComponent, HeaderComponent, ToastComponent],
  template: `
    <div class="flex h-screen overflow-hidden" style="background: var(--color-bg);">
      <app-sidebar />

      <div class="flex flex-col flex-1 min-w-0 overflow-hidden">
        <app-header />

        <main class="flex-1 overflow-y-auto p-6">
          <router-outlet />
        </main>
      </div>
    </div>

    <app-toast />
  `,
})
export class AppShellComponent {}
