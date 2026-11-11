// Client-side authentication storage adapter for Supabase Auth
// Resilient to private browsing mode, disabled storage, and mobile WebViews

export const AUTH_STORAGE_KEY = 'veyra_auth_session';
export const REMEMBER_PREF_KEY = 'veyra_remember_pref';

// In-memory fallback if browser storage is blocked
const memoryStore = new Map();

export const authStorage = {
  isRemembered: () => {
    try {
      if (typeof window === 'undefined') return true;
      const pref = window.localStorage?.getItem(REMEMBER_PREF_KEY);
      // Default to persistent storage (true) unless explicitly set to 'false'
      return pref !== 'false';
    } catch {
      return true;
    }
  },

  setRememberPreference: (remember) => {
    try {
      if (typeof window === 'undefined') return;
      window.localStorage?.setItem(REMEMBER_PREF_KEY, remember ? 'true' : 'false');
    } catch {
      // Ignore if localStorage unavailable
    }
  },

  getItem: (key) => {
    try {
      if (typeof window === 'undefined') return memoryStore.get(key) || null;
      // Robust lookup: check localStorage first, then sessionStorage, then memory fallback
      return (
        window.localStorage?.getItem(key) ||
        window.sessionStorage?.getItem(key) ||
        memoryStore.get(key) ||
        null
      );
    } catch {
      return memoryStore.get(key) || null;
    }
  },

  setItem: (key, value) => {
    memoryStore.set(key, value);
    try {
      if (typeof window === 'undefined') return;
      const isRemembered = authStorage.isRemembered();
      if (isRemembered) {
        window.localStorage?.setItem(key, value);
        try { window.sessionStorage?.removeItem(key); } catch {}
      } else {
        window.sessionStorage?.setItem(key, value);
        try { window.localStorage?.removeItem(key); } catch {}
      }
    } catch {
      // In-memory fallback handles it
    }
  },

  removeItem: (key) => {
    memoryStore.delete(key);
    try {
      if (typeof window === 'undefined') return;
      try { window.localStorage?.removeItem(key); } catch {}
      try { window.sessionStorage?.removeItem(key); } catch {}
    } catch {}
  },

  migratePreference: (remember) => {
    try {
      if (typeof window === 'undefined') return;
      const currentVal = authStorage.getItem(AUTH_STORAGE_KEY);
      authStorage.setRememberPreference(remember);

      if (currentVal) {
        if (remember) {
          try { window.localStorage?.setItem(AUTH_STORAGE_KEY, currentVal); } catch {}
          try { window.sessionStorage?.removeItem(AUTH_STORAGE_KEY); } catch {}
        } else {
          try { window.sessionStorage?.setItem(AUTH_STORAGE_KEY, currentVal); } catch {}
          try { window.localStorage?.removeItem(AUTH_STORAGE_KEY); } catch {}
        }
      }
    } catch {}
  },
};

