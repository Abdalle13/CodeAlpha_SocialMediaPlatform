// Vercel Serverless Function: POST /api/moderation/action
// Executes an audited admin moderation action (requires admin privileges).
import { createClient } from '@supabase/supabase-js';

function getSupabaseAdmin() {
  return createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

async function getCallerUser(authHeader) {
  if (!authHeader?.startsWith('Bearer ')) return null;
  const token = authHeader.replace('Bearer ', '');
  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY
  );
  const { data: { user } } = await supabase.auth.getUser(token);
  return user;
}

async function requireAdmin(userId) {
  const admin = getSupabaseAdmin();
  const { data } = await admin.from('admin_users').select('user_id').eq('user_id', userId).maybeSingle();
  return Boolean(data);
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const user = await getCallerUser(req.headers.authorization).catch(() => null);
  if (!user) return res.status(401).json({ error: { message: 'Authentication required.', status: 401 } });

  const isAdmin = await requireAdmin(user.id).catch(() => false);
  if (!isAdmin) return res.status(403).json({ error: { message: 'Administrator privileges required.', status: 403 } });

  const supabaseAdmin = getSupabaseAdmin();

  // GET /api/moderation/action -> returns reports
  if (req.method === 'GET') {
    const { data: reports, error } = await supabaseAdmin
      .from('reports')
      .select('id, reporter_id, target_type, target_id, reason, details, status, created_at, reporter:profiles!reporter_id(id, username, display_name, avatar_url)')
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) return res.status(500).json({ error: { message: error.message, status: 500 } });
    return res.json({ reports: reports || [] });
  }

  // POST /api/moderation/action -> execute action
  if (req.method === 'POST') {
    const { action, targetType, targetId, reason, metadata = {} } = req.body || {};
    const validActions = ['suspend_user', 'reactivate_user', 'hide_post', 'restore_post'];

    if (!action || !validActions.includes(action) || !targetType || !targetId || !reason) {
      return res.status(400).json({ error: { message: 'action, targetType, targetId, and reason are required.', status: 400 } });
    }

    try {
      const { error: rpcErr } = await supabaseAdmin.rpc('execute_admin_moderation', {
        p_actor_admin_id: user.id,
        p_action: action,
        p_target_type: targetType,
        p_target_id: targetId,
        p_reason: reason,
        p_metadata: metadata,
      });
      if (rpcErr) throw rpcErr;
      return res.json({ success: true, action, targetId, message: `Action '${action}' completed.` });
    } catch (err) {
      return res.status(500).json({ error: { message: err.message || 'Moderation action failed.', status: 500 } });
    }
  }

  return res.status(405).json({ error: { message: 'Method not allowed', status: 405 } });
}

