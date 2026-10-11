import { Component, provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router, withComponentInputBinding } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { authGuard } from './auth.guard';
import { SessionService } from './session.service';

@Component({ template: 'reservas' })
class ProtectedComponent {}

// A stand-in for the login of the identity portal, which is not mounted here.
@Component({ selector: 'app-login-stub', template: 'login' })
class LoginStubComponent {}

describe('authGuard', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([
          { path: 'auth/login', component: LoginStubComponent },
          { path: 'reservas/:id', component: ProtectedComponent, canActivate: [authGuard] },
        ], withComponentInputBinding()),
      ],
    });
  });

  it('sends a visitor without a session to the login, keeping the route asked for', async () => {
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl('/reservas/42');
    expect(TestBed.inject(Router).url).toBe('/auth/login?returnUrl=%2Freservas%2F42');
  });

  it('lets a visitor with a session through', async () => {
    TestBed.inject(SessionService).set('token-abc');
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl('/reservas/42');
    expect(TestBed.inject(Router).url).toBe('/reservas/42');
  });
});
