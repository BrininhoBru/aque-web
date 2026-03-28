import { Component, inject, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { DashboardService } from '../../core/services/dashboard.service';
import { MonthYearService } from '../../core/services/month-year.service';
import { ToastService } from '../../shared/services/toast.service';
import { BrlCurrencyPipe } from '../../shared/pipes/brl-currency.pipe';
import { MonthYearPipe } from '../../shared/pipes/month-year.pipe';
import { DashboardSummary, CategoryTotal, MonthEvolution, SplitResult } from '../../core/models';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, BrlCurrencyPipe, MonthYearPipe],
  templateUrl: './dashboard.component.html',
})
export class DashboardComponent {
  private readonly dashboardService = inject(DashboardService);
  private readonly toast = inject(ToastService);
  readonly monthYear = inject(MonthYearService);

  readonly loading = signal(true);
  readonly summary = signal<DashboardSummary | null>(null);
  readonly byCategory = signal<CategoryTotal[]>([]);
  readonly evolution = signal<MonthEvolution[]>([]);
  readonly split = signal<SplitResult | null>(null);
  readonly splitError = signal(false);

  readonly balanceExpectedPositive = computed(() => (this.summary()?.balanceExpected ?? 0) >= 0);

  readonly balancePaidPositive = computed(() => (this.summary()?.balancePaid ?? 0) >= 0);

  constructor() {
    effect(() => {
      const { month, year } = this.monthYear.selected();
      this.load(year, month);
    });
  }

  load(year: number, month: number): void {
    this.loading.set(true);
    this.splitError.set(false);

    // Requisições em paralelo conforme spec (forkJoin)
    forkJoin({
      summary: this.dashboardService.getSummary(year, month),
      byCategory: this.dashboardService.getByCategory(year, month),
      evolution: this.dashboardService.getEvolution(year),
      split: this.dashboardService.getSplit(year, month),
    }).subscribe({
      next: (data) => {
        this.summary.set(data.summary);
        this.byCategory.set(data.byCategory);
        this.evolution.set(data.evolution);
        this.split.set(data.split);
        this.loading.set(false);
      },
      error: () => {
        // Tenta carregar parcialmente — split pode dar 404
        this.loadPartial(year, month);
      },
    });
  }

  // Fallback: carrega summary, byCategory e evolution; split separado (pode ser 404)
  private loadPartial(year: number, month: number): void {
    forkJoin({
      summary: this.dashboardService.getSummary(year, month),
      byCategory: this.dashboardService.getByCategory(year, month),
      evolution: this.dashboardService.getEvolution(year),
    }).subscribe({
      next: (data) => {
        this.summary.set(data.summary);
        this.byCategory.set(data.byCategory);
        this.evolution.set(data.evolution);
        this.loading.set(false);
      },
      error: () => {
        this.toast.error('Erro ao carregar dados do dashboard.');
        this.loading.set(false);
      },
    });

    this.dashboardService.getSplit(year, month).subscribe({
      next: (data) => this.split.set(data),
      error: () => {
        this.split.set(null);
        this.splitError.set(true);
      },
    });
  }
}
