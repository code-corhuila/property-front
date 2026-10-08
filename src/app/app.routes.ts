import { loadRemoteModule } from '@angular-architects/native-federation';
import { Route, Routes } from '@angular/router';
import { authGuard, landingGuard } from './core/auth/auth.guard';
import { remoteUnavailable } from './core/errors/remote-unavailable.component';
import { remoteEntries } from './core/federation/remote-entries';

/**
 * Mounts one set of routes of a portal. Every portal exposes './routes', which
 * exports one array per mount point (see README). A portal that cannot be loaded
 * shows Section Unavailable in its area; the rest keeps working.
 */
function portal(remoteName: string, routesName: string): Route['loadChildren'] {
  return () =>
    loadRemoteModule({ remoteName, remoteEntry: remoteEntries[remoteName], exposedModule: './routes' })
      .then((m) => m[routesName] as Routes)
      .catch((err) => remoteUnavailable(remoteName, err));
}

/**
 * One entry per row of the "Screen map" of property-docs, 12-ux-ui/navigation-map.md.
 * Where two portals share a prefix, the longer route comes first.
 */
export function createRoutes(): Routes {
  const signedIn = { canActivate: [authGuard] };
  return [
    { path: '', pathMatch: 'full', title: 'Property', canActivate: [landingGuard], loadComponent: () =>
        import('./layout/home.component').then((m) => m.HomeComponent) },
    // DEVELOPMENT ONLY: replaced by the login of the identity portal (README).
    { path: 'auth/login', title: 'Iniciar sesión', loadComponent: () =>
        import('./core/auth/sign-in.component').then((m) => m.SignInComponent) },
    { path: 'auth/register', loadChildren: portal('identity', 'REGISTER_ROUTES') },
    { path: 'auth/onboarding', ...signedIn, loadChildren: portal('identity', 'ONBOARDING_ROUTES') },
    { path: 'explorar', ...signedIn, loadChildren: portal('catalog', 'EXPLORE_ROUTES') },
    { path: 'propiedades/:propiedadId/reservar', ...signedIn,
      loadChildren: portal('booking', 'BOOKING_FORM_ROUTES') },
    { path: 'propiedades/:propiedadId', ...signedIn, loadChildren: portal('catalog', 'PROPERTY_ROUTES') },
    { path: 'reservas/checkout/pago', ...signedIn, loadChildren: portal('payment', 'PAYMENT_ROUTES') },
    { path: 'reservas', ...signedIn, loadChildren: portal('booking', 'BOOKINGS_ROUTES') },
    // React portal (ADR-012, rule 3): until property-notification-portal exists and the
    // container mounts it through mount()/unmount(), this route only shows its isolation.
    { path: 'perfil/notificaciones', ...signedIn,
      loadChildren: portal('notification', 'NOTIFICATION_ROUTES') },
    { path: 'perfil', ...signedIn, loadChildren: portal('identity', 'PROFILE_ROUTES') },
    { path: '**', title: 'Página no encontrada', loadComponent: () =>
        import('./layout/not-found.component').then((m) => m.NotFoundComponent) },
  ];
}

export const routes = createRoutes();
