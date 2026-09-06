import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { AssetService } from './asset.service';
import { Asset, AssetImportResult, NetWorthSummary } from '../models';

describe('AssetService', () => {
  let service: AssetService;
  let http: HttpTestingController;

  const asset: Asset = {
    id: '1',
    name: 'VALE3',
    type: 'ACAO',
    currentValue: 314.48,
    person: null,
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [AssetService, provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(AssetService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('deve criar o serviço', () => {
    expect(service).toBeTruthy();
  });

  describe('getAll()', () => {
    it('deve buscar todos os ativos sem filtro', () => {
      service.getAll().subscribe((res) => expect(res).toEqual([asset]));

      const req = http.expectOne('/api/assets');
      expect(req.request.method).toBe('GET');
      expect(req.request.params.has('personId')).toBeFalse();
      req.flush([asset]);
    });

    it('deve filtrar por personId quando informado', () => {
      service.getAll('p1').subscribe();

      const req = http.expectOne((r) => r.url === '/api/assets');
      expect(req.request.params.get('personId')).toBe('p1');
      req.flush([asset]);
    });
  });

  describe('getNetWorth()', () => {
    it('deve buscar o patrimônio total', () => {
      const summary: NetWorthSummary = { totalValue: 314.48 };
      service.getNetWorth().subscribe((res) => expect(res).toEqual(summary));

      const req = http.expectOne('/api/assets/net-worth');
      expect(req.request.method).toBe('GET');
      req.flush(summary);
    });
  });

  describe('create()', () => {
    it('deve enviar POST com os dados do ativo', () => {
      const payload = { name: 'VALE3', type: 'ACAO' as const, currentValue: 314.48, personId: null };
      service.create(payload).subscribe((res) => expect(res).toEqual(asset));

      const req = http.expectOne('/api/assets');
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(payload);
      req.flush(asset);
    });
  });

  describe('update()', () => {
    it('deve enviar PUT pro id informado', () => {
      const payload = { name: 'VALE3 Atualizado', type: 'ACAO' as const, currentValue: 400, personId: null };
      service.update('1', payload).subscribe();

      const req = http.expectOne('/api/assets/1');
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual(payload);
      req.flush(asset);
    });
  });

  describe('delete()', () => {
    it('deve enviar DELETE pro id informado', () => {
      service.delete('1').subscribe();

      const req = http.expectOne('/api/assets/1');
      expect(req.request.method).toBe('DELETE');
      req.flush(null);
    });
  });

  describe('importXlsx()', () => {
    it('deve enviar o arquivo como multipart/form-data', () => {
      const file = new File(['conteudo'], 'posicao.xlsx');
      const result: AssetImportResult = { created: [asset], updated: [], errors: [] };

      service.importXlsx(file).subscribe((res) => expect(res).toEqual(result));

      const req = http.expectOne('/api/assets/import');
      expect(req.request.method).toBe('POST');
      expect(req.request.body instanceof FormData).toBeTrue();
      expect((req.request.body as FormData).get('file')).toBe(file);
      req.flush(result);
    });
  });
});
