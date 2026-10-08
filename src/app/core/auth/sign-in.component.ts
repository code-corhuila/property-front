import { booleanAttribute, Component, inject, input } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { SessionService } from './session.service';

/**
 * DEVELOPMENT ONLY. Until the identity domain exists, a token minted with
 * property-infra/scripts/dev-token.sh is pasted here. The login of
 * property-identity-portal replaces this component, and it never reaches `main`
 * (course norm, numeral 5.5.2).
 */
@Component({
  selector: 'app-sign-in',
  imports: [ReactiveFormsModule],
  template: `
    <form [formGroup]="form" (ngSubmit)="submit()" aria-labelledby="signin-title">
      <h1 id="signin-title">Inicio de sesión de desarrollo</h1>
      @if (expired()) {
        <p role="alert">Tu sesión expiró</p>
      }
      <label for="dev-token">Token de acceso (dev-token.sh)</label>
      <textarea id="dev-token" rows="4" formControlName="token"></textarea>
      <label for="dev-name">Nombre (opcional, para el avatar)</label>
      <input id="dev-name" type="text" formControlName="name">
      <button type="submit" [disabled]="form.invalid">Iniciar sesión</button>
    </form>
  `,
  styles: `
    form {
      display: grid; gap: var(--space-2); margin: 0 auto; max-width: calc(8 * var(--space-16));
      padding: var(--space-8); background: var(--color-bg-card);
      border-radius: var(--radius-lg); box-shadow: var(--shadow-md);
    }
    h1 { font-family: var(--font-family-serif); font-size: var(--font-size-2xl); margin: 0; }
    label { font-size: var(--font-size-sm); }
    textarea, input { font: inherit; padding: var(--space-2); border-radius: var(--radius-md); }
    [role='alert'] { color: var(--color-error); }
    button {
      margin-top: var(--space-4); padding: var(--space-3); border: none; cursor: pointer;
      border-radius: var(--radius-md); font: inherit; font-weight: var(--font-weight-medium);
      background: var(--color-primary-900); color: var(--color-text-on-dark);
    }
    button:disabled { opacity: 0.5; cursor: not-allowed; }
  `,
})
export class SignInComponent {
  // Bound from the query string: undefined when the login was opened directly.
  readonly returnUrl = input<string | undefined>();
  readonly expired = input(false, { transform: booleanAttribute });
  private readonly session = inject(SessionService);
  private readonly router = inject(Router);
  readonly form = inject(NonNullableFormBuilder).group({
    token: ['', Validators.required],
    name: [''],
  });

  submit(): void {
    const { token, name } = this.form.getRawValue();
    this.session.set(token.trim(), name.trim() || null);
    // Only paths inside this application: an absolute URL never leaves it.
    const returnUrl = this.returnUrl();
    void this.router.navigateByUrl(returnUrl?.startsWith('/') ? returnUrl : '/explorar');
  }
}
