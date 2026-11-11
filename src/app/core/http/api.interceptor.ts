import {
  HttpErrorResponse, HttpEvent, HttpHandlerFn, HttpHeaders, HttpInterceptorFn, HttpRequest, HttpResponse,
} from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import {
  catchError, filter, finalize, map, Observable, of, shareReplay, switchMap, take, throwError, timeout, TimeoutError,
} from 'rxjs';
import { SessionService } from '../auth/session.service';
import { toApiError } from './api-error';

// property-docs, 05-architecture/deployment.md: the API Gateway is the only entry point.
const GATEWAY_URL = 'http://localhost:8080';
const TIMEOUT_MS = 10_000;
const LOGIN_PATH = '/api/v1/login';
const REFRESH_PATH = '/api/v1/refresh';
const REGISTER_PATH = '/api/v1/register';
const UPGRADE_PATH = '/api/v1/users/me/upgrade-to-host';
const SESSION_PATHS = [LOGIN_PATH, REGISTER_PATH, REFRESH_PATH];

/** The renewal in flight: concurrent 401s share it, because a refresh token is single-use (E-12). */
let renewal: Observable<string> | null = null;

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
  const send = (token: string | null) => next(req.clone({
    url: GATEWAY_URL + req.url,
    setHeaders: {
      'X-Correlation-Id': correlationId,
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  })).pipe(timeout(TIMEOUT_MS));
  const outgoing = { url: GATEWAY_URL + req.url };
  const isSession = SESSION_PATHS.some((path) => req.url.startsWith(path));
  // A 401 of a protected call with a refresh token at hand: renew once and send it again.
  const renewing = (err: unknown) =>
    err instanceof HttpErrorResponse && err.status === 401 && !isSession && session.refreshToken()
      ? renew(session, next).pipe(switchMap((token) => send(token)))
      : throwError(() => err);
  return send(session.token()).pipe(
    catchError(renewing),
    // The container keeps the session: the tokens never reach the portal that asked (ADR-012).
    map((event) => (isSession ? keep(session, event) : event)),
    // A HOST is in the next token only: renew right after the upgrade (E-14, HU-IDENT-003).
    switchMap((event) => req.url.startsWith(UPGRADE_PATH) && event instanceof HttpResponse
      ? renew(session, next).pipe(map(() => event), catchError(() => of(event)))
      : of(event)),
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

/** Stores an AuthResponse and hands on the account without accessToken and refreshToken. */
function keep(session: SessionService, event: HttpEvent<unknown>): HttpEvent<unknown> {
  if (!(event instanceof HttpResponse)) return event;
  const body = event.body as { accessToken?: string; refreshToken?: string; [field: string]: unknown } | null;
  if (!body?.accessToken || !body.refreshToken) return event;
  session.start({ accessToken: body.accessToken, refreshToken: body.refreshToken, user: body['user'] as { name?: string } });
  const { accessToken: _a, refreshToken: _r, ...rest } = body;
  return event.clone({ body: rest });
}

/** POST /refresh with the stored refresh token (E-12), once for all the requests waiting on it. */
function renew(session: SessionService, next: HttpHandlerFn): Observable<string> {
  renewal ??= next(new HttpRequest('POST', GATEWAY_URL + REFRESH_PATH, { refreshToken: session.refreshToken() },
    { headers: new HttpHeaders({ 'X-Correlation-Id': crypto.randomUUID() }) })).pipe(
    timeout(TIMEOUT_MS),
    filter((event): event is HttpResponse<unknown> => event instanceof HttpResponse),
    take(1),
    map((event) => {
      keep(session, event);
      return session.token()!;
    }),
    finalize(() => (renewal = null)),
    shareReplay(1),
  );
  return renewal;
}
