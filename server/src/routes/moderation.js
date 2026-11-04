import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { config } from '../config/env.js';
import { createClient } from '@supabase/supabase-js';

export const moderationRouter = Router();

function getAdminClient() {
  return createClient(config.supabase.url, config.supabase.serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

/**
 * Middleware: requireAdmin
 * Validates that the authenticated caller exists in public.admin_users
 */
async function requireAdmin(req, res, next) {
  const supabaseAdmin = getAdminClient();
  const { data: adminRecord, error } = await supabaseAdmin
    .from('admin_users')
    .select('user_id')
    .eq('user_id', req.user.id)
    .maybeSingle();

  if (error || !adminRecord) {
    return res.status(403).json({
      error: {
        message: 'Access denied: Administrator privileges required.',
        status: 403,
      },
    });
  }

  next();
}

/**
 * POST /api/moderation/action
 * Executes an audited moderation action (suspend_user, reactivate_user, hide_post, restore_post)
 */
moderationRouter.post('/moderation/action', requireAuth, requireAdmin, async (req, res) => {
  const { action, targetType, targetId, reason, metadata = {} } = req.body;

  const validActions = ['suspend_user', 'reactivate_user', 'hide_post', 'restore_post'];
  if (!action || !validActions.includes(action)) {
    return res.status(400).json({
      error: {
        message: 'Invalid moderation action specified.',
        status: 400,
      },
    });
  }

  if (!targetType || !targetId || !reason) {
    return res.status(400).json({
      error: {
        message: 'targetType, targetId, and reason are required.',
        status: 400,
      },
    });
  }

  try {
    const supabaseAdmin = getAdminClient();
    const { error: rpcErr } = await supabaseAdmin.rpc('execute_admin_moderation', {
      p_actor_admin_id: req.user.id,
      p_action: action,
      p_target_type: targetType,
      p_target_id: targetId,
      p_reason: reason,
      p_metadata: metadata,
    });

    if (rpcErr) throw rpcErr;

    return res.json({
      success: true,
      action,
      targetId,
      message: `Moderation action '${action}' completed successfully.`,
    });
  } catch (err) {
    console.error('Moderation action failed:', err);
    return res.status(500).json({
      error: {
        message: err.message || 'Failed to execute moderation action.',
        status: 500,
      },
    });
  }
});

/**
 * GET /api/moderation/reports
 * Returns list of open and resolved reports with reporter profiles
 */
moderationRouter.get('/moderation/reports', requireAuth, requireAdmin, async (req, res) => {
  try {
    const supabaseAdmin = getAdminClient();
    const { data: reports, error } = await supabaseAdmin
      .from('reports')
      .select(`
        id,
        reporter_id,
        target_type,
        target_id,
        reason,
        details,
        status,
        created_at,
        updated_at,
        reporter:profiles!reporter_id (
          id,
          username,
          display_name,
          avatar_url
        )
      `)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) throw error;

    return res.json({ reports: reports || [] });
  } catch (err) {
    return res.status(500).json({
      error: {
        message: err.message || 'Could not fetch reports.',
        status: 500,
      },
    });
  }
});

/**
 * POST /api/moderation/reports/:reportId/status
 * Updates report status (resolved or dismissed)
 */
moderationRouter.post('/moderation/reports/:reportId/status', requireAuth, requireAdmin, async (req, res) => {
  const { reportId } = req.params;
  const { status } = req.body;

  if (!['open', 'resolved', 'dismissed'].includes(status)) {
    return res.status(400).json({
      error: {
        message: 'Status must be open, resolved, or dismissed.',
        status: 400,
      },
    });
  }

  try {
    const supabaseAdmin = getAdminClient();
    const { data, error } = await supabaseAdmin
      .from('reports')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', reportId)
      .select('*')
      .single();

    if (error) throw error;

    return res.json({ success: true, report: data });
  } catch (err) {
    return res.status(500).json({
      error: {
        message: err.message || 'Could not update report status.',
        status: 500,
      },
    });
  }
});
