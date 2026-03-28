import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { CategoryService } from '../../core/services/category.service';
import { ToastService } from '../../shared/services/toast.service';
import { Category } from '../../core/models';

type FilterType = 'TODOS' | 'RECEITA' | 'DESPESA';

@Component({
  selector: 'app-categories',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './categories.component.html',
})
export class CategoriesComponent implements OnInit {
  private readonly categoryService = inject(CategoryService);
  private readonly toast = inject(ToastService);
  private readonly fb = inject(FormBuilder);

  readonly categories = signal<Category[]>([]);
  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly filter = signal<FilterType>('TODOS');
  readonly showForm = signal(false);
  readonly editingId = signal<string | null>(null);
  readonly confirmDeleteId = signal<string | null>(null);

  readonly form = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    type: ['DESPESA' as 'RECEITA' | 'DESPESA', Validators.required],
  });

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
    this.form.reset({ name: '', type: 'DESPESA' });
    this.showForm.set(true);
  }

  openEdit(cat: Category): void {
    this.editingId.set(cat.id);
    this.form.reset({ name: cat.name, type: cat.type });
    this.showForm.set(true);
  }

  closeForm(): void {
    this.showForm.set(false);
    this.editingId.set(null);
  }

  save(): void {
    if (this.form.invalid || this.saving()) return;
    this.saving.set(true);

    const { name, type } = this.form.value;
    const id = this.editingId();

    const request$ = id
      ? this.categoryService.update(id, { name: name! })
      : this.categoryService.create({ name: name!, type: type as 'RECEITA' | 'DESPESA' });

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
