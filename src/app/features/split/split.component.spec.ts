import { TestBed, ComponentFixture } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { SplitComponent } from './split.component';
import { MonthYearService } from '../../core/services/month-year.service';

describe('SplitComponent', () => {
  let component: SplitComponent;
  let fixture: ComponentFixture<SplitComponent>;
  let httpMock: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SplitComponent],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(SplitComponent);
    component = fixture.componentInstance;
    httpMock = TestBed.inject(HttpTestingController);
  });

  it('deve criar o componente', () => {
    expect(component).toBeTruthy();
  });

  describe('totalPercentage()', () => {
    it('deve somar corretamente os percentuais', () => {
      component['items'].set([
        { person: { id: '1', name: 'Eu' }, percentage: 60 },
        { person: { id: '2', name: 'Esposa' }, percentage: 40 },
      ]);
      expect(component.totalPercentage()).toBe(100);
    });

    it('deve retornar 0 quando não há itens', () => {
      component['items'].set([]);
      expect(component.totalPercentage()).toBe(0);
    });

    it('deve considerar válida uma soma que bate 100 em decimal mas sofre ruído de ponto flutuante', () => {
      component['items'].set([
        { person: { id: '1', name: 'A' }, percentage: 5.95 },
        { person: { id: '2', name: 'B' }, percentage: 7.41 },
        { person: { id: '3', name: 'C' }, percentage: 8.04 },
        { person: { id: '4', name: 'D' }, percentage: 5.82 },
        { person: { id: '5', name: 'E' }, percentage: 4.79 },
        { person: { id: '6', name: 'F' }, percentage: 8.96 },
        { person: { id: '7', name: 'G' }, percentage: 4.25 },
        { person: { id: '8', name: 'H' }, percentage: 10.9 },
        { person: { id: '9', name: 'I' }, percentage: 6.29 },
        { person: { id: '10', name: 'J' }, percentage: 11.79 },
        { person: { id: '11', name: 'K' }, percentage: 7.32 },
        { person: { id: '12', name: 'L' }, percentage: 18.48 },
      ]);
      expect(component.totalPercentage()).toBe(100);
      expect(component.totalValid()).toBeTrue();
    });
  });

  describe('totalValid()', () => {
    it('deve ser true quando soma é 100%', () => {
      component['items'].set([
        { person: { id: '1', name: 'Eu' }, percentage: 70 },
        { person: { id: '2', name: 'Esposa' }, percentage: 30 },
      ]);
      expect(component.totalValid()).toBeTrue();
    });

    it('deve ser false quando soma é diferente de 100%', () => {
      component['items'].set([
        { person: { id: '1', name: 'Eu' }, percentage: 60 },
        { person: { id: '2', name: 'Esposa' }, percentage: 30 },
      ]);
      expect(component.totalValid()).toBeFalse();
    });
  });

  describe('distributeEqually()', () => {
    it('deve distribuir 100% igualmente entre 2 pessoas', () => {
      component['items'].set([
        { person: { id: '1', name: 'Eu' }, percentage: 0 },
        { person: { id: '2', name: 'Esposa' }, percentage: 0 },
      ]);
      component.distributeEqually();
      const total = component.items().reduce((a, i) => a + i.percentage, 0);
      expect(total).toBe(100);
    });

    it('deve distribuir 100% igualmente entre 3 pessoas com resto na primeira', () => {
      component['items'].set([
        { person: { id: '1', name: 'A' }, percentage: 0 },
        { person: { id: '2', name: 'B' }, percentage: 0 },
        { person: { id: '3', name: 'C' }, percentage: 0 },
      ]);
      component.distributeEqually();
      const percentages = component.items().map((i) => i.percentage);
      const total = percentages.reduce((a, b) => a + b, 0);
      expect(total).toBe(100);
      // Primeiro recebe o resto (34, 33, 33)
      expect(percentages[0]).toBe(34);
      expect(percentages[1]).toBe(33);
      expect(percentages[2]).toBe(33);
    });
  });

  describe('updatePercentage()', () => {
    it('deve atualizar o percentual de uma pessoa específica', () => {
      component['items'].set([
        { person: { id: '1', name: 'Eu' }, percentage: 50 },
        { person: { id: '2', name: 'Esposa' }, percentage: 50 },
      ]);
      component.updatePercentage('1', '70');
      expect(component.items()[0].percentage).toBe(70);
      expect(component.items()[1].percentage).toBe(50);
    });
  });

  describe('save()', () => {
    it('não deve enviar pessoas com percentual 0 (backend rejeita percentage <= 0)', () => {
      component['items'].set([
        { person: { id: '1', name: 'Eu' }, percentage: 100 },
        { person: { id: '2', name: 'Esposa' }, percentage: 0 },
      ]);

      component.save();

      const req = httpMock.expectOne('/api/split');
      expect(req.request.method).toBe('PUT');
      expect(req.request.body.items).toEqual([{ personId: '1', percentage: 100 }]);
      req.flush({ effectiveFrom: '2026-01-01', items: [] });
    });

    it('não deve salvar quando a soma dos percentuais não é 100%', () => {
      component['items'].set([{ person: { id: '1', name: 'Eu' }, percentage: 50 }]);

      component.save();

      expect(component.saving()).toBeFalse();
      httpMock.expectNone((r) => r.method === 'PUT');
    });
  });

  describe('reload ao trocar mês/ano', () => {
    function flushInitialLoad(): void {
      fixture.detectChanges();
      httpMock.expectOne('/api/persons').flush([]);
      httpMock.expectOne((r) => r.url.startsWith('/api/split/')).flush({
        effectiveFrom: '2026-01-01',
        items: [],
      });
      httpMock.expectOne((r) => r.url.startsWith('/api/dashboard/summary/')).flush({
        totalIncomeExpected: 0,
        totalIncomePaid: 0,
        totalExpenseExpected: 0,
        totalExpensePaid: 0,
        balanceExpected: 0,
        balancePaid: 0,
        totalIncomePending: 0,
        totalExpensePending: 0,
        totalOverdueAmount: 0,
        totalOverdueCount: 0,
      });
    }

    it('deve buscar a regra de split apenas uma vez, mesmo trocando o mês selecionado', () => {
      flushInitialLoad();

      TestBed.inject(MonthYearService).nextMonth();
      fixture.detectChanges();

      // só o total de despesas acompanha a troca de mês
      httpMock.expectOne((r) => r.url.startsWith('/api/dashboard/summary/')).flush({
        totalIncomeExpected: 0,
        totalIncomePaid: 0,
        totalExpenseExpected: 0,
        totalExpensePaid: 0,
        balanceExpected: 0,
        balancePaid: 0,
        totalIncomePending: 0,
        totalExpensePending: 0,
        totalOverdueAmount: 0,
        totalOverdueCount: 0,
      });
      const noSplitRequest = httpMock.match((r) => r.url.startsWith('/api/split/'));
      expect(noSplitRequest.length).toBe(0);
    });
  });

  describe('isViewingPastMonth()', () => {
    it('deve ser true quando o mês/ano selecionado já passou', () => {
      TestBed.inject(MonthYearService).setMonthYear(1, 2000);
      expect(component.isViewingPastMonth()).toBeTrue();
    });

    it('deve ser false quando o mês/ano selecionado é o atual', () => {
      const now = new Date();
      TestBed.inject(MonthYearService).setMonthYear(now.getMonth() + 1, now.getFullYear());
      expect(component.isViewingPastMonth()).toBeFalse();
    });

    it('deve ser false quando o mês/ano selecionado é futuro', () => {
      TestBed.inject(MonthYearService).setMonthYear(1, 2999);
      expect(component.isViewingPastMonth()).toBeFalse();
    });
  });
});
