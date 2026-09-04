import { Component, inject, signal, computed, OnInit, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { TransactionService, TransactionFilters } from '../../core/services/transaction.service';
import { CategoryService } from '../../core/services/category.service';
import { RecurringService } from '../../core/services/recurring.service';
import { ToastService } from '../../shared/services/toast.service';
import { MonthYearService } from '../../core/services/month-year.service';
import { Transaction, Category } from '../../core/models';
import { BrlCurrencyPipe } from '../../shared/pipes/brl-currency.pipe';

type FilterType = 'TODOS' | 'RECEITA' | 'DESPESA';
type FilterStatus = 'TODOS' | 'PENDENTE' | 'PAGO';
type SortColumn = 'description' | 'category' | 'amountExpected' | 'amountPaid' | 'dueDate';

const SORT_COLUMNS: readonly SortColumn[] = [
  'description',
  'category',
  'amountExpected',
  'amountPaid',
  'dueDate',
];

// mesma janela do auto-dismiss do ToastService (coincidência de valor, não acoplamento)
const UNDO_DELETE_WINDOW_MS = 4000;

// fronteira de confiança: o valor vem da URL, o usuário pode editá-la à mão
function pickValid<T extends string>(value: string | null, allowed: readonly T[], fallback: T): T;
function pickValid<T extends string>(value: string | null, allowed: readonly T[], fallback: null): T | null;
function pickValid<T extends string>(
  value: string | null,
  allowed: readonly T[],
  fallback: T | null,
): T | null {
  return value !== null && (allowed as readonly string[]).includes(value) ? (value as T) : fallback;
}

function toIsoDate(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function compareByColumn(a: Transaction, b: Transaction, column: SortColumn): number {
  switch (column) {
    case 'description':
      return a.description.localeCompare(b.description);
    case 'category':
      return a.category.name.localeCompare(b.category.name);
    case 'amountExpected':
      return a.amountExpected - b.amountExpected;
    case 'amountPaid':
      return (a.amountPaid ?? -1) - (b.amountPaid ?? -1);
    case 'dueDate':
      return (a.dueDate ?? '').localeCompare(b.dueDate ?? '');
  }
}

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
    /* .ledger-table checkboxes: styles.css reseta appearance de todo input pra
       permitir os inputs customizados (.ledger-input/.ledger-select) — um checkbox
       sem aparência nativa e sem largura/altura própria fica invisível (0x0), então
       precisa restaurar a aparência nativa aqui, escopado só a esses dois checkboxes. */
    .ledger-table input[type="checkbox"] {
      appearance: auto;
      width: 16px;
      height: 16px;
      cursor: pointer;
    }
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
  private readonly route = inject(ActivatedRoute);
  readonly monthYear = inject(MonthYearService);

  readonly transactions = signal<Transaction[]>([]);
  readonly categories = signal<Category[]>([]);
  readonly loading = signal(false);
  readonly pendingDeleteId = signal<string | null>(null);
  readonly generating = signal(false);
  readonly togglingId = signal<string | null>(null);
  readonly selectedIds = signal<Set<string>>(new Set());
  readonly bulkUpdating = signal(false);

  // Filtros — inicializados a partir dos query params da URL, pra sobreviver a navegação/reload
  readonly filterCategoryId = signal<string>(this.route.snapshot.queryParamMap.get('categoryId') ?? '');
  readonly filterType = signal<FilterType>(
    pickValid(this.route.snapshot.queryParamMap.get('type'), ['TODOS', 'RECEITA', 'DESPESA'], 'TODOS'),
  );
  readonly filterStatus = signal<FilterStatus>(
    pickValid(this.route.snapshot.queryParamMap.get('status'), ['TODOS', 'PENDENTE', 'PAGO'], 'TODOS'),
  );
  readonly searchText = signal<string>(this.route.snapshot.queryParamMap.get('search') ?? '');
  readonly filterOverdue = signal<boolean>(this.route.snapshot.queryParamMap.get('overdue') === '1');
  readonly sortColumn = signal<SortColumn | null>(
    pickValid(this.route.snapshot.queryParamMap.get('sortBy'), SORT_COLUMNS, null),
  );
  readonly sortDirection = signal<'asc' | 'desc'>(
    pickValid(this.route.snapshot.queryParamMap.get('sortDir'), ['asc', 'desc'], 'asc'),
  );

  private latestRequestId = 0;
  private pendingDeleteTimer: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    // Recarrega ao mudar mês/ano global
    effect(() => {
      const { month, year } = this.monthYear.selected();
      this.load(month, year);
    });

    // Espelha os filtros na URL — sem debounce: volume de teclas de um app pessoal
    // não justifica a complexidade extra
    effect(() => {
      this.router.navigate([], {
        relativeTo: this.route,
        queryParams: {
          categoryId: this.filterCategoryId() || null,
          type: this.filterType() === 'TODOS' ? null : this.filterType(),
          status: this.filterStatus() === 'TODOS' ? null : this.filterStatus(),
          search: this.searchText() || null,
          overdue: this.filterOverdue() ? '1' : null,
          sortBy: this.sortColumn(),
          sortDir: this.sortColumn() ? this.sortDirection() : null,
        },
        queryParamsHandling: 'merge',
        replaceUrl: true,
      });
    });
  }

  ngOnInit(): void {
    this.categoryService.getAll().subscribe({
      next: (data) => this.categories.set(data),
    });
  }

  load(month?: number, year?: number): void {
    const { month: m, year: y } = this.monthYear.selected();
    const filters: TransactionFilters = {
      month: month ?? m,
      year: year ?? y,
    };

    this.selectedIds.set(new Set());
    const requestId = ++this.latestRequestId;
    this.loading.set(true);
    this.transactionService.getAll(filters).subscribe({
      next: (data) => {
        if (requestId !== this.latestRequestId) return; // resposta obsoleta, ignora
        this.transactions.set(data);
        this.loading.set(false);
      },
      error: () => {
        if (requestId !== this.latestRequestId) return;
        this.loading.set(false);
      },
    });
  }

  // Filtros, busca, chip de vencidos e ordenação aplicados localmente (evita múltiplas requisições)
  readonly filtered = computed(() => {
    const search = this.searchText().trim().toLowerCase();
    const overdueOnly = this.filterOverdue();
    const todayIso = toIsoDate(new Date());

    let list = this.transactions().filter((t) => {
      const catOk = !this.filterCategoryId() || t.category.id === this.filterCategoryId();
      const typeOk = this.filterType() === 'TODOS' || t.type === this.filterType();
      const statusOk = this.filterStatus() === 'TODOS' || t.status === this.filterStatus();
      const searchOk = !search || t.description.toLowerCase().includes(search);
      const overdueOk =
        !overdueOnly || (t.status === 'PENDENTE' && !!t.dueDate && t.dueDate < todayIso);
      return catOk && typeOk && statusOk && searchOk && overdueOk;
    });

    const column = this.sortColumn();
    if (column) {
      const dir = this.sortDirection() === 'asc' ? 1 : -1;
      list = [...list].sort((a, b) => dir * compareByColumn(a, b, column));
    }

    return list;
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

  setSort(column: SortColumn): void {
    if (this.sortColumn() === column) {
      this.sortDirection.update((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      this.sortColumn.set(column);
      this.sortDirection.set('asc');
    }
  }

  toggleOverdue(): void {
    this.filterOverdue.update((v) => !v);
  }

  clearFilters(): void {
    this.filterType.set('TODOS');
    this.filterStatus.set('TODOS');
    this.filterCategoryId.set('');
    this.searchText.set('');
    this.filterOverdue.set(false);
    this.sortColumn.set(null);
    this.sortDirection.set('asc');
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
      error: () => this.generating.set(false),
    });
  }

  goToCreate(): void {
    this.router.navigate(['/transactions/form']);
  }

  goToEdit(id: string): void {
    this.router.navigate(['/transactions/form', id]);
  }

  askDelete(id: string): void {
    this.pendingDeleteId.set(id);
    this.pendingDeleteTimer = setTimeout(() => this.performDelete(id), UNDO_DELETE_WINDOW_MS);
    this.toast.actionable('Lançamento excluído.', 'warning', {
      label: 'Desfazer',
      onClick: () => this.undoDelete(),
    });
  }

  undoDelete(): void {
    if (this.pendingDeleteTimer) {
      clearTimeout(this.pendingDeleteTimer);
      this.pendingDeleteTimer = null;
    }
    this.pendingDeleteId.set(null);
  }

  private performDelete(id: string): void {
    this.pendingDeleteTimer = null;
    this.pendingDeleteId.set(null);

    this.transactionService.delete(id).subscribe({
      next: () => this.load(),
      // errorInterceptor já mostra o erro (Fase 1, #35) — handler vazio só pro RxJS
      // não relançar por falta de observer
      error: () => {},
    });
  }

  togglePayment(t: Transaction): void {
    const amountPaid = t.status === 'PAGO' ? null : t.amountExpected;
    this.togglingId.set(t.id);

    this.transactionService.updatePayment(t.id, amountPaid).subscribe({
      next: () => {
        this.toast.success(amountPaid ? 'Lançamento marcado como pago.' : 'Lançamento marcado como pendente.');
        this.togglingId.set(null);
        this.load();
      },
      error: () => this.togglingId.set(null),
    });
  }

  isSelected(id: string): boolean {
    return this.selectedIds().has(id);
  }

  toggleSelect(id: string): void {
    this.selectedIds.update((ids) => {
      const next = new Set(ids);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  toggleSelectAll(): void {
    const visibleIds = this.filtered().map((t) => t.id);
    const allSelected = visibleIds.length > 0 && visibleIds.every((id) => this.selectedIds().has(id));
    this.selectedIds.set(allSelected ? new Set() : new Set(visibleIds));
  }

  clearSelection(): void {
    this.selectedIds.set(new Set());
  }

  bulkUpdatePayment(markAsPaid: boolean): void {
    const targets = this.filtered().filter((t) => this.selectedIds().has(t.id));
    if (targets.length === 0) return;

    this.bulkUpdating.set(true);
    const requests = targets.map((t) =>
      this.transactionService.updatePayment(t.id, markAsPaid ? t.amountExpected : null).pipe(
        map(() => ({ ok: true })),
        catchError(() => of({ ok: false })),
      ),
    );

    forkJoin(requests).subscribe((results) => {
      this.bulkUpdating.set(false);
      const failed = results.filter((r) => !r.ok).length;
      const succeeded = results.length - failed;
      if (failed === 0) {
        this.toast.success(`${succeeded} lançamento(s) atualizado(s).`);
      } else {
        this.toast.warning(`${succeeded} atualizado(s), ${failed} falharam.`);
      }
      this.clearSelection();
      this.load();
    });
  }
}
