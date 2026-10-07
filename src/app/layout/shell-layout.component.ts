import { Component, computed, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { SessionService } from '../core/auth/session.service';

/**
 * The frame of every screen: top bar with the brand, the avatar and the sign-out,
 * and the bottom navigation with its three entries (property-docs,
 * 12-ux-ui/navigation-map.md, "Bottom navigation"). Portals render inside <main>.
 */
@Component({
  selector: 'app-shell-layout',
  imports: [RouterLink, RouterLinkActive, RouterOutlet],
  template: `
    <a class="skip" href="#main">Saltar al contenido</a>
    <header>
      <a class="brand" routerLink="/" aria-label="Property, inicio">
        <svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M3 11 12 3l9 8M5 9.5V21h5v-6h4v6h5V9.5"/></svg>
        <span>Property</span>
      </a>
      @if (session.token()) {
        <div class="account">
          @if (initials()) {
            <span class="avatar" role="img" [attr.aria-label]="session.name()">{{ initials() }}</span>
          }
          <button type="button" (click)="signOut()">Cerrar sesión</button>
        </div>
      }
    </header>
    <main id="main" tabindex="-1"><router-outlet /></main>
    @if (session.token()) {
      <nav aria-label="Principal">
        @for (entry of entries; track entry.path) {
          <a [routerLink]="entry.path" routerLinkActive="active" ariaCurrentWhenActive="page">
            <svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path [attr.d]="entry.icon"/></svg>
            {{ entry.label }}
          </a>
        }
      </nav>
    }
  `,
  styles: `
    :host { display: flex; flex-direction: column; min-height: 100dvh; }
    .skip { position: absolute; left: var(--space-4); top: calc(-1 * var(--space-16)); }
    .skip:focus { top: var(--space-4); background: var(--color-bg-card); padding: var(--space-2); }
    header {
      display: flex; align-items: center; justify-content: space-between;
      padding: var(--space-3) var(--space-8); background: var(--color-primary-900);
    }
    header :focus-visible { outline-color: var(--color-secondary-500); }
    .brand {
      display: flex; align-items: center; gap: var(--space-1); text-decoration: none;
      color: var(--color-secondary-500); font-family: var(--font-family-serif);
      font-size: var(--font-size-3xl); line-height: var(--line-height-tight);
    }
    .brand .icon { width: var(--space-12); height: var(--space-12); }
    .account { display: flex; align-items: center; gap: var(--space-4); }
    .avatar {
      display: grid; place-items: center; width: var(--space-12); height: var(--space-12);
      border-radius: var(--radius-full); background: var(--color-primary-700);
      color: var(--color-text-on-dark); font-size: var(--font-size-lg);
    }
    button {
      background: none; border: none; cursor: pointer; text-decoration: underline;
      color: var(--color-text-on-dark); font: inherit; font-size: var(--font-size-sm);
    }
    main { flex: 1; padding: var(--space-8) var(--space-12); }
    nav {
      position: sticky; bottom: 0; display: flex; justify-content: space-around;
      padding: var(--space-3); background: var(--color-bg-page); box-shadow: var(--shadow-md);
    }
    nav a {
      display: flex; flex-direction: column; align-items: center; gap: var(--space-1);
      color: var(--color-text-secondary); text-decoration: none; font-size: var(--font-size-base);
    }
    nav a.active { color: var(--color-primary-900); font-weight: var(--font-weight-bold); }
    .icon {
      width: var(--space-6); height: var(--space-6); fill: none; stroke: currentColor;
      stroke-width: 1.5; stroke-linecap: round; stroke-linejoin: round;
    }
  `,
})
export class ShellLayoutComponent {
  readonly session = inject(SessionService);
  private readonly router = inject(Router);

  readonly entries = [
    { path: '/explorar', label: 'Explorar', icon: 'M3 11 12 3l9 8M5 9.5V21h5v-6h4v6h5V9.5' },
    { path: '/reservas', label: 'Reservas', icon: 'M3 8h18v12H3zM9 8V5h6v3M3 13h18' },
    { path: '/perfil', label: 'Perfil', icon: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 21a8 8 0 0 1 16 0' },
  ];

  /** "Juan Ortiz" → "JO". Identity stores no profile photo (design-system.md). */
  readonly initials = computed(() =>
    (this.session.name() ?? '').split(/\s+/).filter(Boolean).slice(0, 2)
      .map((word) => word[0].toUpperCase()).join(''),
  );

  signOut(): void {
    this.session.clear();
    void this.router.navigateByUrl('/');
  }
}
