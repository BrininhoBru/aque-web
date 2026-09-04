import { Component, inject, signal, computed, effect, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { SplitService, SplitPayload } from '../../core/services/split.service';
import { PersonService } from '../../core/services/person.service';
import { DashboardService } from '../../core/services/dashboard.service';
import { MonthYearService } from '../../core/services/month-year.service';
import { ToastService } from '../../shared/services/toast.service';
import { BrlCurrencyPipe } from '../../shared/pipes/brl-currency.pipe';
import { MonthYearPipe } from '../../shared/pipes/month-year.pipe';
import { Person } from '../../core/models';
import { createLatestRequestGuard } from '../../core/rxjs/latest-request-guard';

interface PersonSplit {
  person: Person;
  percentage: number;
}

@Component({
  selector: 'app-split',
  standalone: true,
  imports: [CommonModule, RouterLink, BrlCurrencyPipe, MonthYearPipe],
  templateUrl: './split.component.html',
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
    .split-indicator {
      padding: 0.75rem 1.5rem;
      border-top: 1px solid var(--color-ledger-border-lt);
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 0.25rem 0.75rem;
      transition: all 0.15s ease;
    }
    .split-indicator-hint {
      font-size: 13px;
      color: var(--color-ledger-ink-lt);
    }
    @media (max-width: 479px) {
      .split-indicator-hint { display: none; }
    }
  `],
})
export class SplitComponent implements OnInit {
  private readonly splitService = inject(SplitService);
  private readonly personService = inject(PersonService);
  private readonly dashboardService = inject(DashboardService);
  private readonly toast = inject(ToastService);
  readonly monthYear = inject(MonthYearService);

  readonly persons = signal<Person[]>([]);
  readonly items = signal<PersonSplit[]>([]);
  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly totalExpenseExpected = signal<number>(0);

  private readonly expensesRequestGuard = createLatestRequestGuard();

  // Soma total dos percentuais em tempo real — arredonda pra 2 casas decimais (mesma
  // escala dos inputs) pra não deixar ruído de ponto flutuante rejeitar uma soma que já
  // bate 100 em decimal (ex.: vários percentuais de 2 casas podem somar 99.99999999999999)
  readonly totalPercentage = computed(() => {
    const sum = this.items().reduce((acc, i) => acc + (i.percentage || 0), 0);
    return Math.round(sum * 100) / 100;
  });

  readonly totalValid = computed(() => this.totalPercentage() === 100);
  readonly totalDiff = computed(() => 100 - this.totalPercentage());

  // A regra é onipresente (não varia por mês) — só o mês atual pode ser editado
  // "a partir de agora"; visualizar um mês passado precisa deixar isso claro na tela
  readonly isViewingPastMonth = computed(() => {
    const { month, year } = this.monthYear.selected();
    const now = new Date();
    return year < now.getFullYear() ||
      (year === now.getFullYear() && month < now.getMonth() + 1);
  });

  // Valores calculados por pessoa com base no total de despesas
  readonly calculatedItems = computed(() =>
    this.items().map((i) => ({
      ...i,
      amount: (this.totalExpenseExpected() * i.percentage) / 100,
    })),
  );

  constructor() {
    // A regra não varia por mês — só o total de despesas exibido acompanha a navegação
    effect(() => {
      const { month, year } = this.monthYear.selected();
      this.loadExpenses(year, month);
    });
  }

  ngOnInit(): void {
    this.personService.getAll().subscribe({
      next: (data) => this.persons.set(data),
    });
    this.loadSplit();
  }

  loadSplit(): void {
    this.loading.set(true);
    const now = new Date();
    this.splitService.getByMonth(now.getFullYear(), now.getMonth() + 1).subscribe({
      next: (rule) => {
        // Carrega percentuais existentes
        this.items.set(
          rule.items.map((i) => ({
            person: i.person,
            percentage: i.percentage,
          })),
        );
        this.loading.set(false);
      },
      error: (err) => {
        if (err.status === 404) {
          // Sem regra — inicializa com todas as pessoas em 0%
          this.initFromPersons();
        }
        this.loading.set(false);
      },
    });
  }

  loadExpenses(year: number, month: number): void {
    const requestId = this.expensesRequestGuard.next();
    this.dashboardService.getSummary(year, month).subscribe({
      next: (s) => {
        if (!this.expensesRequestGuard.isCurrent(requestId)) return; // resposta obsoleta, ignora
        this.totalExpenseExpected.set(s.totalExpenseExpected);
      },
      error: () => {
        if (!this.expensesRequestGuard.isCurrent(requestId)) return;
        this.totalExpenseExpected.set(0);
      },
    });
  }

  private initFromPersons(): void {
    this.personService.getAll().subscribe({
      next: (persons) => {
        this.items.set(persons.map((p) => ({ person: p, percentage: 0 })));
      },
    });
  }

  updatePercentage(personId: string, value: string): void {
    const parsed = parseFloat(value) || 0;
    this.items.update((items) =>
      items.map((i) => (i.person.id === personId ? { ...i, percentage: parsed } : i)),
    );
  }

  distributeEqually(): void {
    const count = this.items().length;
    if (count === 0) return;

    const base = Math.floor(100 / count);
    const remainder = 100 - base * count;

    this.items.update((items) =>
      items.map((i, idx) => ({
        ...i,
        percentage: idx === 0 ? base + remainder : base,
      })),
    );
  }

  save(): void {
    if (!this.totalValid() || this.saving()) return;
    this.saving.set(true);

    const payload: SplitPayload = {
      // backend rejeita percentage <= 0 (regra: só quem tem participação real entra na divisão)
      items: this.items()
        .filter((i) => i.percentage > 0)
        .map((i) => ({
          personId: i.person.id,
          percentage: i.percentage,
        })),
    };

    this.splitService.save(payload).subscribe({
      next: () => {
        this.toast.success('Regra de divisão salva!');
        this.saving.set(false);
      },
      error: () => this.saving.set(false),
    });
  }
}
