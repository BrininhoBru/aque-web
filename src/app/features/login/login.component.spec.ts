import { TestBed, ComponentFixture } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Router, provideRouter } from '@angular/router';
import { LoginComponent } from './login.component';

describe('LoginComponent', () => {
  let component: LoginComponent;
  let fixture: ComponentFixture<LoginComponent>;
  let http: HttpTestingController;
  let router: Router;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LoginComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([{ path: 'dashboard', component: class {} as any }]),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
    http = TestBed.inject(HttpTestingController);
    router = TestBed.inject(Router);
    spyOn(router, 'navigate');
  });

  afterEach(() => http.verify());

  it('deve criar o componente', () => {
    expect(component).toBeTruthy();
  });

  it('deve navegar pro dashboard após login bem-sucedido', () => {
    component.loginForm.username().value.set('admin');
    component.loginForm.password().value.set('123456');

    component.onSubmit();

    const req = http.expectOne('/api/auth/login');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ username: 'admin', password: '123456' });
    req.flush({ token: 'header.eyJleHAiOjk5OTk5OTk5OTl9.sig', expiresIn: 3600 });

    expect(router.navigate).toHaveBeenCalledWith(['/dashboard']);
    expect(component.loading()).toBeFalse();
  });

  it('deve mostrar mensagem de erro e não navegar quando as credenciais são rejeitadas', () => {
    component.loginForm.username().value.set('admin');
    component.loginForm.password().value.set('senha-errada');

    component.onSubmit();

    http.expectOne('/api/auth/login').flush(
      { status: 401, message: 'Credenciais inválidas', timestamp: '2026-08-06T00:00:00' },
      { status: 401, statusText: 'Unauthorized' },
    );

    expect(component.errorMessage()).toBe('Usuário ou senha inválidos.');
    expect(component.loading()).toBeFalse();
    expect(router.navigate).not.toHaveBeenCalled();
  });
});
