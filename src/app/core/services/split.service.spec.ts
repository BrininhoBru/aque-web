import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { SplitService, SplitPayload } from './split.service';
import { SplitRule } from '../models';

describe('SplitService', () => {
  let service: SplitService;
  let http: HttpTestingController;

  const rule: SplitRule = {
    effectiveFrom: '2026-03-01',
    items: [{ person: { id: 'p1', name: 'Eu' }, percentage: 100 }],
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [SplitService, provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(SplitService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('deve criar o serviço', () => {
    expect(service).toBeTruthy();
  });

  describe('getByMonth()', () => {
    it('deve buscar a regra vigente no mês/ano informado', () => {
      service.getByMonth(2026, 3).subscribe((res) => expect(res).toEqual(rule));

      const req = http.expectOne('/api/split/2026/3');
      expect(req.request.method).toBe('GET');
      req.flush(rule);
    });
  });

  describe('save()', () => {
    it('deve enviar PUT sem mês/ano com o payload da divisão', () => {
      const payload: SplitPayload = { items: [{ personId: 'p1', percentage: 100 }] };

      service.save(payload).subscribe((res) => expect(res).toEqual(rule));

      const req = http.expectOne('/api/split');
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual(payload);
      req.flush(rule);
    });
  });
});
