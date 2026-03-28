import { Component, signal, computed } from '@angular/core';
import { Router } from '@angular/router';

const MONTHS = [
  'Janeiro',
  'Fevereiro',
  'Março',
  'Abril',
  'Maio',
  'Junho',
  'Julho',
  'Agosto',
  'Setembro',
  'Outubro',
  'Novembro',
  'Dezembro',
];

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [],
  template: `
    <header
      class="flex items-center justify-between px-6 h-14 shrink-0"
      style="background: var(--color-surface); border-bottom: 1px solid var(--color-border);"
    >
      <!-- Seletor de mês/ano -->
      <div class="flex items-center gap-1">
        <button class="btn-nav" (click)="prevMonth()">
          <svg width="14" height="14" fill="currentColor" viewBox="0 0 24 24">
            <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z" />
          </svg>
        </button>

        <div
          class="px-4 py-1.5 rounded-lg cursor-default select-none"
          style="background: var(--color-surface2); min-width: 160px; text-align: center;"
        >
          <span
            style="font-family: var(--font-display); font-size: 0.9rem; font-weight: 700;
                       color: #f1f5f9; letter-spacing: -0.01em;"
          >
            {{ monthLabel() }}
          </span>
        </div>

        <button class="btn-nav" (click)="nextMonth()">
          <svg width="14" height="14" fill="currentColor" viewBox="0 0 24 24">
            <path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z" />
          </svg>
        </button>
      </div>

      <!-- Ações -->
      <div class="flex items-center gap-2">
        <button
          class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-all"
          style="color: #64748b; font-weight: 500;"
          (click)="logout()"
          title="Sair"
        >
          <svg width="15" height="15" fill="currentColor" viewBox="0 0 24 24">
            <path
              d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z"
            />
          </svg>
          Sair
        </button>
      </div>
    </header>

    <style>
      .btn-nav {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 28px;
        height: 28px;
        border-radius: 6px;
        border: none;
        background: transparent;
        color: #64748b;
        cursor: pointer;
        transition: all 0.15s ease;
      }
      .btn-nav:hover {
        background: var(--color-surface2);
        color: #cbd5e1;
      }
    </style>
  `,
})
export class HeaderComponent {
  private readonly router = inject(Router);

  // Placeholder — será substituído pelo MonthYearService na TASK-04
  private readonly month = signal(new Date().getMonth());
  private readonly year = signal(new Date().getFullYear());

  readonly monthLabel = computed(() => `${MONTHS[this.month()]} ${this.year()}`);

  prevMonth(): void {
    if (this.month() === 0) {
      this.month.set(11);
      this.year.update((y) => y - 1);
    } else {
      this.month.update((m) => m - 1);
    }
  }

  nextMonth(): void {
    if (this.month() === 11) {
      this.month.set(0);
      this.year.update((y) => y + 1);
    } else {
      this.month.update((m) => m + 1);
    }
  }

  logout(): void {
    localStorage.removeItem('token');
    this.router.navigate(['/login']);
  }
}

import { inject } from '@angular/core';
