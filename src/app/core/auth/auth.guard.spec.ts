import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { authGuard } from './auth.guard';
import { AuthService } from './auth.service';

describe('authGuard', () => {
  let router: Router;
  let authService: AuthService;

  const mockRoute = {} as ActivatedRouteSnapshot;
  const mockState = { url: '/dashboard' } as RouterStateSnapshot;

  beforeEach(() => {
    localStorage.clear();

    TestBed.configureTestingModule({
      providers: [
        AuthService,
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([
          { path: 'login', component: class {} as any },
          { path: 'dashboard', component: class {} as any },
        ]),
      ],
    });

    router = TestBed.inject(Router);
    authService = TestBed.inject(AuthService);
    spyOn(router, 'navigate');
  });

  afterEach(() => localStorage.clear());

  it('deve bloquear e redirecionar para /login sem token', () => {
    const result = TestBed.runInInjectionContext(() => authGuard(mockRoute, mockState));

    expect(result).toBeFalse();
    expect(router.navigate).toHaveBeenCalledWith(['/login']);
  });

  it('deve permitir acesso com token válido', () => {
    localStorage.setItem('aque_token', 'token-valido');

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        AuthService,
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([{ path: 'dashboard', component: class {} as any }]),
      ],
    });

    router = TestBed.inject(Router);
    spyOn(router, 'navigate');

    const result = TestBed.runInInjectionContext(() => authGuard(mockRoute, mockState));

    expect(result).toBeTrue();
    expect(router.navigate).not.toHaveBeenCalled();
  });
});
