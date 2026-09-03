import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { TransactionService, TransactionPayload } from './transaction.service';
import { Category, Transaction } from '../models';

describe('TransactionService', () => {
  let service: TransactionService;
  let http: HttpTestingController;

  const category: Category = { id: 'c1', name: 'Moradia', type: 'DESPESA', predefined: true };
  const transaction: Transaction = {
    id: 't1',
    description: 'Aluguel',
    category,
    type: 'DESPESA',
    referenceMonth: 3,
    referenceYear: 2026,
    amountExpected: 1500,
    amountPaid: null,
    status: 'PENDENTE',
    dueDate: null,
    recurringId: null,
    isOverride: false,
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [TransactionService, provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(TransactionService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('deve criar o serviço', () => {
    expect(service).toBeTruthy();
  });

  describe('getAll()', () => {
    it('deve buscar sem parâmetros quando nenhum filtro é informado', () => {
      service.getAll().subscribe((res) => expect(res).toEqual([transaction]));

      const req = http.expectOne((r) => r.url === '/api/transactions');
      expect(req.request.params.keys().length).toBe(0);
      req.flush([transaction]);
    });

    it('deve enviar apenas os filtros informados como query params', () => {
      service.getAll({ month: 3, year: 2026, status: 'PENDENTE' }).subscribe();

      const req = http.expectOne((r) => r.url === '/api/transactions');
      expect(req.request.params.get('month')).toBe('3');
      expect(req.request.params.get('year')).toBe('2026');
      expect(req.request.params.get('status')).toBe('PENDENTE');
      expect(req.request.params.has('categoryId')).toBeFalse();
      expect(req.request.params.has('type')).toBeFalse();
      req.flush([]);
    });
  });

  describe('create()', () => {
    it('deve enviar POST com o payload do lançamento', () => {
      const payload: TransactionPayload = {
        description: 'Aluguel',
        categoryId: 'c1',
        type: 'DESPESA',
        referenceMonth: 3,
        referenceYear: 2026,
        amountExpected: 1500,
      };

      service.create(payload).subscribe((res) => expect(res).toEqual(transaction));

      const req = http.expectOne('/api/transactions');
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(payload);
      req.flush(transaction);
    });
  });

  describe('update()', () => {
    it('deve enviar PUT pro id informado com dados parciais', () => {
      service.update('t1', { amountPaid: 1500 }).subscribe();

      const req = http.expectOne('/api/transactions/t1');
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual({ amountPaid: 1500 });
      req.flush(transaction);
    });
  });

  describe('delete()', () => {
    it('deve enviar DELETE pro id informado', () => {
      service.delete('t1').subscribe();

      const req = http.expectOne('/api/transactions/t1');
      expect(req.request.method).toBe('DELETE');
      req.flush(null);
    });
  });

  describe('updatePayment()', () => {
    it('deve enviar PATCH pro endpoint de pagamento com o valor pago', () => {
      service.updatePayment('t1', 1500).subscribe();

      const req = http.expectOne('/api/transactions/t1/payment');
      expect(req.request.method).toBe('PATCH');
      expect(req.request.body).toEqual({ amountPaid: 1500 });
      req.flush(transaction);
    });

    it('deve enviar amountPaid nulo ao marcar como pendente', () => {
      service.updatePayment('t1', null).subscribe();

      const req = http.expectOne('/api/transactions/t1/payment');
      expect(req.request.body).toEqual({ amountPaid: null });
      req.flush(transaction);
    });
  });
});
