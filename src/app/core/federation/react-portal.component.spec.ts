import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ApiClient, ReactPortal, ReactPortalComponent } from './react-portal.component';

describe('ReactPortalComponent', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection(), provideHttpClient(), provideHttpClientTesting()],
    });
  });

  it('mounts the portal on its own element with an API client over the container\'s HttpClient, and unmounts it', async () => {
    let mounted: { element: Element; apiClient: ApiClient } | null = null;
    let unmounted: Element | null = null;
    const portal: ReactPortal = {
      mount: (element, { apiClient }) => (mounted = { element, apiClient }),
      unmount: (element) => (unmounted = element),
    };
    const fixture = TestBed.createComponent(ReactPortalComponent);
    fixture.componentRef.setInput('portal', portal);
    await fixture.whenStable();
    expect(mounted!.element).toBe(fixture.nativeElement);

    const answer = mounted!.apiClient.patch('/api/v1/preferencias', { sms: true });
    const req = TestBed.inject(HttpTestingController).expectOne('/api/v1/preferencias');
    expect(req.request.method).toBe('PATCH');
    expect(req.request.body).toEqual({ sms: true });
    req.flush({ email: true, sms: true, push: true });
    await expect(answer).resolves.toEqual({ email: true, sms: true, push: true });

    fixture.destroy();
    expect(unmounted).toBe(mounted!.element);
  });
});
