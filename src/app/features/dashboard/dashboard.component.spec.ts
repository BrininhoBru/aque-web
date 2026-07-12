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
    it('mantém summary/byCategory/evolution e marca splitError quando split retorna 404', () => {
      const { month, year } = component.monthYear.selected();
      const base = '/api/dashboard';

      // 1ª rodada: forkJoin dos 4 endpoints, disparada pelo effect() do construtor
      httpMock.expectOne(`${base}/summary/${year}/${month}`).flush(summary({}));
      httpMock.expectOne(`${base}/by-category/${year}/${month}`).flush([]);
      httpMock.expectOne(`${base}/evolution/${year}`).flush([]);
      httpMock
        .expectOne(`${base}/split/${year}/${month}`)
        .flush({ message: 'not found' }, { status: 404, statusText: 'Not Found' });

      // 2ª rodada: loadPartial() repete os 3 primeiros e busca o split à parte
      // (é exatamente a duplicidade de requisições reportada no levantamento)
      httpMock.expectOne(`${base}/summary/${year}/${month}`).flush(summary({}));
      httpMock.expectOne(`${base}/by-category/${year}/${month}`).flush([]);
      httpMock.expectOne(`${base}/evolution/${year}`).flush([]);
      httpMock
        .expectOne(`${base}/split/${year}/${month}`)
        .flush({ message: 'not found' }, { status: 404, statusText: 'Not Found' });

      expect(component.split()).toBeNull();
      expect(component.splitError()).toBeTrue();
      expect(component.summary()).not.toBeNull();
    });
  });
});
