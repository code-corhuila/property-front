import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', pathMatch: 'full', title: 'Property', loadComponent: () =>
      import('./layout/home.component').then((m) => m.HomeComponent) },
  // Provisional: the 404 page of the container replaces this redirect.
  { path: '**', redirectTo: '' },
];
