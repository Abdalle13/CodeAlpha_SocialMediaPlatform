// Client-side authentication storage adapter for Supabase Auth
// Handles explicit Remember Me persistence:
// - Checked: Persists in localStorage across browser restarts
// - Unchecked: Scoped to sessionStorage (cleared upon tab/window closure)

export const AUTH_STORAGE_KEY = 'veyra_auth_session';
export const REMEMBER_PREF_KEY = 'veyra_remember_pref';

export const authStorage = {
  isRemembered: () => {
    if (typeof window === 'undefined') return false;
    return window.localStorage.getItem(REMEMBER_PREF_KEY) === 'true';
  },

  setRememberPreference: (remember) => {
    if (typeof window === 'undefined') return;
    if (remember) {
      window.localStorage.setItem(REMEMBER_PREF_KEY, 'true');
    } else {
      window.localStorage.removeItem(REMEMBER_PREF_KEY);
    }
  },

  getItem: (key) => {
    if (typeof window === 'undefined') return null;
    const isRemembered = window.localStorage.getItem(REMEMBER_PREF_KEY) === 'true';
    if (isRemembered) {
      return window.localStorage.getItem(key);
    }
    return window.sessionStorage.getItem(key);
  },

  setItem: (key, value) => {
    if (typeof window === 'undefined') return;
    const isRemembered = window.localStorage.getItem(REMEMBER_PREF_KEY) === 'true';
    if (isRemembered) {
      window.localStorage.setItem(key, value);
      window.sessionStorage.removeItem(key); // Ensure no stale duplicate in session store
    } else {
      window.sessionStorage.setItem(key, value);
      window.localStorage.removeItem(key); // Ensure no stale duplicate in local store
    }
  },

  removeItem: (key) => {
    if (typeof window === 'undefined') return;
    // Always clean both stores on removal/logout
    window.localStorage.removeItem(key);
    window.sessionStorage.removeItem(key);
  },

  /**
   * Atomic migration helper for switching preferences while an active session exists.
   * Avoids session loss and eliminates duplicate tokens.
   */
  migratePreference: (remember) => {
    if (typeof window === 'undefined') return;
    const currentVal = authStorage.getItem(AUTH_STORAGE_KEY);

    authStorage.setRememberPreference(remember);

    if (currentVal) {
      if (remember) {
        window.localStorage.setItem(AUTH_STORAGE_KEY, currentVal);
        window.sessionStorage.removeItem(AUTH_STORAGE_KEY);
      } else {
        window.sessionStorage.setItem(AUTH_STORAGE_KEY, currentVal);
        window.localStorage.removeItem(AUTH_STORAGE_KEY);
      }
    }
  },
};
