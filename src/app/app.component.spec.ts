import { TestBed } from '@angular/core/testing';
import { AppComponent } from './app.component';
import { appConfig } from './app.config';

describe('AppComponent', () => {
  beforeEach(() => TestBed.configureTestingModule({ providers: appConfig.providers }));

  it('creates the application', () => {
    const fixture = TestBed.createComponent(AppComponent);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('renders the router outlet', () => {
    const fixture = TestBed.createComponent(AppComponent);
    expect(fixture.nativeElement.querySelector('router-outlet')).not.toBeNull();
  });
});
