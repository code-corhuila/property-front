import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

/** The landing: the Property wordmark. With a session, landingGuard sends to /explorar. */
@Component({
  selector: 'app-home',
  imports: [RouterLink],
  template: `
    <section>
      <h1>
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 11 12 3l9 8M5 9.5V21h5v-6h4v6h5V9.5"/></svg>
        Property
      </h1>
      <a routerLink="/auth/login">Iniciar sesión</a>
    </section>
  `,
  styles: `
    section {
      position: fixed; inset: 0; z-index: 1; display: flex; flex-direction: column;
      align-items: center; justify-content: center; gap: var(--space-8);
      background: var(--color-primary-900);
    }
    section :focus-visible { outline-color: var(--color-secondary-500); }
    h1 {
      display: flex; align-items: center; gap: var(--space-2); margin: 0;
      color: var(--color-secondary-500); font-family: var(--font-family-serif);
      font-size: var(--font-size-3xl); font-weight: var(--font-weight-regular);
    }
    svg {
      width: var(--space-12); height: var(--space-12); fill: none; stroke: currentColor;
      stroke-width: 1.5; stroke-linecap: round; stroke-linejoin: round;
    }
    a { color: var(--color-text-on-dark); font-size: var(--font-size-lg); }
  `,
})
export class HomeComponent {}
