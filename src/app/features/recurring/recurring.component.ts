import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { form, FormField, required, min } from '@angular/forms/signals';
import { RecurringService, RecurringPayload } from '../../core/services/recurring.service';
import { CategoryService } from '../../core/services/category.service';
import { ToastService } from '../../shared/services/toast.service';
import { RecurringTransaction, Category } from '../../core/models';

type FilterActive = 'TODOS' | 'ATIVOS' | 'INATIVOS';

@Component({
  selector: 'app-recurring',
  standalone: true,
  imports: [CommonModule, FormField],
  templateUrl: './recurring.component.html',
  styles: [`
    .rc-card-list { display: none; }
    .rc-fab { display: none; }
    @media (max-width: 767px) {
      .rc-btn-new { display: none; }
      .rc-table-view { display: none; }
      .rc-card-list {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
        padding-bottom: 5rem;
      }
      .rc-card {
        padding: 0.875rem 1rem;
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
      }
      .rc-card-top {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 0.5rem;
      }
      .rc-card-desc {
        display: flex;
        align-items: center;
        gap: 0.375rem;
        flex: 1;
        min-width: 0;
      }
      .rc-card-icon { color: var(--color-ledger-ink-lt); flex-shrink: 0; }
      .rc-card-title {
        font-size: 15px;
        font-weight: 500;
        color: var(--color-ledger-ink);
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      .rc-card-mid {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding-top: 0.5rem;
        border-top: 1px solid var(--color-ledger-border-lt);
      }
      .rc-card-category { font-size: 13px; color: var(--color-ledger-ink-md); }
      .rc-card-amount {
        font-family: var(--font-mono);
        font-size: 14px;
        font-weight: 500;
      }
      .rc-card-actions {
        display: flex;
        gap: 4px;
        justify-content: flex-end;
      }
      .rc-fab {
        display: flex;
        align-items: center;
        justify-content: center;
        position: fixed;
        bottom: 1.5rem;
        right: 1.5rem;
        width: 56px;
        height: 56px;
        border-radius: 50%;
        background: var(--color-ledger-accent);
        color: var(--color-ledger-ink-inv);
        border: none;
        cursor: pointer;
        z-index: 30;
        box-shadow: 0 4px 16px rgba(44, 36, 22, 0.35);
        transition: background 0.15s ease, transform 0.15s ease, box-shadow 0.15s ease;
      }
      .rc-fab:hover {
        background: var(--color-ledger-accent-hv);
        transform: scale(1.06);
        box-shadow: 0 6px 20px rgba(44, 36, 22, 0.45);
      }
      .rc-fab:active { transform: scale(0.96); }
    }
  `],
})
export class RecurringComponent implements OnInit {
  private readonly recurringService = inject(RecurringService);
  private readonly categoryService = inject(CategoryService);
  private readonly toast = inject(ToastService);

  readonly recurrings = signal<RecurringTransaction[]>([]);
  readonly categories = signal<Category[]>([]);
  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly showForm = signal(false);
  readonly editingId = signal<string | null>(null);
  readonly confirmDeactivateId = signal<string | null>(null);
  readonly filterActive = signal<FilterActive>('ATIVOS');

  private readonly model = signal<RecurringPayload>({
    description: '',
    categoryId: '',
    type: 'DESPESA',
    defaultAmount: 0,
  });

  readonly recurringForm = form(this.model, (f) => {
    required(f.description, { message: 'Descrição obrigatória' });
    required(f.categoryId, { message: 'Categoria obrigatória' });
    required(f.defaultAmount, { message: 'Valor obrigatório' });
    min(f.defaultAmount, 0.01, { message: 'Valor deve ser positivo' });
  });

  readonly formValid = computed(
    () =>
      this.recurringForm.description().valid() &&
      this.recurringForm.categoryId().valid() &&
      this.recurringForm.defaultAmount().valid(),
  );

  readonly filtered = computed(() => {
    const f = this.filterActive();
    return this.recurrings().filter((r) => {
      if (f === 'ATIVOS') return r.active;
      if (f === 'INATIVOS') return !r.active;
      return true;
    });
  });

  readonly categoriesByType = computed(() => {
    const type = this.recurringForm.type().value();
    return this.categories().filter((c) => c.type === type);
  });

  ngOnInit(): void {
    this.load();
    this.loadCategories();
  }

  load(): void {
    this.loading.set(true);
    this.recurringService.getAll().subscribe({
      next: (data) => {
        this.recurrings.set(data);
        this.loading.set(false);
      },
      error: () => {
        this.toast.error('Erro ao carregar recorrentes.');
        this.loading.set(false);
      },
    });
  }

  loadCategories(): void {
    this.categoryService.getAll().subscribe({
      next: (data) => this.categories.set(data),
      error: () => this.toast.error('Erro ao carregar categorias.'),
    });
  }

  setFilter(f: string): void {
    this.filterActive.set(f as FilterActive);
  }

  setType(type: string): void {
    this.recurringForm.type().value.set(type as 'RECEITA' | 'DESPESA');
    this.recurringForm.categoryId().value.set('');
  }

  openCreate(): void {
    this.editingId.set(null);
    this.model.set({ description: '', categoryId: '', type: 'DESPESA', defaultAmount: 0 });
    this.showForm.set(true);
  }

  openEdit(r: RecurringTransaction): void {
    this.editingId.set(r.id);
    this.model.set({
      description: r.description,
      categoryId: r.category.id,
      type: r.type,
      defaultAmount: r.defaultAmount,
    });
    this.showForm.set(true);
  }

  closeForm(): void {
    this.showForm.set(false);
    this.editingId.set(null);
  }

  save(): void {
    if (!this.formValid() || this.saving()) return;
    this.saving.set(true);

    const payload = this.model();
    const id = this.editingId();

    const request$ = id
      ? this.recurringService.update(id, payload)
      : this.recurringService.create(payload);

    request$.subscribe({
      next: () => {
        this.toast.success(id ? 'Recorrente atualizado!' : 'Recorrente criado!');
        this.closeForm();
        this.load();
        this.saving.set(false);
      },
      error: () => {
        this.toast.error('Erro ao salvar recorrente.');
        this.saving.set(false);
      },
    });
  }

  askDeactivate(id: string): void {
    this.confirmDeactivateId.set(id);
  }
  cancelDeactivate(): void {
    this.confirmDeactivateId.set(null);
  }

  confirmDeactivate(): void {
    const id = this.confirmDeactivateId();
    if (!id) return;

    this.recurringService.deactivate(id).subscribe({
      next: () => {
        this.toast.success('Recorrente desativado. Lançamentos já gerados não foram afetados.');
        this.confirmDeactivateId.set(null);
        this.load();
      },
      error: () => {
        this.toast.error('Erro ao desativar recorrente.');
        this.confirmDeactivateId.set(null);
      },
    });
  }
}
