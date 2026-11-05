import { Router } from 'express';
import { config } from '../config/env.js';
import { createClient } from '@supabase/supabase-js';

export const authRouter = Router();

function getAdminClient() {
  return createClient(config.supabase.url, config.supabase.serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

/**
 * POST /api/auth/check-email
 * Checks whether an account with the specified email exists.
 */
authRouter.post('/auth/check-email', async (req, res) => {
  const { email } = req.body;
  if (!email || typeof email !== 'string') {
    return res.status(400).json({
      error: {
        message: 'Valid email is required.',
        status: 400,
      },
    });
  }

  try {
    const supabaseAdmin = getAdminClient();
    const { data, error } = await supabaseAdmin.auth.admin.listUsers({
      page: 1,
      perPage: 1000,
    });

    if (error) throw error;

    const exists = Boolean(
      data?.users?.some(
        (u) => u.email?.toLowerCase() === email.trim().toLowerCase()
      )
    );

    return res.json({ exists });
  } catch (err) {
    return res.status(500).json({
      error: {
        message: err.message || 'Could not verify email.',
        status: 500,
      },
    });
  }
});

/**
 * POST /api/auth/resolve-identity
 * Resolves a username or email address to an active account email.
 */
authRouter.post('/auth/resolve-identity', async (req, res) => {
  const { identity } = req.body;
  if (!identity || typeof identity !== 'string') {
    return res.status(400).json({
      error: {
        message: 'Identity parameter is required.',
        status: 400,
      },
    });
  }

  try {
    const supabaseAdmin = getAdminClient();
    const clean = identity.trim().toLowerCase();

    if (clean.includes('@')) {
      const { data, error } = await supabaseAdmin.auth.admin.listUsers({
        page: 1,
        perPage: 1000,
      });

      if (error) throw error;

      const user = data?.users?.find(
        (u) => u.email?.toLowerCase() === clean
      );

      return res.json({
        exists: Boolean(user),
        email: user?.email || null,
        isSuspended: false,
      });
    }

    // Lookup profile by username
    const { data: profile, error: profErr } = await supabaseAdmin
      .from('profiles')
      .select('id, status')
      .eq('username', clean)
      .maybeSingle();

    if (profErr || !profile) {
      return res.json({ exists: false, email: null });
    }

    const { data: userData, error: userErr } = await supabaseAdmin.auth.admin.getUserById(profile.id);

    if (userErr || !userData?.user) {
      return res.json({ exists: false, email: null });
    }

    return res.json({
      exists: true,
      email: userData.user.email,
      isSuspended: profile.status === 'suspended',
    });
  } catch (err) {
    return res.status(500).json({
      error: {
        message: err.message || 'Could not resolve identity.',
        status: 500,
      },
    });
  }
});

