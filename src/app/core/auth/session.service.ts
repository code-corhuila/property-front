import { Injectable, signal } from '@angular/core';

/**
 * The session, held once for the whole application. The access token lives in memory
 * only, never in browser storage (property-docs, 00-governance/security-policy.md,
 * "Client storage"). A portal never reads it: the interceptor attaches it.
 * The name comes with the sign-in (`AuthResponse.user`) and feeds the avatar.
 */
@Injectable({ providedIn: 'root' })
export class SessionService {
  private readonly tokenSignal = signal<string | null>(null);
  private readonly nameSignal = signal<string | null>(null);
  readonly token = this.tokenSignal.asReadonly();
  readonly name = this.nameSignal.asReadonly();

  set(token: string, name: string | null = null): void {
    this.tokenSignal.set(token);
    this.nameSignal.set(name);
  }

  clear(): void {
    this.tokenSignal.set(null);
    this.nameSignal.set(null);
  }
}
