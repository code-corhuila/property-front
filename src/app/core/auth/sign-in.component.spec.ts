import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router, withComponentInputBinding } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { SignInComponent } from './sign-in.component';

describe('SignInComponent', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([{ path: 'auth/login', component: SignInComponent }], withComponentInputBinding()),
      ],
    });
  });

  it('says the session expired when it was closed by a 401', async () => {
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl('/auth/login?expired=true');
    expect(harness.routeNativeElement?.textContent).toContain('Tu sesión expiró');
  });

  it('goes to Explorar after signing in when the login was opened directly', async () => {
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl('/auth/login');
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigateByUrl').mockResolvedValue(true);
    const element = harness.routeNativeElement!;
    const textarea = element.querySelector('textarea')!;
    textarea.value = 'token-abc';
    textarea.dispatchEvent(new Event('input'));
    element.querySelector('form')!.dispatchEvent(new Event('submit'));
    expect(navigate).toHaveBeenCalledWith('/explorar');
  });

  it('says nothing about an expired session on a normal visit', async () => {
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl('/auth/login');
    expect(harness.routeNativeElement?.textContent).not.toContain('Tu sesión expiró');
  });
});
