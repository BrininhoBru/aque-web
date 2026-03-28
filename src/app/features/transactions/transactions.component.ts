import { Component, inject, signal, computed, OnInit, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { TransactionService, TransactionFilters } from '../../core/services/transaction.service';
import { CategoryService } from '../../core/services/category.service';
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
})
export class TransactionsComponent implements OnInit {
  private readonly transactionService = inject(TransactionService);
  private readonly categoryService = inject(CategoryService);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);
  readonly monthYear = inject(MonthYearService);

  readonly transactions = signal<Transaction[]>([]);
  readonly categories = signal<Category[]>([]);
  readonly loading = signal(false);
  readonly deletingId = signal<string | null>(null);
  readonly confirmDeleteId = signal<string | null>(null);

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

  setFilterType(v: FilterType): void {
    this.filterType.set(v);
  }
  setFilterStatus(v: FilterStatus): void {
    this.filterStatus.set(v);
  }
  setFilterCategory(id: string): void {
    this.filterCategoryId.set(id);
  }
  clearFilters(): void {
    this.filterType.set('TODOS');
    this.filterStatus.set('TODOS');
    this.filterCategoryId.set('');
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
