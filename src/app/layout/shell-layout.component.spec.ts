import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { SessionService } from '../core/auth/session.service';
import { ShellLayoutComponent } from './shell-layout.component';

describe('ShellLayoutComponent', () => {
  let session: SessionService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection(), provideRouter([])],
    });
    session = TestBed.inject(SessionService);
  });

  async function render(): Promise<HTMLElement> {
    const fixture = TestBed.createComponent(ShellLayoutComponent);
    await fixture.whenStable();
    return fixture.nativeElement;
  }

  it('shows the brand in the top bar', async () => {
    expect((await render()).querySelector('header')?.textContent).toContain('Property');
  });

  it('has exactly three entries in the bottom navigation: Explorar, Reservas, Perfil', async () => {
    session.set('token-abc');
    const links = Array.from((await render()).querySelectorAll('nav[aria-label="Principal"] a'));
    expect(links.map((a) => a.textContent?.trim())).toEqual(['Explorar', 'Reservas', 'Perfil']);
    expect(links.map((a) => a.getAttribute('href'))).toEqual(['/explorar', '/reservas', '/perfil']);
  });

  it('shows neither the navigation nor the avatar without a session', async () => {
    const element = await render();
    expect(element.querySelector('nav[aria-label="Principal"]')).toBeNull();
    expect(element.querySelector('.avatar')).toBeNull();
  });

  it('shows the initials of the person in the avatar', async () => {
    session.set('token-abc', 'Juan Ortiz');
    expect((await render()).querySelector('.avatar')?.textContent?.trim()).toBe('JO');
  });

  it('closes the session with the sign-out button', async () => {
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigateByUrl').mockResolvedValue(true);
    session.set('token-abc');
    const button = Array.from((await render()).querySelectorAll('button'))
      .find((b) => b.textContent?.includes('Cerrar sesión'));
    button!.click();
    expect(session.token()).toBeNull();
    expect(navigate).toHaveBeenCalledWith('/');
  });
});
