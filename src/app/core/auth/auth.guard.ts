import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { SessionService } from './session.service';

/** Without a session, the protected route sends to the login and comes back after. */
export const authGuard: CanActivateFn = (_route, state) =>
  inject(SessionService).token() !== null ||
  inject(Router).createUrlTree(['/auth/login'], { queryParams: { returnUrl: state.url } });
