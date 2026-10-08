import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router, withComponentInputBinding } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { routes } from '../../app.routes';
import { SessionService } from '../auth/session.service';
import { RemoteUnavailableComponent, remoteUnavailable } from './remote-unavailable.component';

describe('remoteUnavailable', () => {
  it('replaces the routes of a portal with the unavailable area, named after its section', () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    expect(remoteUnavailable('catalog', new Error('down'))).toEqual([
      { path: '**', component: RemoteUnavailableComponent, data: { section: 'catalog' } },
    ]);
  });
});

describe('a portal that cannot be loaded', () => {
  let errors: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    errors = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection(), provideRouter(routes, withComponentInputBinding())],
    });
    TestBed.inject(SessionService).set('token-abc');
  });

  afterEach(() => errors.mockRestore());

  it.each([
    ['/explorar', 'catalog'],
    ['/propiedades/7', 'catalog'],
    ['/propiedades/7/reservar', 'booking'],
    ['/reservas', 'booking'],
    ['/reservas/checkout/confirmar', 'booking'],
    ['/reservas/checkout/pago', 'payment'],
    ['/perfil', 'identity'],
    ['/perfil/notificaciones', 'notification'],
    ['/auth/register', 'identity'],
  ])('%s shows that the %s section is not available', async (url, section) => {
    const harness = await RouterTestingHarness.create();
    const component = await harness.navigateByUrl(url, RemoteUnavailableComponent);
    expect(component.section()).toBe(section);
    expect(harness.routeNativeElement?.textContent).toContain('Esta sección no está disponible');
    expect(TestBed.inject(Router).url).toBe(url);
  });

  it('tries to load the portal again with "Reintentar", without reloading the page', async () => {
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl('/explorar');
    const failures = () => errors.mock.calls.filter((call: unknown[]) => String(call[0]).includes('"catalog"')).length;
    expect(failures()).toBe(1);
    harness.routeNativeElement!.querySelector('button')!.click();
    await vi.waitFor(() => expect(failures()).toBe(2));
    expect(TestBed.inject(SessionService).token()).toBe('token-abc');
  });
});
