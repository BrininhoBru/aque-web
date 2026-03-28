import { Component, inject, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import {
  NgApexchartsModule,
  ApexNonAxisChartSeries,
  ApexAxisChartSeries,
  ApexChart,
  ApexLegend,
  ApexTooltip,
  ApexDataLabels,
  ApexPlotOptions,
  ApexXAxis,
  ApexYAxis,
  ApexStroke,
  ApexGrid,
  ApexMarkers,
} from 'ng-apexcharts';
import { DashboardService } from '../../core/services/dashboard.service';
import { MonthYearService } from '../../core/services/month-year.service';
import { ToastService } from '../../shared/services/toast.service';
import { BrlCurrencyPipe } from '../../shared/pipes/brl-currency.pipe';
import { MonthYearPipe } from '../../shared/pipes/month-year.pipe';
import { DashboardSummary, CategoryTotal, MonthEvolution, SplitResult } from '../../core/models';

export type PieChartOptions = {
  series: ApexNonAxisChartSeries;
  chart: ApexChart;
  labels: string[];
  legend: ApexLegend;
  tooltip: ApexTooltip;
  dataLabels: ApexDataLabels;
  plotOptions: ApexPlotOptions;
  colors: string[];
};

export type LineChartOptions = {
  series: ApexAxisChartSeries;
  chart: ApexChart;
  xaxis: ApexXAxis;
  yaxis: ApexYAxis;
  stroke: ApexStroke;
  legend: ApexLegend;
  tooltip: ApexTooltip;
  dataLabels: ApexDataLabels;
  grid: ApexGrid;
  markers: ApexMarkers;
  colors: string[];
};

type PieFilter = 'DESPESA' | 'RECEITA';
type LineFilter = 'EXPECTED' | 'PAID';

const MONTH_LABELS = [
  'Jan',
  'Fev',
  'Mar',
  'Abr',
  'Mai',
  'Jun',
  'Jul',
  'Ago',
  'Set',
  'Out',
  'Nov',
  'Dez',
];

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, BrlCurrencyPipe, MonthYearPipe, NgApexchartsModule],
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
  readonly pieFilter = signal<PieFilter>('DESPESA');
  readonly lineFilter = signal<LineFilter>('EXPECTED');

  readonly balanceExpectedPositive = computed(() => (this.summary()?.balanceExpected ?? 0) >= 0);

  readonly balancePaidPositive = computed(() => (this.summary()?.balancePaid ?? 0) >= 0);

  readonly filteredByCategory = computed(() =>
    this.byCategory().filter((c) => c.category.type === this.pieFilter()),
  );

  // Opções do gráfico de donut
  readonly pieChartOptions = computed<PieChartOptions>(() => {
    const items = this.filteredByCategory();
    const series = items.map((i) => i.totalExpected);
    const labels = items.map((i) => i.category.name);

    return {
      series,
      labels,
      chart: {
        type: 'donut',
        height: 280,
        background: 'transparent',
        foreColor: '#94a3b8',
        fontFamily: 'DM Sans, sans-serif',
        toolbar: { show: false },
        animations: { enabled: true, speed: 400 },
      },
      colors: [
        '#6366f1',
        '#8b5cf6',
        '#ec4899',
        '#f59e0b',
        '#10b981',
        '#3b82f6',
        '#ef4444',
        '#14b8a6',
      ],
      plotOptions: {
        pie: {
          donut: {
            size: '65%',
            labels: {
              show: true,
              total: {
                show: true,
                label: 'Total',
                color: '#94a3b8',
                fontSize: '12px',
                formatter: (w: any) => {
                  const total = w.globals.seriesTotals.reduce((a: number, b: number) => a + b, 0);
                  return 'R$ ' + total.toLocaleString('pt-BR', { minimumFractionDigits: 2 });
                },
              },
            },
          },
        },
      },
      dataLabels: {
        enabled: true,
        formatter: (val: number) => val.toFixed(1) + '%',
        style: { fontSize: '11px', fontFamily: 'DM Sans, sans-serif' },
        dropShadow: { enabled: false },
      },
      legend: {
        position: 'bottom',
        fontSize: '12px',
        fontFamily: 'DM Sans, sans-serif',
        labels: { colors: '#94a3b8' },
        markers: { size: 6 },
        itemMargin: { horizontal: 8, vertical: 4 },
      },
      tooltip: {
        theme: 'dark',
        y: {
          formatter: (val: number) =>
            'R$ ' + val.toLocaleString('pt-BR', { minimumFractionDigits: 2 }),
        },
      },
    };
  });

  // Opções do gráfico de linha
  readonly lineChartOptions = computed<LineChartOptions>(() => {
    const evo = this.evolution();
    const isPaid = this.lineFilter() === 'PAID';
    const currentMonth = this.monthYear.month();

    const incomeData = evo.map((e) => (isPaid ? e.totalIncomePaid : e.totalIncomeExpected));
    const expenseData = evo.map((e) => (isPaid ? e.totalExpensePaid : e.totalExpenseExpected));

    return {
      series: [
        { name: 'Receitas', data: incomeData },
        { name: 'Despesas', data: expenseData },
      ],
      chart: {
        type: 'line',
        height: 280,
        background: 'transparent',
        foreColor: '#94a3b8',
        fontFamily: 'DM Sans, sans-serif',
        toolbar: { show: false },
        animations: { enabled: true, speed: 400 },
      },
      colors: ['#6366f1', '#ef4444'],
      stroke: {
        curve: 'smooth',
        width: 2.5,
      },
      markers: {
        size: 4,
        strokeWidth: 0,
        hover: { size: 6 },
      },
      xaxis: {
        categories: MONTH_LABELS,
        labels: {
          style: { colors: '#64748b', fontSize: '11px' },
        },
        axisBorder: { show: false },
        axisTicks: { show: false },
        // Destaca mês atual
        crosshairs: { show: true },
      },
      yaxis: {
        labels: {
          style: { colors: '#64748b', fontSize: '11px' },
          formatter: (val: number) =>
            'R$ ' +
            val.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 }),
        },
      },
      grid: {
        borderColor: '#1e2d45',
        strokeDashArray: 4,
        xaxis: { lines: { show: false } },
        yaxis: { lines: { show: true } },
      },
      dataLabels: { enabled: false },
      legend: {
        position: 'top',
        fontSize: '12px',
        fontFamily: 'DM Sans, sans-serif',
        labels: { colors: '#94a3b8' },
        markers: { size: 6 },
      },
      tooltip: {
        theme: 'dark',
        x: { show: true },
        y: {
          formatter: (val: number) =>
            'R$ ' + val.toLocaleString('pt-BR', { minimumFractionDigits: 2 }),
        },
      },
    };
  });

  constructor() {
    effect(() => {
      const { month, year } = this.monthYear.selected();
      this.load(year, month);
    });
  }

  load(year: number, month: number): void {
    this.loading.set(true);
    this.splitError.set(false);

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
      error: () => this.loadPartial(year, month),
    });
  }

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

  setPieFilter(f: PieFilter): void {
    this.pieFilter.set(f);
  }
  setLineFilter(f: LineFilter): void {
    this.lineFilter.set(f);
  }
}
