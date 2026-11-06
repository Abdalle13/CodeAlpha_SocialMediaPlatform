// Vercel Serverless Function: POST /api/auth/resolve-identity
// Resolves a username or email to an authenticated Supabase account email.
import { createClient } from '@supabase/supabase-js';

function getSupabaseAdmin() {
  return createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') {
    return res.status(405).json({ error: { message: 'Method not allowed', status: 405 } });
  }

  const { identity } = req.body || {};
  if (!identity || typeof identity !== 'string') {
    return res.status(400).json({ error: { message: 'Identity parameter is required.', status: 400 } });
  }

  try {
    const supabaseAdmin = getSupabaseAdmin();
    const clean = identity.trim().toLowerCase();

    // Look up profile by username
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('id, status')
      .eq('username', clean)
      .maybeSingle();

    if (!profile) {
      return res.json({ exists: false, email: null });
    }

    const { data: userData } = await supabaseAdmin.auth.admin.getUserById(profile.id);
    if (!userData?.user) {
      return res.json({ exists: false, email: null });
    }

    return res.json({
      exists: true,
      email: userData.user.email,
      isSuspended: profile.status === 'suspended',
    });
  } catch (err) {
    return res.status(500).json({ error: { message: err.message || 'Could not resolve identity.', status: 500 } });
  }
}
