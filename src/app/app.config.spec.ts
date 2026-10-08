import { HttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { appConfig } from './app.config';

describe('appConfig', () => {
  it('provides the HttpClient that portals inject, with the interceptor', () => {
    TestBed.configureTestingModule({ providers: [...appConfig.providers, provideHttpClientTesting()] });
    TestBed.inject(HttpClient).get('/api/v1/propiedades').subscribe();
    const req = TestBed.inject(HttpTestingController).expectOne('http://localhost:8080/api/v1/propiedades');
    expect(req.request.headers.has('X-Correlation-Id')).toBe(true);
    req.flush({});
  });
});
