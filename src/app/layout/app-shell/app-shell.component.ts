import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { HeaderComponent } from '../header/header.component';
import { ToastComponent } from '../../shared/components/toast/toast.component';

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
    }
    .app-shell-content {
      display: flex;
      flex-direction: column;
      flex: 1;
      min-width: 0;
      overflow: hidden;
    }
    .app-shell-main {
      flex: 1;
      overflow-y: auto;
      padding: 1.5rem;
    }
  `],
})
export class AppShellComponent {}
