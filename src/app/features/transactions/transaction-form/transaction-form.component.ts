import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { form, FormField, required, min } from '@angular/forms/signals';
import { TransactionService, TransactionPayload } from '../../../core/services/transaction.service';
import { CategoryService } from '../../../core/services/category.service';
import { ToastService } from '../../../shared/services/toast.service';
import { MonthYearService } from '../../../core/services/month-year.service';
import { Category } from '../../../core/models';

interface TransactionModel {
  description: string;
  categoryId: string;
  type: 'RECEITA' | 'DESPESA';
  referenceMonth: number;
  referenceYear: number;
  amountExpected: number;
  amountPaid: number | null;
}

@Component({
  selector: 'app-transaction-form',
  standalone: true,
  imports: [CommonModule, FormField],
  templateUrl: './transaction-form.component.html',
  styles: [`
    .loader {
      width: 14px; height: 14px;
      border: 2px solid rgba(245, 240, 232, 0.3);
      border-top-color: var(--color-ledger-ink-inv);
      border-radius: 50%;
      animation: spin 0.6s linear infinite;
      display: inline-block;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
  `],
})
export class TransactionFormComponent implements OnInit {
  private readonly transactionService = inject(TransactionService);
  private readonly categoryService = inject(CategoryService);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly monthYear = inject(MonthYearService);

  readonly editingId = signal<string | null>(null);
  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly categories = signal<Category[]>([]);

  // Status derivado do valor pago
  readonly statusLabel = computed(() =>
    this.model().amountPaid != null && this.model().amountPaid! > 0 ? 'PAGO' : 'PENDENTE',
  );

  readonly categoriesByType = computed(() =>
    this.categories().filter((c) => c.type === this.transactionForm.type().value()),
  );

  private readonly model = signal<TransactionModel>({
    description: '',
    categoryId: '',
    type: 'DESPESA',
    referenceMonth: this.monthYear.month(),
    referenceYear: this.monthYear.year(),
    amountExpected: 0,
    amountPaid: null,
  });

  readonly transactionForm = form(this.model, (f) => {
    required(f.description, { message: 'Descrição obrigatória' });
    required(f.categoryId, { message: 'Categoria obrigatória' });
    required(f.referenceMonth, { message: 'Mês obrigatório' });
    required(f.referenceYear, { message: 'Ano obrigatório' });
    required(f.amountExpected, { message: 'Valor previsto obrigatório' });
    min(f.amountExpected, 0.01, { message: 'Valor previsto deve ser positivo' });
  });

  readonly formValid = computed(
    () =>
      this.transactionForm.description().valid() &&
      this.transactionForm.categoryId().valid() &&
      this.transactionForm.referenceMonth().valid() &&
      this.transactionForm.referenceYear().valid() &&
      this.transactionForm.amountExpected().valid(),
  );

  readonly months = [
    { value: 1, label: 'Janeiro' },
    { value: 2, label: 'Fevereiro' },
    { value: 3, label: 'Março' },
    { value: 4, label: 'Abril' },
    { value: 5, label: 'Maio' },
    { value: 6, label: 'Junho' },
    { value: 7, label: 'Julho' },
    { value: 8, label: 'Agosto' },
    { value: 9, label: 'Setembro' },
    { value: 10, label: 'Outubro' },
    { value: 11, label: 'Novembro' },
    { value: 12, label: 'Dezembro' },
  ];

  ngOnInit(): void {
    this.categoryService.getAll().subscribe({
      next: (data) => this.categories.set(data),
      error: () => this.toast.error('Erro ao carregar categorias.'),
    });

    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.editingId.set(id);
      this.loadTransaction(id);
    }
  }

  loadTransaction(id: string): void {
    this.loading.set(true);
    // Busca via listagem filtrando por id (API não tem GET /transactions/:id na spec)
    this.transactionService.getAll().subscribe({
      next: (data) => {
        const t = data.find((x) => x.id === id);
        if (t) {
          this.model.set({
            description: t.description,
            categoryId: t.category.id,
            type: t.type,
            referenceMonth: t.referenceMonth,
            referenceYear: t.referenceYear,
            amountExpected: t.amountExpected,
            amountPaid: t.amountPaid,
          });
        } else {
          this.toast.error('Lançamento não encontrado.');
          this.goBack();
        }
        this.loading.set(false);
      },
      error: () => {
        this.toast.error('Erro ao carregar lançamento.');
        this.loading.set(false);
      },
    });
  }

  setType(type: string): void {
    this.transactionForm.type().value.set(type as 'RECEITA' | 'DESPESA');
    this.transactionForm.categoryId().value.set('');
  }

  clearAmountPaid(): void {
    this.transactionForm.amountPaid().value.set(null);
  }

  save(): void {
    if (!this.formValid() || this.saving()) return;
    this.saving.set(true);

    const data = this.model();
    const amountPaid = data.amountPaid && data.amountPaid > 0 ? data.amountPaid : null;

    const payload: TransactionPayload = {
      description: data.description,
      categoryId: data.categoryId,
      type: data.type,
      referenceMonth: data.referenceMonth,
      referenceYear: data.referenceYear,
      amountExpected: data.amountExpected,
      amountPaid,
    };

    const id = this.editingId();
    const request$ = id
      ? this.transactionService.update(id, payload)
      : this.transactionService.create(payload);

    request$.subscribe({
      next: () => {
        this.toast.success(id ? 'Lançamento atualizado!' : 'Lançamento criado!');
        this.goBack();
      },
      error: () => {
        this.toast.error('Erro ao salvar lançamento.');
        this.saving.set(false);
      },
    });
  }

  goBack(): void {
    this.router.navigate(['/transactions']);
  }
}
