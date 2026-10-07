import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', pathMatch: 'full', title: 'Property', loadComponent: () =>
      import('./layout/home.component').then((m) => m.HomeComponent) },
  { path: 'auth/login', title: 'Iniciar sesión', loadComponent: () =>
      import('./core/auth/sign-in.component').then((m) => m.SignInComponent) },
  // Provisional: the 404 page of the container replaces this redirect.
  { path: '**', redirectTo: '' },
];
