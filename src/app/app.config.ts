import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { ApplicationConfig, inject, provideAppInitializer, provideZonelessChangeDetection } from '@angular/core';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { routes } from './app.routes';
import { AuthService } from './core/auth/auth.service';
import { apiInterceptor } from './core/http/api.interceptor';

/**
 * The ONLY provideHttpClient() of the whole application. Portals loaded as routes
 * inherit this client and its interceptor; they must never provide their own.
 */
export const appConfig: ApplicationConfig = {
  providers: [
    provideZonelessChangeDetection(),
    provideRouter(routes, withComponentInputBinding()),
    provideHttpClient(withInterceptors([apiInterceptor])),
    // A reload keeps the session of the tab (security-policy.md, "Client storage").
    provideAppInitializer(() => inject(AuthService).restore()),
  ],
};
