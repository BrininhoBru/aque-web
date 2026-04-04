import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { form, FormField, required, minLength } from '@angular/forms/signals';
import { CategoryService } from '../../core/services/category.service';
import { ToastService } from '../../shared/services/toast.service';
import { Category } from '../../core/models';

type FilterType = 'TODOS' | 'RECEITA' | 'DESPESA';

@Component({
  selector: 'app-categories',
  standalone: true,
  imports: [CommonModule, FormField],
  templateUrl: './categories.component.html',
})
export class CategoriesComponent implements OnInit {
  private readonly categoryService = inject(CategoryService);
  private readonly toast = inject(ToastService);

  readonly categories = signal<Category[]>([]);
  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly filter = signal<FilterType>('TODOS');
  readonly showForm = signal(false);
  readonly editingId = signal<string | null>(null);
  readonly confirmDeleteId = signal<string | null>(null);

  // Model signal — fonte de verdade do formulário
  private readonly model = signal<{ name: string; type: 'RECEITA' | 'DESPESA' }>({
    name: '',
    type: 'DESPESA',
  });

  // Field tree com validações
  readonly categoryForm = form(this.model, (f) => {
    required(f.name, { message: 'Nome obrigatório' });
    minLength(f.name, 2, { message: 'Mínimo 2 caracteres' });
  });

  // Validade geral do form
  readonly formValid = computed(() => this.categoryForm.name().valid());

  readonly predefined = computed(() =>
    this.categories().filter((c) => c.predefined && this.matchFilter(c)),
  );

  readonly custom = computed(() =>
    this.categories().filter((c) => !c.predefined && this.matchFilter(c)),
  );

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.categoryService.getAll().subscribe({
      next: (data) => {
        this.categories.set(data);
        this.loading.set(false);
      },
      error: () => {
        this.toast.error('Erro ao carregar categorias.');
        this.loading.set(false);
      },
    });
  }

  setFilter(f: FilterType): void {
    this.filter.set(f);
  }

  openCreate(): void {
    this.editingId.set(null);
    this.model.set({ name: '', type: 'DESPESA' });
    this.showForm.set(true);
  }

  openEdit(cat: Category): void {
    this.editingId.set(cat.id);
    this.model.set({ name: cat.name, type: cat.type });
    this.showForm.set(true);
  }

  closeForm(): void {
    this.showForm.set(false);
    this.editingId.set(null);
  }

  setType(type: string): void {
    this.categoryForm.type().value.set(type as 'RECEITA' | 'DESPESA');
  }

  save(): void {
    if (!this.formValid() || this.saving()) return;
    this.saving.set(true);

    const { name, type } = this.model();
    const id = this.editingId();

    const request$ = id
      ? this.categoryService.update(id, { name, type })
      : this.categoryService.create({ name, type });

    request$.subscribe({
      next: () => {
        this.toast.success(id ? 'Categoria atualizada!' : 'Categoria criada!');
        this.closeForm();
        this.load();
        this.saving.set(false);
      },
      error: () => {
        this.toast.error('Erro ao salvar categoria.');
        this.saving.set(false);
      },
    });
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
    this.categoryService.delete(id).subscribe({
      next: () => {
        this.toast.success('Categoria excluída.');
        this.confirmDeleteId.set(null);
        this.load();
      },
      error: () => {
        this.toast.error('Não foi possível excluir esta categoria.');
        this.confirmDeleteId.set(null);
      },
    });
  }

  private matchFilter(cat: Category): boolean {
    const f = this.filter();
    return f === 'TODOS' || cat.type === f;
  }
}
