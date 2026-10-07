import { Component, provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router, withComponentInputBinding } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { routes } from './app.routes';
import { SessionService } from './core/auth/session.service';

@Component({ template: 'explorar' })
class ExploreStubComponent {}

describe('app routes', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        // A stand-in for the catalog portal, which is not mounted here.
        provideRouter([{ path: 'explorar', component: ExploreStubComponent }, ...routes],
          withComponentInputBinding()),
      ],
    });
  });

  it('shows the 404 page, with a link to Explorar, for a route that does not exist', async () => {
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl('/no-existe');
    const element = harness.routeNativeElement!;
    expect(element.textContent).toContain('No encontramos lo que buscas');
    expect(element.querySelector('a')?.getAttribute('href')).toBe('/explorar');
    expect(TestBed.inject(Router).url).toBe('/no-existe');
  });

  it('shows the landing with the brand without a session', async () => {
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl('/');
    expect(harness.routeNativeElement?.textContent).toContain('Property');
    expect(TestBed.inject(Router).url).toBe('/');
  });

  it('sends the landing to /explorar with a session', async () => {
    TestBed.inject(SessionService).set('token-abc');
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl('/');
    expect(TestBed.inject(Router).url).toBe('/explorar');
  });
});
