import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class LayoutService {
  readonly sidebarOpen = signal(true);

  toggle(): void {
    this.sidebarOpen.update(v => !v);
  }
}
