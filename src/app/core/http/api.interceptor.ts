import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError, timeout, TimeoutError } from 'rxjs';
import { SessionService } from '../auth/session.service';
import { toApiError } from './api-error';

// property-docs, 05-architecture/deployment.md: the API Gateway is the only entry point.
const GATEWAY_URL = 'http://localhost:8080';
const TIMEOUT_MS = 10_000;
const LOGIN_PATH = '/api/v1/login';
const REFRESH_PATH = '/api/v1/refresh';

/**
 * Every request to '/api/...' goes through here, whichever portal made it:
 * the gateway URL, the token, a fresh X-Correlation-Id, a timeout, and one
 * shape for every error. Portals never set any of these themselves.
 */
export const apiInterceptor: HttpInterceptorFn = (req, next) => {
  if (!req.url.startsWith('/api/')) return next(req);
  const session = inject(SessionService);
  const router = inject(Router);
  const correlationId = crypto.randomUUID();
  const token = session.token();
  const outgoing = req.clone({
    url: GATEWAY_URL + req.url,
    setHeaders: {
      'X-Correlation-Id': correlationId,
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
  return next(outgoing).pipe(
    timeout(TIMEOUT_MS),
    catchError((err: unknown) => {
      const http =
        err instanceof TimeoutError
          ? new HttpErrorResponse({ status: 0, error: { error: 'TIMEOUT' }, url: outgoing.url })
          : err instanceof HttpErrorResponse
            ? err
            : new HttpErrorResponse({ status: 0, error: err, url: outgoing.url });
      // The 401 of the login is a wrong credential; the 401 of the refresh only
      // closes the session. Any other 401 closes it and opens the login.
      if (http.status === 401 && !req.url.startsWith(LOGIN_PATH)) {
        session.clear();
        if (!req.url.startsWith(REFRESH_PATH)) {
          void router.navigate(['/auth/login'], { queryParams: { returnUrl: router.url, expired: true } });
        }
      }
      return throwError(() => toApiError(http, correlationId, req.url));
    }),
  );
};
