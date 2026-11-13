import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { SessionService } from '../auth/session.service';
import { ApiError } from './api-error';
import { apiInterceptor } from './api.interceptor';

describe('apiInterceptor', () => {
  let http: HttpClient;
  let backend: HttpTestingController;
  let session: SessionService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([]),
        provideHttpClient(withInterceptors([apiInterceptor])),
        provideHttpClientTesting(),
      ],
    });
    http = TestBed.inject(HttpClient);
    backend = TestBed.inject(HttpTestingController);
    session = TestBed.inject(SessionService);
  });

  afterEach(() => {
    vi.useRealTimers();
    backend.verify();
    sessionStorage.clear();
  });

  const GW = 'http://localhost:8080';
  const auth = (n: number) => ({ accessToken: `access-${n}`, refreshToken: `refresh-${n}`, expiresIn: 3600,
    user: { id: 'u', email: 'ana@example.com', name: 'Ana Pérez', roles: ['GUEST'] } });

  it('keeps the session of a login and hands the portal the account without the tokens', () => {
    let body: unknown;
    http.post('/api/v1/login', { email: 'a', password: 'b' }).subscribe((b) => (body = b));
    backend.expectOne(`${GW}/api/v1/login`).flush(auth(1));
    expect(session.token()).toBe('access-1');
    expect(session.refreshToken()).toBe('refresh-1');
    expect(body).toEqual({ expiresIn: 3600, user: auth(1).user });
  });

  it('renews once for two requests that got a 401 and sends both again with the new token', () => {
    session.start(auth(1));
    const results: unknown[] = [];
    http.get('/api/v1/reservas').subscribe((r) => results.push(r));
    http.get('/api/v1/sagas/s').subscribe((r) => results.push(r));
    for (const path of ['/api/v1/reservas', '/api/v1/sagas/s']) {
      backend.expectOne(`${GW}${path}`).flush({}, { status: 401, statusText: 'Unauthorized' });
    }
    const refresh = backend.expectOne(`${GW}/api/v1/refresh`);
    expect(refresh.request.body).toEqual({ refreshToken: 'refresh-1' });
    refresh.flush(auth(2));
    for (const path of ['/api/v1/reservas', '/api/v1/sagas/s']) {
      const again = backend.expectOne(`${GW}${path}`);
      expect(again.request.headers.get('Authorization')).toBe('Bearer access-2');
      again.flush({ ok: path });
    }
    expect(results).toHaveLength(2);
    expect(session.refreshToken()).toBe('refresh-2');
  });

  it('closes the session and opens the login when the renewal is refused', () => {
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    session.start(auth(1));
    const result = capture('/api/v1/reservas');
    backend.expectOne(`${GW}/api/v1/reservas`).flush({}, { status: 401, statusText: 'Unauthorized' });
    backend.expectOne(`${GW}/api/v1/refresh`).flush({ error: 'UNAUTHORIZED' }, { status: 401, statusText: 'Unauthorized' });
    expect(session.token()).toBeNull();
    expect(session.refreshToken()).toBeNull();
    expect(result.error?.status).toBe(401);
    expect(navigate).toHaveBeenCalled();
  });

  it('renews right after becoming a host, so the next token carries the role', () => {
    session.start(auth(1));
    http.post('/api/v1/users/me/upgrade-to-host', {}).subscribe();
    backend.expectOne(`${GW}/api/v1/users/me/upgrade-to-host`).flush({ roles: ['HOST'] });
    backend.expectOne(`${GW}/api/v1/refresh`).flush(auth(2));
    expect(session.token()).toBe('access-2');
  });

  function capture(url: string): { error?: ApiError } {
    const result: { error?: ApiError } = {};
    http.get(url).subscribe({ error: (e: ApiError) => (result.error = e) });
    return result;
  }

  it('sends the request to the gateway with the token and a correlation id', () => {
    session.set('token-abc');
    http.get('/api/v1/reservas').subscribe();
    const req = backend.expectOne('http://localhost:8080/api/v1/reservas');
    expect(req.request.headers.get('Authorization')).toBe('Bearer token-abc');
    expect(req.request.headers.get('X-Correlation-Id')).toMatch(/^[0-9a-f-]{36}$/);
    req.flush({});
  });

  it('creates a new correlation id for every request', () => {
    http.get('/api/v1/reservas').subscribe();
    http.get('/api/v1/reservas').subscribe();
    const [first, second] = backend.match('http://localhost:8080/api/v1/reservas');
    expect(first.request.headers.get('X-Correlation-Id'))
      .not.toBe(second.request.headers.get('X-Correlation-Id'));
    first.flush({});
    second.flush({});
  });

  it('sends no Authorization header without a session', () => {
    http.get('/api/v1/propiedades').subscribe();
    const req = backend.expectOne('http://localhost:8080/api/v1/propiedades');
    expect(req.request.headers.has('Authorization')).toBe(false);
    req.flush({});
  });

  it('leaves requests that are not for the API untouched', () => {
    http.get('/federation.manifest.json').subscribe();
    const req = backend.expectOne('/federation.manifest.json');
    expect(req.request.headers.has('X-Correlation-Id')).toBe(false);
    req.flush({});
  });

  it('closes the session and opens the login on a 401', () => {
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    session.set('token-abc');
    const result = capture('/api/v1/reservas');
    backend.expectOne('http://localhost:8080/api/v1/reservas')
      .flush({ error: 'UNAUTHORIZED' }, { status: 401, statusText: 'Unauthorized' });
    expect(session.token()).toBeNull();
    expect(result.error?.status).toBe(401);
    expect(navigate).toHaveBeenCalledWith(['/auth/login'],
      { queryParams: { returnUrl: '/', expired: true } });
  });

  it('keeps the session on a 401 of the login', () => {
    session.set('token-abc');
    capture('/api/v1/login');
    backend.expectOne('http://localhost:8080/api/v1/login')
      .flush({}, { status: 401, statusText: 'Unauthorized' });
    expect(session.token()).toBe('token-abc');
  });

  it('closes the session without opening the login on a 401 of the refresh', () => {
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigate');
    session.set('token-abc');
    capture('/api/v1/refresh');
    backend.expectOne('http://localhost:8080/api/v1/refresh')
      .flush({}, { status: 401, statusText: 'Unauthorized' });
    expect(session.token()).toBeNull();
    expect(navigate).not.toHaveBeenCalled();
  });

  it('turns a request with no answer after 10 s into a TIMEOUT error', () => {
    vi.useFakeTimers();
    const result = capture('/api/v1/reservas');
    const req = backend.expectOne('http://localhost:8080/api/v1/reservas');
    vi.advanceTimersByTime(10_000);
    expect(req.cancelled).toBe(true);
    expect(result.error?.status).toBe(0);
    expect(result.error?.code).toBe('TIMEOUT');
    expect(result.error?.traceId).toBe(req.request.headers.get('X-Correlation-Id'));
  });

  it('turns every failure into an ApiError with its message', () => {
    const result = capture('/api/v1/reservas');
    backend.expectOne('http://localhost:8080/api/v1/reservas')
      .flush({ error: 'INTERNAL', traceId: 't-9' }, { status: 500, statusText: 'Server Error' });
    expect(result.error).toMatchObject({
      status: 500, code: 'INTERNAL', traceId: 't-9',
      userMessage: 'Algo salió mal de nuestro lado. Referencia: t-9',
    });
  });
});
