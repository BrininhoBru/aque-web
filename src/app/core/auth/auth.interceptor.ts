import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { AuthService } from './auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const token = auth.getToken();

  const authReq = token ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }) : req;

  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      // backend só usa 401 pra credencial errada no login (não autenticado ainda);
      // token ausente/inválido/expirado nas rotas protegidas vem como 403 (Spring Security)
      //
      // 401/403 vindo do próprio /auth/login não é sessão expirada — é falha de login
      // (credencial errada, ou até um 403 de infra como rejeição de CORS). Chamar
      // logout() aqui navega pra /login e recria o LoginComponent antes de ele
      // conseguir mostrar a mensagem de erro pro usuário.
      const isLoginRequest = req.url.includes('/auth/login');
      if (!isLoginRequest && (error.status === 401 || error.status === 403)) {
        auth.logout();
      }
      return throwError(() => error);
    }),
  );
};
