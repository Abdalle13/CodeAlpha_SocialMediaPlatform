import { supabase } from './supabaseClient';

const FALLBACK_API_URL = 'https://veyra-nine-eosin.vercel.app/api';
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || (import.meta.env.PROD ? '/api' : FALLBACK_API_URL);

/**
 * apiClient: fetch wrapper that automatically attaches the active Supabase JWT
 * to the Authorization header when talking to the Express backend.
 * Features automatic failover to the production Vercel API on network issues.
 */
export async function apiClient(endpoint, options = {}) {
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token;

  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const url = `${API_BASE_URL}${cleanEndpoint}`;

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (response.status === 404 || !response.ok) {
      // If primary endpoint returned an error and isn't already the direct fallback, try Vercel API
      if (!url.startsWith(FALLBACK_API_URL)) {
        const fallbackUrl = `${FALLBACK_API_URL}${cleanEndpoint}`;
        const fallbackRes = await fetch(fallbackUrl, {
          ...options,
          headers,
        });
        const fallbackData = await fallbackRes.json().catch(() => ({}));
        if (!fallbackRes.ok) {
          const error = new Error(fallbackData?.error?.message || `Request failed with status ${fallbackRes.status}`);
          error.status = fallbackRes.status;
          error.data = fallbackData;
          throw error;
        }
        return fallbackData;
      }
    }

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      const error = new Error(data?.error?.message || `Request failed with status ${response.status}`);
      error.status = response.status;
      error.data = data;
      throw error;
    }

    return data;
  } catch (err) {
    if (err.status) throw err;

    // Retry against direct Vercel API if network error occurred and we weren't already hitting it
    if (!url.startsWith(FALLBACK_API_URL)) {
      try {
        const fallbackUrl = `${FALLBACK_API_URL}${cleanEndpoint}`;
        const fallbackRes = await fetch(fallbackUrl, {
          ...options,
          headers,
        });
        const fallbackData = await fallbackRes.json().catch(() => ({}));
        if (!fallbackRes.ok) {
          const error = new Error(fallbackData?.error?.message || `Request failed with status ${fallbackRes.status}`);
          error.status = fallbackRes.status;
          error.data = fallbackData;
          throw error;
        }
        return fallbackData;
      } catch (fallbackErr) {
        throw fallbackErr;
      }
    }

    throw err;
  }
}
