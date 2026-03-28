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

interface PersonSplit {
  person: Person;
  percentage: number;
}

@Component({
  selector: 'app-split',
  standalone: true,
  imports: [CommonModule, RouterLink, BrlCurrencyPipe, MonthYearPipe],
  templateUrl: './split.component.html',
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

  // Soma total dos percentuais em tempo real
  readonly totalPercentage = computed(() =>
    this.items().reduce((acc, i) => acc + (i.percentage || 0), 0),
  );

  readonly totalValid = computed(() => this.totalPercentage() === 100);
  readonly totalDiff = computed(() => 100 - this.totalPercentage());

  // Valores calculados por pessoa com base no total de despesas
  readonly calculatedItems = computed(() =>
    this.items().map((i) => ({
      ...i,
      amount: (this.totalExpenseExpected() * i.percentage) / 100,
    })),
  );

  constructor() {
    // Recarrega ao mudar mês/ano global
    effect(() => {
      const { month, year } = this.monthYear.selected();
      this.loadSplit(year, month);
      this.loadExpenses(year, month);
    });
  }

  ngOnInit(): void {
    this.personService.getAll().subscribe({
      next: (data) => this.persons.set(data),
      error: () => this.toast.error('Erro ao carregar pessoas.'),
    });
  }

  loadSplit(year: number, month: number): void {
    this.loading.set(true);
    this.splitService.getByMonth(year, month).subscribe({
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
        } else {
          this.toast.error('Erro ao carregar regra de divisão.');
        }
        this.loading.set(false);
      },
    });
  }

  loadExpenses(year: number, month: number): void {
    this.dashboardService.getSummary(year, month).subscribe({
      next: (s) => this.totalExpenseExpected.set(s.totalExpenseExpected),
      error: () => this.totalExpenseExpected.set(0),
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

    const { year, month } = this.monthYear.selected();

    const payload: SplitPayload = {
      items: this.items().map((i) => ({
        personId: i.person.id,
        percentage: i.percentage,
      })),
    };

    this.splitService.save(year, month, payload).subscribe({
      next: () => {
        this.toast.success('Regra de divisão salva!');
        this.saving.set(false);
      },
      error: () => {
        this.toast.error('Erro ao salvar regra de divisão.');
        this.saving.set(false);
      },
    });
  }
}
