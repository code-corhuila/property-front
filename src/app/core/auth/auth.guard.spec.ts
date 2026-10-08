import { Component, provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router, withComponentInputBinding } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { authGuard } from './auth.guard';
import { SessionService } from './session.service';
import { SignInComponent } from './sign-in.component';

@Component({ template: 'reservas' })
class ProtectedComponent {}

describe('authGuard', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([
          { path: 'auth/login', component: SignInComponent },
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

  it('brings the visitor back to the route asked for after signing in', async () => {
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl('/reservas/42');
    const element: HTMLElement = harness.routeNativeElement!;
    const textarea = element.querySelector('textarea')!;
    textarea.value = 'token-abc';
    textarea.dispatchEvent(new Event('input'));
    element.querySelector('form')!.dispatchEvent(new Event('submit'));
    await harness.fixture.whenStable();
    expect(TestBed.inject(SessionService).token()).toBe('token-abc');
    expect(TestBed.inject(Router).url).toBe('/reservas/42');
  });
});
