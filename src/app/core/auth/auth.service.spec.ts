import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { AuthService } from './auth.service';

// Monta um JWT falso só com o payload que isAuthenticated() realmente lê (exp em segundos)
function fakeJwt(expSeconds: number): string {
  const payload = btoa(JSON.stringify({ exp: Math.floor(expSeconds) }));
  return `header.${payload}.signature`;
}

describe('AuthService', () => {
  let service: AuthService;
  let http: HttpTestingController;

  beforeEach(() => {
    localStorage.clear();

    TestBed.configureTestingModule({
      providers: [AuthService, provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    });

    service = TestBed.inject(AuthService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    http.verify();
    localStorage.clear();
  });

  it('deve criar o serviço', () => {
    expect(service).toBeTruthy();
  });

  describe('isAuthenticated()', () => {
    it('deve retornar false quando não há token', () => {
      expect(service.isAuthenticated()).toBeFalse();
    });

    it('deve retornar true quando há token válido e não expirado no localStorage', () => {
      localStorage.setItem('aque_token', fakeJwt(Date.now() / 1000 + 3600));
      // Recria o serviço para pegar o token do localStorage
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        providers: [
          AuthService,
          provideHttpClient(),
          provideHttpClientTesting(),
          provideRouter([]),
        ],
      });
      const svc = TestBed.inject(AuthService);
      expect(svc.isAuthenticated()).toBeTrue();
    });

    it('deve retornar false quando o token está expirado', () => {
      localStorage.setItem('aque_token', fakeJwt(Date.now() / 1000 - 3600));
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        providers: [
          AuthService,
          provideHttpClient(),
          provideHttpClientTesting(),
          provideRouter([]),
        ],
      });
      const svc = TestBed.inject(AuthService);
      expect(svc.isAuthenticated()).toBeFalse();
    });

    it('deve retornar false quando o token não é um JWT válido', () => {
      localStorage.setItem('aque_token', 'token-nao-jwt');
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        providers: [
          AuthService,
          provideHttpClient(),
          provideHttpClientTesting(),
          provideRouter([]),
        ],
      });
      const svc = TestBed.inject(AuthService);
      expect(svc.isAuthenticated()).toBeFalse();
    });
  });

  describe('login()', () => {
    it('deve salvar token no localStorage após login bem-sucedido', () => {
      service.login('admin', '123456').subscribe();

      const req = http.expectOne('/api/auth/login');
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ username: 'admin', password: '123456' });

      const mockToken = fakeJwt(Date.now() / 1000 + 3600);
      req.flush({ token: mockToken, expiresIn: 3600 });

      expect(localStorage.getItem('aque_token')).toBe(mockToken);
      expect(service.isAuthenticated()).toBeTrue();
      expect(service.getToken()).toBe(mockToken);
    });

    it('deve emitir erro quando credenciais inválidas', () => {
      let erro = false;
      service.login('admin', 'errado').subscribe({ error: () => (erro = true) });

      http
        .expectOne('/api/auth/login')
        .flush({ message: 'Unauthorized' }, { status: 401, statusText: 'Unauthorized' });

      expect(erro).toBeTrue();
      expect(localStorage.getItem('aque_token')).toBeNull();
    });
  });

  describe('logout()', () => {
    it('deve remover token e definir isAuthenticated como false', () => {
      localStorage.setItem('aque_token', 'token-valido');

      service.login('admin', '123').subscribe();
      http.expectOne('/api/auth/login').flush({ token: 'token-valido', expiresIn: 3600 });

      service.logout();

      expect(localStorage.getItem('aque_token')).toBeNull();
      expect(service.isAuthenticated()).toBeFalse();
      expect(service.getToken()).toBeNull();
    });
  });
});
