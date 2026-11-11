import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, firstValueFrom, of } from 'rxjs';
import { SessionService } from './session.service';

/** The session operations only the container performs (HU-IDENT-002, E-12 and E-13). */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly session = inject(SessionService);
  private readonly router = inject(Router);

  /**
   * At start-up: a reload lost the access token, but the refresh token of this tab is still in
   * sessionStorage. Renew it before the first route is decided; if it was revoked, start signed out.
   */
  restore(): Promise<unknown> {
    const refreshToken = this.session.refreshToken();
    if (!refreshToken || this.session.token()) return Promise.resolve();
    return firstValueFrom(this.http.post('/api/v1/refresh', { refreshToken }).pipe(catchError(() => of(null))));
  }

  /** Revokes this session in Identity and closes it here, even when Identity does not answer. */
  logout(): void {
    const refreshToken = this.session.refreshToken();
    const done = () => {
      this.session.clear();
      void this.router.navigateByUrl('/');
    };
    if (!refreshToken) return done();
    this.http.post('/api/v1/logout', { refreshToken }).subscribe({ next: done, error: done });
  }
}
