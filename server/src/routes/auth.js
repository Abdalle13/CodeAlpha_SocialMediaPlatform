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
