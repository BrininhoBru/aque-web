import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { DashboardService } from './dashboard.service';
import { DashboardSummary } from '../models';

describe('DashboardService', () => {
  let service: DashboardService;
  let http: HttpTestingController;

  const summary: DashboardSummary = {
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
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [DashboardService, provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(DashboardService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('deve criar o serviço', () => {
    expect(service).toBeTruthy();
  });

  describe('getSummary()', () => {
    it('deve buscar o resumo do mês/ano informado', () => {
      service.getSummary(2026, 3).subscribe((res) => expect(res).toEqual(summary));

      const req = http.expectOne('/api/dashboard/summary/2026/3');
      expect(req.request.method).toBe('GET');
      req.flush(summary);
    });

    // achado do /code-review na PR #43: SidebarComponent e DashboardComponent chamam
    // getSummary independentemente pro mesmo year/month na rota /dashboard, dobrando
    // a carga nesse endpoint a cada troca de mês.
    it('deduplica chamadas concorrentes pro mesmo year/month — só 1 requisição HTTP', () => {
      let first: DashboardSummary | undefined;
      let second: DashboardSummary | undefined;
      service.getSummary(2026, 3).subscribe((res) => (first = res));
      service.getSummary(2026, 3).subscribe((res) => (second = res));

      const req = http.expectOne('/api/dashboard/summary/2026/3');
      req.flush(summary);

      expect(first).toEqual(summary);
      expect(second).toEqual(summary);
    });

    it('não reusa o cache pra year/month diferentes — 2 requisições HTTP', () => {
      service.getSummary(2026, 3).subscribe();
      service.getSummary(2026, 4).subscribe();

      const req1 = http.expectOne('/api/dashboard/summary/2026/3');
      const req2 = http.expectOne('/api/dashboard/summary/2026/4');
      expect(req1).not.toBe(req2);
      req1.flush(summary);
      req2.flush(summary);
    });

    it('uma nova chamada após a anterior completar dispara uma nova requisição (sem cache permanente)', () => {
      service.getSummary(2026, 3).subscribe();
      http.expectOne('/api/dashboard/summary/2026/3').flush(summary);

      let result: DashboardSummary | undefined;
      service.getSummary(2026, 3).subscribe((res) => (result = res));
      http.expectOne('/api/dashboard/summary/2026/3').flush(summary);

      expect(result).toEqual(summary);
    });
  });

  describe('getByCategory()', () => {
    it('deve buscar sem filtro de tipo quando não informado', () => {
      service.getByCategory(2026, 3).subscribe();

      const req = http.expectOne((r) => r.url === '/api/dashboard/by-category/2026/3');
      expect(req.request.params.has('type')).toBeFalse();
      req.flush([]);
    });

    it('deve filtrar por tipo quando informado', () => {
      service.getByCategory(2026, 3, 'DESPESA').subscribe();

      const req = http.expectOne((r) => r.url === '/api/dashboard/by-category/2026/3');
      expect(req.request.params.get('type')).toBe('DESPESA');
      req.flush([]);
    });
  });

  describe('getEvolution()', () => {
    it('deve buscar a evolução do ano informado', () => {
      service.getEvolution(2026).subscribe();

      const req = http.expectOne('/api/dashboard/evolution/2026');
      expect(req.request.method).toBe('GET');
      req.flush([]);
    });
  });

  describe('getSplit()', () => {
    it('deve buscar o split do mês/ano informado', () => {
      service.getSplit(2026, 3).subscribe();

      const req = http.expectOne('/api/dashboard/split/2026/3');
      expect(req.request.method).toBe('GET');
      req.flush({ totalExpenseExpected: 0, items: [] });
    });
  });
});
