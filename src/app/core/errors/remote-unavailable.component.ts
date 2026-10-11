import { Component, inject, input } from '@angular/core';
import { Router, Routes } from '@angular/router';

/**
 * Section Unavailable (property-docs, 12-ux-ui/design-system.md): drawn by the
 * container in the area of a portal that could not be loaded. The frame and the
 * other portals keep working.
 */
@Component({
  selector: 'app-remote-unavailable',
  template: `
    <section role="alert">
      <p>Esta sección no está disponible</p>
      <button type="button" (click)="retry()">Reintentar</button>
    </section>
  `,
  styles: `
    section {
      display: grid; justify-items: start; gap: var(--space-4); padding: var(--space-8);
      background: var(--color-bg-card); border-radius: var(--radius-lg); box-shadow: var(--shadow-md);
    }
    p { margin: 0; font-size: var(--font-size-lg); }
    button {
      padding: var(--space-2) var(--space-6); cursor: pointer; font: inherit;
      color: var(--color-primary-900); background: var(--color-bg-card);
      border: solid var(--color-primary-900); border-radius: var(--radius-md);
    }
  `,
})
export class RemoteUnavailableComponent {
  /** The portal this area belongs to, from the route data. */
  readonly section = input.required<string>();
  private readonly router = inject(Router);

  /**
   * Loads the portal again without reloading the page: a reload would close the
   * session, whose token lives in memory. Fresh routes forget the failed load.
   */
  async retry(): Promise<void> {
    const { createRoutes } = await import('../../app.routes');
    this.router.resetConfig(createRoutes());
    await this.router.navigateByUrl(this.router.url, { onSameUrlNavigation: 'reload' });
  }
}

/** The routes a portal is replaced with when it cannot be loaded. */
export function remoteUnavailable(section: string, err: unknown): Routes {
  console.error(`portal "${section}" failed to load`, err);
  return [{ path: '**', component: RemoteUnavailableComponent, data: { section } }];
}
