import { createClient } from '@supabase/supabase-js';
import { config } from '../config/env.js';

let adminClient = null;

function getAdminClient() {
  if (!adminClient) {
    if (!config.supabase.url || !config.supabase.serviceRoleKey) {
      throw new Error('Supabase credentials are not configured on the server.');
    }
    adminClient = createClient(config.supabase.url, config.supabase.serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
  }
  return adminClient;
}

/**
 * requireAuth: Express middleware that verifies the Supabase session token.
 * 1. Reads the Bearer token from the Authorization header.
 * 2. Validates signature and expiration through Supabase Auth.
 * 3. Confirms the user profile is active (not suspended).
 * 4. Attaches verified user details to req.user.
 */
export async function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      error: { message: 'Authentication required.', status: 401 },
    });
  }

  const token = authHeader.slice(7).trim();
  if (!token) {
    return res.status(401).json({
      error: { message: 'Authentication required.', status: 401 },
    });
  }

  try {
    const supabase = getAdminClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return res.status(401).json({
        error: { message: 'Invalid or expired session.', status: 401 },
      });
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, username, display_name, role, status')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      return res.status(401).json({
        error: { message: 'User profile not found.', status: 401 },
      });
    }

    if (profile.status !== 'active') {
      return res.status(403).json({
        error: { message: 'Your account has been suspended.', status: 403 },
      });
    }

    req.user = {
      id: user.id,
      email: user.email,
      profile,
    };

    next();
  } catch (err) {
    return res.status(500).json({
      error: { message: 'Authentication verification failed.', status: 500 },
    });
  }
}

