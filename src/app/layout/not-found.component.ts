import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

/** The 404 page of the container (navigation-map.md, "404"). */
@Component({
  selector: 'app-not-found',
  imports: [RouterLink],
  template: `
    <section>
      <h1>No encontramos lo que buscas</h1>
      <p>La dirección no existe. <a routerLink="/explorar">Ir a Explorar</a></p>
    </section>
  `,
  styles: `
    h1 { font-family: var(--font-family-serif); font-size: var(--font-size-2xl); }
    a { color: var(--color-primary-900); font-weight: var(--font-weight-bold); }
  `,
})
export class NotFoundComponent {}
