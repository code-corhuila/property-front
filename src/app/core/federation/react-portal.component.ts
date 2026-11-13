import { HttpClient } from '@angular/common/http';
import { afterNextRender, Component, ElementRef, inject, input, OnDestroy } from '@angular/core';
import { firstValueFrom } from 'rxjs';

/** The framework-neutral client a React portal receives (ADR-012, rule 3). */
export interface ApiClient {
  get<T>(path: string): Promise<T>;
  patch<T>(path: string, body: unknown): Promise<T>;
}

/** What a React portal exports from its module (e.g. property-notification-portal's mount.js). */
export interface ReactPortal {
  mount(element: Element, options: { apiClient: ApiClient }): void;
  unmount(element: Element): void;
}

/**
 * Wraps the container's HttpClient: the same interceptor (gateway URL, token, X-Correlation-Id,
 * time limit, one ApiError with its userMessage), behind promises a React portal can use.
 */
export function apiClientFrom(http: HttpClient): ApiClient {
  return {
    get: <T>(path: string) => firstValueFrom(http.get<T>(path)),
    patch: <T>(path: string, body: unknown) => firstValueFrom(http.patch<T>(path, body)),
  };
}

/** The area of a React portal: mount on the first render, unmount when the route is left. */
@Component({ selector: 'app-react-portal', template: '' })
export class ReactPortalComponent implements OnDestroy {
  /** From the route data: the module already loaded by the route. */
  readonly portal = input.required<ReactPortal>();
  private readonly host = inject(ElementRef<HTMLElement>).nativeElement;
  private readonly apiClient = apiClientFrom(inject(HttpClient));

  constructor() {
    afterNextRender(() => this.portal().mount(this.host, { apiClient: this.apiClient }));
  }

  ngOnDestroy(): void {
    this.portal().unmount(this.host);
  }
}
