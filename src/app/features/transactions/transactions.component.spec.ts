import { TestBed, ComponentFixture } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { TransactionsComponent } from './transactions.component';
import { Transaction, Category } from '../../core/models';

const despesaCategory: Category = { id: 'c1', name: 'Casa', type: 'DESPESA', predefined: false };
const receitaCategory: Category = { id: 'c2', name: 'Salário', type: 'RECEITA', predefined: false };

function tx(overrides: Partial<Transaction>): Transaction {
  return {
    id: '1',
    description: 'X',
    category: despesaCategory,
    type: 'DESPESA',
    referenceMonth: 3,
    referenceYear: 2026,
    amountExpected: 100,
    amountPaid: null,
    status: 'PENDENTE',
    dueDate: null,
    recurringId: null,
    isOverride: false,
    ...overrides,
  };
}

describe('TransactionsComponent', () => {
  let component: TransactionsComponent;
  let fixture: ComponentFixture<TransactionsComponent>;
  let httpMock: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TransactionsComponent],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(TransactionsComponent);
    component = fixture.componentInstance;
    httpMock = TestBed.inject(HttpTestingController);
  });

  it('deve criar o componente', () => {
    expect(component).toBeTruthy();
  });

  describe('load() — race condition entre trocas rápidas de mês', () => {
    it('mantém o resultado da carga mais recente, mesmo se a resposta antiga chegar depois', () => {
      fixture.detectChanges(); // dispara o effect() do construtor (carga inicial)
      const { month, year } = component.monthYear.selected();

      const req1 = httpMock.expectOne(
        (r) => r.params.get('month') === String(month) && r.params.get('year') === String(year),
      );

      const nextMonth = month === 12 ? 1 : month + 1;
      const nextYear = month === 12 ? year + 1 : year;
      component.load(nextMonth, nextYear);

      const req2 = httpMock.expectOne(
        (r) =>
          r.params.get('month') === String(nextMonth) && r.params.get('year') === String(nextYear),
      );

      // resposta da 2ª (mais nova) chega primeiro, depois a da 1ª (obsoleta)
      req2.flush([tx({ id: 'novo' })]);
      req1.flush([tx({ id: 'antigo' })]);

      expect(component.transactions().map((t) => t.id)).toEqual(['novo']);
    });
  });

  describe('filtered()', () => {
    beforeEach(() => {
      component.transactions.set([
        tx({ id: '1', type: 'DESPESA', status: 'PENDENTE', category: despesaCategory }),
        tx({ id: '2', type: 'RECEITA', status: 'PAGO', category: receitaCategory }),
      ]);
    });

    it('sem filtros retorna tudo', () => {
      expect(component.filtered().length).toBe(2);
    });

    it('filtra por tipo', () => {
      component.setFilterType('RECEITA');
      expect(component.filtered().map((t) => t.id)).toEqual(['2']);
    });

    it('filtra por status', () => {
      component.setFilterStatus('PAGO');
      expect(component.filtered().map((t) => t.id)).toEqual(['2']);
    });

    it('filtra por categoria', () => {
      component.setFilterCategory('c1');
      expect(component.filtered().map((t) => t.id)).toEqual(['1']);
    });

    it('combina filtros (E lógico, não OU)', () => {
      component.setFilterType('DESPESA');
      component.setFilterStatus('PAGO');
      expect(component.filtered().length).toBe(0);
    });

    it('clearFilters() reseta todos os filtros', () => {
      component.setFilterType('RECEITA');
      component.setFilterStatus('PAGO');
      component.setFilterCategory('c2');
      component.clearFilters();
      expect(component.filtered().length).toBe(2);
    });
  });

  describe('totais', () => {
    beforeEach(() => {
      component.transactions.set([
        tx({ id: '1', type: 'DESPESA', amountExpected: 500, amountPaid: 480, status: 'PAGO' }),
        tx({ id: '2', type: 'DESPESA', amountExpected: 200, amountPaid: null, status: 'PENDENTE' }),
        tx({
          id: '3',
          type: 'RECEITA',
          amountExpected: 3000,
          amountPaid: 3000,
          status: 'PAGO',
          category: receitaCategory,
        }),
      ]);
    });

    it('totalExpected soma só o previsto das despesas', () => {
      expect(component.totalExpected()).toBe(700);
    });

    it('totalPaid soma só as despesas pagas (ignora pendentes com amountPaid null)', () => {
      expect(component.totalPaid()).toBe(480);
    });

    it('totalIncomeExpected soma só o previsto das receitas', () => {
      expect(component.totalIncomeExpected()).toBe(3000);
    });

    it('totalIncomePaid soma só receitas pagas', () => {
      expect(component.totalIncomePaid()).toBe(3000);
    });
  });
});
