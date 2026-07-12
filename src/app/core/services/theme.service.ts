import { Injectable, signal, effect } from '@angular/core';

const STORAGE_KEY = 'aque_theme';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  readonly dark = signal(this.getInitial());

  constructor() {
    effect(() => {
      document.documentElement.classList.toggle('dark', this.dark());
      localStorage.setItem(STORAGE_KEY, this.dark() ? 'dark' : 'light');
    });
  }

  toggle(): void {
    this.dark.update((v) => !v);
  }

  private getInitial(): boolean {
    if (typeof window === 'undefined') return false;
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return stored === 'dark';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  }
}
