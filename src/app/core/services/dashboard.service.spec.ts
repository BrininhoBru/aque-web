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
