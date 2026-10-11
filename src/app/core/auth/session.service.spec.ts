import { TestBed } from '@angular/core/testing';
import { SessionService } from './session.service';

describe('SessionService', () => {
  beforeEach(() => sessionStorage.clear());

  it('starts without a session', () => {
    expect(TestBed.inject(SessionService).token()).toBeNull();
  });

  it('holds the access token in memory only, never in browser storage', () => {
    const session = TestBed.inject(SessionService);
    session.set('token-abc');
    expect(session.token()).toBe('token-abc');
    expect(sessionStorage.length).toBe(0);
    expect(localStorage.length).toBe(0);
  });

  it('keeps the name of the person with the session, for the avatar', () => {
    const session = TestBed.inject(SessionService);
    session.set('token-abc', 'Juan Ortiz');
    expect(session.name()).toBe('Juan Ortiz');
  });

  it('closes the session', () => {
    const session = TestBed.inject(SessionService);
    session.set('token-abc', 'Juan Ortiz');
    session.clear();
    expect(session.token()).toBeNull();
    expect(session.name()).toBeNull();
  });
});
