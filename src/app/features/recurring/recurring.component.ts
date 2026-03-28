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

  setFilter(f: FilterActive): void {
    this.filterActive.set(f);
  }

  setType(type: 'RECEITA' | 'DESPESA'): void {
    this.recurringForm.type().value.set(type);
    // Limpa categoria ao trocar tipo
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
