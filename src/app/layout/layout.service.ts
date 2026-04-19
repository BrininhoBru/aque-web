import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class LayoutService {
  readonly sidebarOpen = signal(
    typeof window !== 'undefined' ? window.innerWidth >= 768 : true
  );

  toggle(): void {
    this.sidebarOpen.update(v => !v);
  }

  close(): void {
    this.sidebarOpen.set(false);
  }
}
