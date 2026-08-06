import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { ToastService } from '../../shared/services/toast.service';

const FALLBACK_MESSAGE = 'Ocorreu um erro inesperado. Tente novamente.';

// Backend manda dois formatos de erro (ver GlobalExceptionHandler):
// { status, message, timestamp } pra BusinessException/BadCredentials/etc,
// ou um Map<campo, mensagem> pro MethodArgumentNotValidException.
function extractMessage(error: HttpErrorResponse): string {
  const body = error.error;

  if (body && typeof body.message === 'string') {
    return body.message;
  }

  if (body && typeof body === 'object') {
    const fieldErrors = Object.values(body).filter((v): v is string => typeof v === 'string');
    if (fieldErrors.length > 0) {
      return fieldErrors.join('; ');
    }
  }

  return FALLBACK_MESSAGE;
}

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const toast = inject(ToastService);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      // 401/403 já são tratados pelo authInterceptor (logout + redirect); a tela
      // de login também já mostra sua própria mensagem — evita toast duplicado
      if (error.status !== 401 && error.status !== 403) {
        toast.error(extractMessage(error));
      }

      if (error.status === 0 || error.status >= 500) {
        console.error(`Erro inesperado (${error.status || 'network'}) em ${req.method} ${req.url}`, error);
      }

      return throwError(() => error);
    }),
  );
};
