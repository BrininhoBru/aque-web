import { TestBed } from '@angular/core/testing';
import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { authInterceptor } from './auth.interceptor';
import { AuthService } from './auth.service';

describe('authInterceptor', () => {
  let http: HttpClient;
  let httpMock: HttpTestingController;
  let authService: AuthService;

  beforeEach(() => {
    localStorage.clear();

    TestBed.configureTestingModule({
      providers: [
        AuthService,
        provideRouter([]),
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
      ],
    });

    http = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
    authService = TestBed.inject(AuthService);
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  it('deve injetar Bearer token quando autenticado', () => {
    localStorage.setItem('aque_token', 'meu-jwt');

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        AuthService,
        provideRouter([]),
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
      ],
    });
    http = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);

    http.get('/api/categories').subscribe();

    const req = httpMock.expectOne('/api/categories');
    expect(req.request.headers.get('Authorization')).toBe('Bearer meu-jwt');
    req.flush([]);
  });

  it('não deve injetar Authorization quando não autenticado', () => {
    http.get('/api/categories').subscribe();

    const req = httpMock.expectOne('/api/categories');
    expect(req.request.headers.has('Authorization')).toBeFalse();
    req.flush([]);
  });

  it('deve chamar logout e redirecionar ao receber 401', () => {
    localStorage.setItem('aque_token', 'token-expirado');

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        AuthService,
        provideRouter([{ path: 'login', component: class {} as any }]),
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
      ],
    });
    http = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
    authService = TestBed.inject(AuthService);

    spyOn(authService, 'logout');
    http.get('/api/transactions').subscribe({ error: () => {} });

    httpMock
      .expectOne('/api/transactions')
      .flush({ message: 'Unauthorized' }, { status: 401, statusText: 'Unauthorized' });

    expect(authService.logout).toHaveBeenCalled();
  });
});
