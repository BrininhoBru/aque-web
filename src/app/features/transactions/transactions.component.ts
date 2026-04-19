import { Component, inject, signal, computed, OnInit, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { TransactionService, TransactionFilters } from '../../core/services/transaction.service';
import { CategoryService } from '../../core/services/category.service';
import { RecurringService } from '../../core/services/recurring.service';
import { ToastService } from '../../shared/services/toast.service';
import { MonthYearService } from '../../core/services/month-year.service';
import { Transaction, Category } from '../../core/models';
import { BrlCurrencyPipe } from '../../shared/pipes/brl-currency.pipe';

type FilterType = 'TODOS' | 'RECEITA' | 'DESPESA';
type FilterStatus = 'TODOS' | 'PENDENTE' | 'PAGO';

@Component({
  selector: 'app-transactions',
  standalone: true,
  imports: [CommonModule, BrlCurrencyPipe],
  templateUrl: './transactions.component.html',
  styles: [`
    /* ── Filter bar ──────────────────────────────────────────── */
    .tx-filter-bar {
      padding: 1rem 1.25rem;
      display: flex;
      flex-wrap: wrap;
      gap: 0.75rem;
      align-items: flex-end;
      background: var(--color-ledger-surface);
    }
    .tx-filter-category {
      display: flex;
      flex-direction: column;
      min-width: 10rem;
      max-width: 16rem;
    }
    @media (max-width: 639px) {
      .tx-filter-category { min-width: 0; max-width: none; width: 100%; }
    }

    /* ── Card layout ─────────────────────────────────────────── */
    .tx-card {
      padding: 0.875rem 1rem;
      display: flex;
      flex-direction: column;
      gap: 0.625rem;
    }
    .tx-card-top {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 0.5rem;
    }
    .tx-card-desc {
      display: flex;
      align-items: center;
      gap: 0.375rem;
      flex: 1;
      min-width: 0;
    }
    .tx-card-recurring-icon { color: var(--color-ledger-ink-lt); flex-shrink: 0; }
    .tx-card-title {
      font-size: 15px;
      font-weight: 500;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .tx-card-mid { display: flex; align-items: center; justify-content: space-between; }
    .tx-card-category { font-size: 13px; color: var(--color-ledger-ink-md); }
    .tx-card-bottom {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding-top: 0.625rem;
      border-top: 1px solid var(--color-ledger-border-lt);
    }
    .tx-card-amounts { display: flex; gap: 1.25rem; }
    .tx-card-amount-item { display: flex; flex-direction: column; gap: 2px; }
    .tx-card-amount-value { font-family: var(--font-mono); font-size: 14px; line-height: 1; }
    .tx-card-actions { display: flex; gap: 4px; }
    .tx-card-summary {
      padding: 1rem;
      display: flex;
      flex-direction: column;
      gap: 0.625rem;
    }
    .tx-summary-row { display: flex; align-items: center; justify-content: space-between; }
    .tx-summary-value { font-family: var(--font-mono); font-size: 14px; font-weight: 500; }
  `],
})
export class TransactionsComponent implements OnInit {
  private readonly transactionService = inject(TransactionService);
  private readonly categoryService = inject(CategoryService);
  private readonly recurringService = inject(RecurringService);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);
  readonly monthYear = inject(MonthYearService);

  readonly transactions = signal<Transaction[]>([]);
  readonly categories = signal<Category[]>([]);
  readonly loading = signal(false);
  readonly deletingId = signal<string | null>(null);
  readonly confirmDeleteId = signal<string | null>(null);
  readonly generating = signal(false);

  // Filtros
  readonly filterCategoryId = signal<string>('');
  readonly filterType = signal<FilterType>('TODOS');
  readonly filterStatus = signal<FilterStatus>('TODOS');

  // Recarrega ao mudar mês/ano global
  constructor() {
    effect(() => {
      const { month, year } = this.monthYear.selected();
      this.load(month, year);
    });
  }

  ngOnInit(): void {
    this.categoryService.getAll().subscribe({
      next: (data) => this.categories.set(data),
      error: () => this.toast.error('Erro ao carregar categorias.'),
    });
  }

  load(month?: number, year?: number): void {
    const { month: m, year: y } = this.monthYear.selected();
    const filters: TransactionFilters = {
      month: month ?? m,
      year: year ?? y,
    };

    this.loading.set(true);
    this.transactionService.getAll(filters).subscribe({
      next: (data) => {
        this.transactions.set(data);
        this.loading.set(false);
      },
      error: () => {
        this.toast.error('Erro ao carregar lançamentos.');
        this.loading.set(false);
      },
    });
  }

  // Filtros aplicados localmente (evita múltiplas requisições)
  readonly filtered = computed(() => {
    return this.transactions().filter((t) => {
      const catOk = !this.filterCategoryId() || t.category.id === this.filterCategoryId();
      const typeOk = this.filterType() === 'TODOS' || t.type === this.filterType();
      const statusOk = this.filterStatus() === 'TODOS' || t.status === this.filterStatus();
      return catOk && typeOk && statusOk;
    });
  });

  readonly totalExpected = computed(() =>
    this.filtered()
      .filter((t) => t.type === 'DESPESA')
      .reduce((acc, t) => acc + t.amountExpected, 0),
  );

  readonly totalPaid = computed(() =>
    this.filtered()
      .filter((t) => t.type === 'DESPESA' && t.status === 'PAGO')
      .reduce((acc, t) => acc + (t.amountPaid ?? 0), 0),
  );

  readonly totalIncomeExpected = computed(() =>
    this.filtered()
      .filter((t) => t.type === 'RECEITA')
      .reduce((acc, t) => acc + t.amountExpected, 0),
  );

  readonly totalIncomePaid = computed(() =>
    this.filtered()
      .filter((t) => t.type === 'RECEITA' && t.status === 'PAGO')
      .reduce((acc, t) => acc + (t.amountPaid ?? 0), 0),
  );

  setFilterType(v: string): void {
    this.filterType.set(v as FilterType);
  }

  setFilterStatus(v: string): void {
    this.filterStatus.set(v as FilterStatus);
  }

  setFilterCategory(id: string): void {
    this.filterCategoryId.set(id);
  }

  clearFilters(): void {
    this.filterType.set('TODOS');
    this.filterStatus.set('TODOS');
    this.filterCategoryId.set('');
  }

  generateRecurring(): void {
    const { month, year } = this.monthYear.selected();
    this.generating.set(true);
    this.recurringService.generate(year, month).subscribe({
      next: (msg) => {
        this.toast.success(msg);
        this.generating.set(false);
        this.load();
      },
      error: () => {
        this.toast.error('Erro ao gerar recorrentes.');
        this.generating.set(false);
      },
    });
  }

  goToCreate(): void {
    this.router.navigate(['/transactions/form']);
  }

  goToEdit(id: string): void {
    this.router.navigate(['/transactions/form', id]);
  }

  askDelete(id: string): void {
    this.confirmDeleteId.set(id);
  }
  cancelDelete(): void {
    this.confirmDeleteId.set(null);
  }

  confirmDelete(): void {
    const id = this.confirmDeleteId();
    if (!id) return;
    this.deletingId.set(id);

    this.transactionService.delete(id).subscribe({
      next: () => {
        this.toast.success('Lançamento excluído.');
        this.confirmDeleteId.set(null);
        this.deletingId.set(null);
        this.load();
      },
      error: () => {
        this.toast.error('Erro ao excluir lançamento.');
        this.confirmDeleteId.set(null);
        this.deletingId.set(null);
      },
    });
  }
}
