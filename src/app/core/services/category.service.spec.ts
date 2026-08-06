import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { CategoryService } from './category.service';
import { Category } from '../models';

describe('CategoryService', () => {
  let service: CategoryService;
  let http: HttpTestingController;

  const category: Category = { id: '1', name: 'Moradia', type: 'DESPESA', predefined: true };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [CategoryService, provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(CategoryService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('deve criar o serviço', () => {
    expect(service).toBeTruthy();
  });

  describe('getAll()', () => {
    it('deve buscar todas as categorias sem filtro', () => {
      service.getAll().subscribe((res) => expect(res).toEqual([category]));

      const req = http.expectOne('/api/categories');
      expect(req.request.method).toBe('GET');
      expect(req.request.params.has('type')).toBeFalse();
      req.flush([category]);
    });

    it('deve filtrar por tipo quando informado', () => {
      service.getAll('DESPESA').subscribe();

      const req = http.expectOne((r) => r.url === '/api/categories');
      expect(req.request.params.get('type')).toBe('DESPESA');
      req.flush([category]);
    });
  });

  describe('create()', () => {
    it('deve enviar POST com os dados da categoria', () => {
      service.create({ name: 'Viagem', type: 'DESPESA' }).subscribe((res) => expect(res).toEqual(category));

      const req = http.expectOne('/api/categories');
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ name: 'Viagem', type: 'DESPESA' });
      req.flush(category);
    });
  });

  describe('update()', () => {
    it('deve enviar PUT pro id informado', () => {
      service.update('1', { name: 'Moradia Editada' }).subscribe();

      const req = http.expectOne('/api/categories/1');
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual({ name: 'Moradia Editada' });
      req.flush(category);
    });
  });

  describe('delete()', () => {
    it('deve enviar DELETE pro id informado', () => {
      service.delete('1').subscribe();

      const req = http.expectOne('/api/categories/1');
      expect(req.request.method).toBe('DELETE');
      req.flush(null);
    });
  });
});
