import { Injectable, signal } from '@angular/core';

const DESKTOP_BREAKPOINT = 768;

@Injectable({ providedIn: 'root' })
export class LayoutService {
  readonly sidebarOpen = signal(
    typeof window !== 'undefined' ? window.innerWidth >= DESKTOP_BREAKPOINT : true
  );

  constructor() {
    if (typeof window === 'undefined') return;

    let debounceTimer: ReturnType<typeof setTimeout>;
    window.addEventListener('resize', () => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        this.sidebarOpen.set(window.innerWidth >= DESKTOP_BREAKPOINT);
      }, 150);
    });
  }

  toggle(): void {
    this.sidebarOpen.update(v => !v);
  }

  close(): void {
    this.sidebarOpen.set(false);
  }
}
