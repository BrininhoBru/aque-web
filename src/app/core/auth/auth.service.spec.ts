import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { AuthService } from './auth.service';

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

    it('deve retornar true quando há token no localStorage', () => {
      localStorage.setItem('aque_token', 'token-valido');
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
  });

  describe('login()', () => {
    it('deve salvar token no localStorage após login bem-sucedido', () => {
      service.login('admin', '123456').subscribe();

      const req = http.expectOne('/api/auth/login');
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ username: 'admin', password: '123456' });

      req.flush({ token: 'jwt-token-mock', expiresIn: 3600 });

      expect(localStorage.getItem('aque_token')).toBe('jwt-token-mock');
      expect(service.isAuthenticated()).toBeTrue();
      expect(service.getToken()).toBe('jwt-token-mock');
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
