import { TestBed, ComponentFixture } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { DashboardComponent } from './dashboard.component';
import { DashboardSummary } from '../../core/models';

function summary(overrides: Partial<DashboardSummary>): DashboardSummary {
  return {
    totalIncomeExpected: 100,
    totalIncomePaid: 100,
    totalExpenseExpected: 50,
    totalExpensePaid: 50,
    balanceExpected: 50,
    balancePaid: 50,
    totalIncomePending: 0,
    totalExpensePending: 0,
    totalOverdueAmount: 0,
    totalOverdueCount: 0,
    ...overrides,
  };
}

describe('DashboardComponent', () => {
  let component: DashboardComponent;
  let fixture: ComponentFixture<DashboardComponent>;
  let httpMock: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DashboardComponent],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(DashboardComponent);
    component = fixture.componentInstance;
    httpMock = TestBed.inject(HttpTestingController);
    // dispara a change detection pra rodar o effect() do construtor (que faz o load() inicial)
    fixture.detectChanges();
  });

  it('deve criar o componente', () => {
    expect(component).toBeTruthy();
  });

  describe('balanceExpectedPositive() / balancePaidPositive()', () => {
    it('é true quando ainda não carregou nada (default 0)', () => {
      expect(component.balanceExpectedPositive()).toBeTrue();
      expect(component.balancePaidPositive()).toBeTrue();
    });

    it('é true quando o saldo é positivo ou zero', () => {
      component.summary.set(summary({ balanceExpected: 50, balancePaid: 0 }));
      expect(component.balanceExpectedPositive()).toBeTrue();
      expect(component.balancePaidPositive()).toBeTrue();
    });

    it('é false quando o saldo é negativo', () => {
      component.summary.set(summary({ balanceExpected: -100, balancePaid: -50 }));
      expect(component.balanceExpectedPositive()).toBeFalse();
      expect(component.balancePaidPositive()).toBeFalse();
    });
  });

  describe('load() — mês sem regra de divisão configurada', () => {
    it('mantém summary/byCategory/evolution e marca splitError quando split retorna 404, sem duplicar nenhuma request', () => {
      const { month, year } = component.monthYear.selected();
      const base = '/api/dashboard';

      // forkJoin dos 4 endpoints, disparada pelo effect() do construtor — split falhando
      // (404) não pode mais derrubar o forkJoin inteiro nem disparar uma 2ª rodada
      httpMock.expectOne(`${base}/summary/${year}/${month}`).flush(summary({}));
      httpMock.expectOne(`${base}/by-category/${year}/${month}`).flush([]);
      httpMock.expectOne(`${base}/evolution/${year}`).flush([]);
      httpMock
        .expectOne(`${base}/split/${year}/${month}`)
        .flush({ message: 'not found' }, { status: 404, statusText: 'Not Found' });

      expect(component.split()).toBeNull();
      expect(component.splitError()).toBeTrue();
      expect(component.summary()).not.toBeNull();
      expect(component.loading()).toBeFalse();
      httpMock.verify();
    });
  });

  describe('load() — race condition entre trocas rápidas de mês', () => {
    it('mantém o resultado da carga mais recente, mesmo se a resposta antiga chegar depois', () => {
      const { month, year } = component.monthYear.selected();
      const base = '/api/dashboard';

      // 1ª rodada (carga inicial do effect do construtor)
      const req1 = httpMock.expectOne(`${base}/summary/${year}/${month}`);
      httpMock.expectOne(`${base}/by-category/${year}/${month}`).flush([]);
      httpMock.expectOne(`${base}/evolution/${year}`).flush([]);
      httpMock
        .expectOne(`${base}/split/${year}/${month}`)
        .flush({ message: 'not found' }, { status: 404, statusText: 'Not Found' });

      // usuário navega rápido pro mês seguinte antes da 1ª rodada responder
      const nextMonth = month === 12 ? 1 : month + 1;
      const nextYear = month === 12 ? year + 1 : year;
      component.load(nextYear, nextMonth);

      const req2 = httpMock.expectOne(`${base}/summary/${nextYear}/${nextMonth}`);
      httpMock.expectOne(`${base}/by-category/${nextYear}/${nextMonth}`).flush([]);
      httpMock.expectOne(`${base}/evolution/${nextYear}`).flush([]);
      httpMock
        .expectOne(`${base}/split/${nextYear}/${nextMonth}`)
        .flush({ message: 'not found' }, { status: 404, statusText: 'Not Found' });

      // resposta da 2ª (mais nova) chega primeiro, depois a da 1ª (obsoleta)
      req2.flush(summary({ totalIncomeExpected: 999 }));
      req1.flush(summary({ totalIncomeExpected: 1 }));

      expect(component.summary()?.totalIncomeExpected).toBe(999);
    });
  });
});
