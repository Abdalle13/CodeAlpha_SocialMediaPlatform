import { describe, it, expect, beforeEach } from 'vitest';
import { authStorage, AUTH_STORAGE_KEY, REMEMBER_PREF_KEY } from '../lib/authStorage';

describe('Remember Me Storage Adapter & Race-Condition Migration', () => {
  beforeEach(() => {
    window.localStorage.clear();
    window.sessionStorage.clear();
  });

  it('stores session in sessionStorage when Remember Me is not selected', () => {
    authStorage.setRememberPreference(false);
    expect(authStorage.isRemembered()).toBe(false);

    authStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify({ token: 'test-token-session' }));

    expect(window.sessionStorage.getItem(AUTH_STORAGE_KEY)).toContain('test-token-session');
    expect(window.localStorage.getItem(AUTH_STORAGE_KEY)).toBeNull();
    expect(authStorage.getItem(AUTH_STORAGE_KEY)).toContain('test-token-session');
  });

  it('stores session in localStorage when Remember Me is selected', () => {
    authStorage.setRememberPreference(true);
    expect(authStorage.isRemembered()).toBe(true);

    authStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify({ token: 'test-token-persistent' }));

    expect(window.localStorage.getItem(AUTH_STORAGE_KEY)).toContain('test-token-persistent');
    expect(window.sessionStorage.getItem(AUTH_STORAGE_KEY)).toBeNull();
    expect(authStorage.getItem(AUTH_STORAGE_KEY)).toContain('test-token-persistent');
  });

  it('atomically migrates session from sessionStorage to localStorage when toggling preference to true', () => {
    // 1. Initial login without Remember Me
    authStorage.setRememberPreference(false);
    authStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify({ access_token: 'active-jwt-123' }));
    expect(window.sessionStorage.getItem(AUTH_STORAGE_KEY)).toBeTruthy();
    expect(window.localStorage.getItem(AUTH_STORAGE_KEY)).toBeNull();

    // 2. User toggles Remember Me in account settings
    authStorage.migratePreference(true);

    // 3. Verify token moved to localStorage, purged from sessionStorage, and preference updated
    expect(authStorage.isRemembered()).toBe(true);
    expect(window.localStorage.getItem(AUTH_STORAGE_KEY)).toContain('active-jwt-123');
    expect(window.sessionStorage.getItem(AUTH_STORAGE_KEY)).toBeNull();
  });

  it('atomically migrates session from localStorage to sessionStorage when toggling preference to false', () => {
    // 1. Initial login with Remember Me
    authStorage.setRememberPreference(true);
    authStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify({ access_token: 'active-jwt-456' }));
    expect(window.localStorage.getItem(AUTH_STORAGE_KEY)).toBeTruthy();
    expect(window.sessionStorage.getItem(AUTH_STORAGE_KEY)).toBeNull();

    // 2. User unchecks Remember Me in account settings
    authStorage.migratePreference(false);

    // 3. Verify token moved to sessionStorage, purged from localStorage
    expect(authStorage.isRemembered()).toBe(false);
    expect(window.sessionStorage.getItem(AUTH_STORAGE_KEY)).toContain('active-jwt-456');
    expect(window.localStorage.getItem(AUTH_STORAGE_KEY)).toBeNull();
  });

  it('purges session tokens from both localStorage and sessionStorage upon logout', () => {
    window.localStorage.setItem(AUTH_STORAGE_KEY, 'stale-local');
    window.sessionStorage.setItem(AUTH_STORAGE_KEY, 'stale-session');

    authStorage.removeItem(AUTH_STORAGE_KEY);

    expect(window.localStorage.getItem(AUTH_STORAGE_KEY)).toBeNull();
    expect(window.sessionStorage.getItem(AUTH_STORAGE_KEY)).toBeNull();
  });
});
