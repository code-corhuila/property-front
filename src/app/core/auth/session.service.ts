import { Injectable, signal } from '@angular/core';

/**
 * The session, held once for the whole application. The access token lives in memory
 * only, never in browser storage (property-docs, 00-governance/security-policy.md,
 * "Client storage"). A portal never reads it: the interceptor attaches it.
 */
@Injectable({ providedIn: 'root' })
export class SessionService {
  private readonly tokenSignal = signal<string | null>(null);
  readonly token = this.tokenSignal.asReadonly();

  set(token: string): void {
    this.tokenSignal.set(token);
  }

  clear(): void {
    this.tokenSignal.set(null);
  }
}
