import { Injectable, signal } from '@angular/core';

/**
 * The session, held once for the whole application (property-docs,
 * 00-governance/security-policy.md, "Client storage"): the access token in memory only, the
 * refresh token in sessionStorage, so a reload of the tab keeps the session and closing it ends
 * it. A portal never reads either: the interceptor attaches the access token.
 * The name comes with the sign-in (`AuthResponse.user`) and feeds the avatar.
 */
@Injectable({ providedIn: 'root' })
export class SessionService {
  static readonly REFRESH_KEY = 'property.refreshToken';

  private readonly tokenSignal = signal<string | null>(null);
  private readonly nameSignal = signal<string | null>(null);
  readonly token = this.tokenSignal.asReadonly();
  readonly name = this.nameSignal.asReadonly();

  set(token: string, name: string | null = null): void {
    this.tokenSignal.set(token);
    this.nameSignal.set(name);
  }

  /** An AuthResponse of /login, /register or /refresh (E-10, E-11, E-12). */
  start(auth: { accessToken: string; refreshToken: string; user?: { name?: string } }): void {
    this.set(auth.accessToken, auth.user?.name ?? this.nameSignal());
    storage()?.setItem(SessionService.REFRESH_KEY, auth.refreshToken);
  }

  refreshToken(): string | null {
    return storage()?.getItem(SessionService.REFRESH_KEY) ?? null;
  }

  clear(): void {
    this.tokenSignal.set(null);
    this.nameSignal.set(null);
    storage()?.removeItem(SessionService.REFRESH_KEY);
  }
}

/** sessionStorage may be unavailable (a blocked or private context): then the session lasts until a reload. */
function storage(): Storage | null {
  try {
    return globalThis.sessionStorage ?? null;
  } catch {
    return null;
  }
}
