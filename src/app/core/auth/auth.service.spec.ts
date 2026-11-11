import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { apiInterceptor } from '../http/api.interceptor';
import { AuthService } from './auth.service';
import { SessionService } from './session.service';

describe('AuthService', () => {
  let backend: HttpTestingController;
  let session: SessionService;

  beforeEach(() => {
    sessionStorage.clear();
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection(), provideRouter([]),
        provideHttpClient(withInterceptors([apiInterceptor])), provideHttpClientTesting()],
    });
    backend = TestBed.inject(HttpTestingController);
    session = TestBed.inject(SessionService);
  });

  afterEach(() => backend.verify());

  it('restores the session of the tab after a reload with the refresh token', async () => {
    sessionStorage.setItem(SessionService.REFRESH_KEY, 'refresh-1');
    const restored = TestBed.inject(AuthService).restore();
    backend.expectOne('http://localhost:8080/api/v1/refresh').flush({
      accessToken: 'access-2', refreshToken: 'refresh-2', expiresIn: 3600, user: { name: 'Ana Pérez' } });
    await restored;
    expect(session.token()).toBe('access-2');
    expect(session.name()).toBe('Ana Pérez');
  });

  it('starts signed out without a refresh token, or when it was revoked', async () => {
    await TestBed.inject(AuthService).restore();
    sessionStorage.setItem(SessionService.REFRESH_KEY, 'revoked');
    const restored = TestBed.inject(AuthService).restore();
    backend.expectOne('http://localhost:8080/api/v1/refresh').flush({}, { status: 401, statusText: 'Unauthorized' });
    await restored;
    expect(session.token()).toBeNull();
    expect(session.refreshToken()).toBeNull();
  });

  it('logs out in Identity, then closes the session here, even if Identity fails', () => {
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigateByUrl').mockResolvedValue(true);
    session.start({ accessToken: 'access-1', refreshToken: 'refresh-1' });
    TestBed.inject(AuthService).logout();
    const req = backend.expectOne('http://localhost:8080/api/v1/logout');
    expect(req.request.body).toEqual({ refreshToken: 'refresh-1' });
    req.flush({}, { status: 503, statusText: 'Unavailable' });
    expect(session.token()).toBeNull();
    expect(session.refreshToken()).toBeNull();
    expect(navigate).toHaveBeenCalledWith('/');
  });
});
