import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase, isSupabaseConfigured } from '../../lib/supabaseClient';
import { authStorage } from '../../lib/authStorage';

const AuthContext = createContext(null);

const KNOWN_USERNAMES = {
  admin: 'admin@gmail.com',
  layla_studio: 'layla@veyra.social',
  zayd_visuals: 'zayd@veyra.social',
  hana_culinary: 'hana@veyra.social',
  tariq_tech: 'tariq@veyra.social',
  amina_wander: 'amina@veyra.social',
  khalid_fit: 'khalid@veyra.social',
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [configured, setConfigured] = useState(isSupabaseConfigured());

  useEffect(() => {
    let mounted = true;

    async function initAuth() {
      if (!isSupabaseConfigured()) {
        if (mounted) {
          setIsLoading(false);
          setConfigured(false);
        }
        return;
      }

      try {
        const { data: { session: initialSession }, error } = await supabase.auth.getSession();
        if (error) console.error('[Veyra Auth] Error getting session:', error.message);

        if (mounted) {
          setSession(initialSession);
          setUser(initialSession?.user ?? null);
          if (initialSession?.user) {
            fetchProfile(initialSession.user.id);
          } else {
            setIsLoading(false);
          }
        }
      } catch (err) {
        console.error('[Veyra Auth] Initialization error:', err);
        if (mounted) setIsLoading(false);
      }
    }

    initAuth();

    if (isSupabaseConfigured()) {
      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, newSession) => {
        if (!mounted) return;

        setSession(newSession);
        setUser(newSession?.user ?? null);

        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          if (newSession?.user) {
            await fetchProfile(newSession.user.id);
          }
        } else if (event === 'SIGNED_OUT') {
          setProfile(null);
          authStorage.removeItem('veyra_auth_session');
          setIsLoading(false);
        } else if (event === 'PASSWORD_RECOVERY') {
          setIsLoading(false);
        }
      });

      return () => {
        mounted = false;
        subscription.unsubscribe();
      };
    } else {
      return () => {
        mounted = false;
      };
    }
  }, []);

  async function fetchProfile(userId) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (!error && data) {
        setProfile(data);
      }
    } catch (err) {
      console.error('[Veyra Auth] Error fetching profile:', err);
    } finally {
      setIsLoading(false);
    }
  }

  const signIn = async (identity, password, rememberMe = false) => {
    if (!isSupabaseConfigured()) {
      throw new Error('Supabase project credentials are not configured in environment variables.');
    }

    const cleanIdentity = (identity || '').trim();
    if (!cleanIdentity) {
      throw new Error('Please enter your email address or username.');
    }
    if (!password) {
      throw new Error('Please enter your password.');
    }

    authStorage.setRememberPreference(rememberMe);

    let resolvedEmail = cleanIdentity;
    let identityVerified = false;

    // 1. Try resolving identity via secure database RPC
    try {
      const { data: rpcRes, error: rpcErr } = await supabase.rpc('resolve_login_identity', {
        p_identity: cleanIdentity,
      });

      if (!rpcErr && rpcRes) {
        if (!rpcRes.exists) {
          if (cleanIdentity.includes('@')) {
            throw new Error('No account found with this email address. Please check your spelling or sign up.');
          } else {
            throw new Error(`No account found with username "${cleanIdentity}". Please check your handle or sign up.`);
          }
        }

        if (rpcRes.is_suspended) {
          throw new Error('This account has been suspended for violating community guidelines.');
        }

        if (rpcRes.email) {
          resolvedEmail = rpcRes.email;
          identityVerified = true;
        }
      }
    } catch (rpcCatch) {
      if (
        rpcCatch.message &&
        (rpcCatch.message.startsWith('No account found') || rpcCatch.message.startsWith('This account'))
      ) {
        throw rpcCatch;
      }
    }

    // 2. Try resolving via backend Express API if not yet verified
    if (!identityVerified && !cleanIdentity.includes('@')) {
      try {
        const apiBase = import.meta.env.VITE_API_BASE_URL || (import.meta.env.PROD ? '/api' : 'http://localhost:5000/api');
        const res = await fetch(`${apiBase}/auth/resolve-identity`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ identity: cleanIdentity }),
        });
        const json = await res.json().catch(() => null);
        if (json && json.exists && json.email) {
          resolvedEmail = json.email;
          identityVerified = true;
        } else if (json && json.exists === false) {
          throw new Error(`No account found with username "${cleanIdentity}". Please check your handle or sign up.`);
        }
      } catch (apiCatch) {
        if (apiCatch.message && apiCatch.message.startsWith('No account found')) {
          throw apiCatch;
        }
      }
    }

    // 3. Fallback to known seed handles dictionary (e.g. admin -> admin@gmail.com)
    if (!identityVerified && !cleanIdentity.includes('@')) {
      const lower = cleanIdentity.toLowerCase();
      if (KNOWN_USERNAMES[lower]) {
        resolvedEmail = KNOWN_USERNAMES[lower];
        identityVerified = true;
      }
    }

    // 4. If still not an email format, check profile table or ask for full email
    if (!resolvedEmail.includes('@')) {
      const { data: profileData } = await supabase
        .from('profiles')
        .select('id, status')
        .eq('username', cleanIdentity.toLowerCase())
        .maybeSingle();

      if (!profileData) {
        throw new Error(`No account found with username "${cleanIdentity}". Please check your handle or sign up.`);
      }

      throw new Error(`Please sign in with your full email address for account "${cleanIdentity}".`);
    }

    // 5. Perform Supabase authentication
    const { data, error } = await supabase.auth.signInWithPassword({
      email: resolvedEmail,
      password,
    });

    if (error) {
      if (error.message === 'Invalid login credentials') {
        throw new Error('Incorrect password. Please check your password and try again.');
      }

      if (error.message.toLowerCase().includes('email not confirmed')) {
        throw new Error('Please confirm your email address before signing in.');
      }

      throw new Error(error.message);
    }

    return data;
  };

  const signUp = async ({ email, password, username, displayName }) => {
    if (!isSupabaseConfigured()) {
      throw new Error('Supabase project credentials are not configured in environment variables.');
    }

    // Check if username is already taken before signing up
    const { data: existingUser } = await supabase
      .from('profiles')
      .select('id')
      .eq('username', username.toLowerCase())
      .single();

    if (existingUser) {
      throw new Error('This username is already taken.');
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          username: username.toLowerCase(),
          display_name: displayName,
        },
      },
    });

    if (error) throw error;
    return data;
  };

  const signOut = async () => {
    if (isSupabaseConfigured()) {
      await supabase.auth.signOut();
    }
    authStorage.removeItem('veyra_auth_session');
    setUser(null);
    setSession(null);
    setProfile(null);
  };

  const resetPasswordForEmail = async (email) => {
    if (!isSupabaseConfigured()) {
      throw new Error('Supabase project credentials are not configured in environment variables.');
    }

    const redirectUrl = `${window.location.origin}/reset-password`;
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: redirectUrl,
    });

    if (error) throw error;
    return data;
  };

  const updatePassword = async (newPassword) => {
    if (!isSupabaseConfigured()) {
      throw new Error('Supabase project credentials are not configured in environment variables.');
    }

    const { data, error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) throw error;
    return data;
  };

  const value = {
    user,
    session,
    profile,
    isLoading,
    isConfigured: configured,
    signIn,
    signUp,
    signOut,
    resetPasswordForEmail,
    updatePassword,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
