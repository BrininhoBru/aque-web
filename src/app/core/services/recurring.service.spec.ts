import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { RecurringService, RecurringPayload } from './recurring.service';
import { Category, RecurringTransaction } from '../models';

describe('RecurringService', () => {
  let service: RecurringService;
  let http: HttpTestingController;

  const category: Category = { id: 'c1', name: 'Moradia', type: 'DESPESA', predefined: true };
  const recurring: RecurringTransaction = {
    id: 'r1',
    description: 'Aluguel',
    category,
    type: 'DESPESA',
    defaultAmount: 1500,
    active: true,
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [RecurringService, provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(RecurringService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('deve criar o serviço', () => {
    expect(service).toBeTruthy();
  });

  describe('getAll()', () => {
    it('deve buscar sem filtro de status quando active não é informado', () => {
      service.getAll().subscribe((res) => expect(res).toEqual([recurring]));

      const req = http.expectOne((r) => r.url === '/api/recurring');
      expect(req.request.params.has('active')).toBeFalse();
      req.flush([recurring]);
    });

    it('deve filtrar por active quando informado', () => {
      service.getAll(true).subscribe();

      const req = http.expectOne((r) => r.url === '/api/recurring');
      expect(req.request.params.get('active')).toBe('true');
      req.flush([recurring]);
    });
  });

  describe('create()', () => {
    it('deve enviar POST com o payload', () => {
      const payload: RecurringPayload = {
        description: 'Aluguel',
        categoryId: 'c1',
        type: 'DESPESA',
        defaultAmount: 1500,
      };

      service.create(payload).subscribe((res) => expect(res).toEqual(recurring));

      const req = http.expectOne('/api/recurring');
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(payload);
      req.flush(recurring);
    });
  });

  describe('update()', () => {
    it('deve enviar PUT pro id informado', () => {
      service.update('r1', { defaultAmount: 1600 }).subscribe();

      const req = http.expectOne('/api/recurring/r1');
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual({ defaultAmount: 1600 });
      req.flush(recurring);
    });
  });

  describe('deactivate()', () => {
    it('deve enviar DELETE pro id informado', () => {
      service.deactivate('r1').subscribe();

      const req = http.expectOne('/api/recurring/r1');
      expect(req.request.method).toBe('DELETE');
      req.flush(recurring);
    });
  });

  describe('generate()', () => {
    it('deve enviar POST pro endpoint de geração com responseType text', () => {
      service.generate(2026, 3).subscribe((res) => expect(res).toBe('2 instâncias geradas'));

      const req = http.expectOne('/api/recurring/generate/2026/3');
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toBeNull();
      req.flush('2 instâncias geradas');
    });
  });
});
