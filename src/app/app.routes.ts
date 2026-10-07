import { Routes } from '@angular/router';
import { landingGuard } from './core/auth/auth.guard';

export const routes: Routes = [
  { path: '', pathMatch: 'full', title: 'Property', canActivate: [landingGuard], loadComponent: () =>
      import('./layout/home.component').then((m) => m.HomeComponent) },
  { path: 'auth/login', title: 'Iniciar sesión', loadComponent: () =>
      import('./core/auth/sign-in.component').then((m) => m.SignInComponent) },
  { path: '**', title: 'Página no encontrada', loadComponent: () =>
      import('./layout/not-found.component').then((m) => m.NotFoundComponent) },
];
