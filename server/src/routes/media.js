import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { getImageKit, isImageKitConfigured } from '../config/imagekit.js';
import { config } from '../config/env.js';
import { createClient } from '@supabase/supabase-js';

export const mediaRouter = Router();

function getAdminClient() {
  return createClient(config.supabase.url, config.supabase.serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

/**
 * POST /api/media/imagekit-auth
 * Generates temporary client authentication parameters for direct browser upload.
 * Requires an active, authenticated user session.
 */
mediaRouter.post('/media/imagekit-auth', requireAuth, (req, res) => {
  if (!isImageKitConfigured()) {
    return res.status(503).json({
      error: {
        message: 'Image storage is not configured on this server.',
        status: 503,
      },
    });
  }

  try {
    const ik = getImageKit();
    const authParams = ik.getAuthenticationParameters();

    return res.json({
      token: authParams.token,
      expire: authParams.expire,
      signature: authParams.signature,
      publicKey: config.imagekit.publicKey,
    });
  } catch (err) {
    return res.status(500).json({
      error: {
        message: 'Failed to generate upload authorization parameters.',
        status: 500,
      },
    });
  }
});

/**
 * DELETE /api/media/:fileId
 * Deletes a file from ImageKit after confirming the requesting user owns the asset.
 */
mediaRouter.delete('/media/:fileId', requireAuth, async (req, res) => {
  const { fileId } = req.params;
  const userId = req.user.id;

  if (!fileId) {
    return res.status(400).json({
      error: { message: 'Asset identifier is required.', status: 400 },
    });
  }

  if (!isImageKitConfigured()) {
    return res.status(503).json({
      error: { message: 'Image storage is not configured on this server.', status: 503 },
    });
  }

  try {
    const supabase = getAdminClient();

    // Verify caller owns this asset as their avatar or cover
    const { data: profile } = await supabase
      .from('profiles')
      .select('id, avatar_file_id, cover_file_id')
      .eq('id', userId)
      .single();

    const ownsProfileAsset =
      profile && (profile.avatar_file_id === fileId || profile.cover_file_id === fileId);

    if (!ownsProfileAsset) {
      return res.status(403).json({
        error: { message: 'You do not have permission to delete this asset.', status: 403 },
      });
    }

    const ik = getImageKit();
    await ik.deleteFile(fileId);

    // Clear matching profile references
    const updates = {};
    if (profile.avatar_file_id === fileId) {
      updates.avatar_url = null;
      updates.avatar_file_id = null;
    }
    if (profile.cover_file_id === fileId) {
      updates.cover_url = null;
      updates.cover_file_id = null;
    }

    if (Object.keys(updates).length > 0) {
      await supabase.from('profiles').update(updates).eq('id', userId);
    }

    return res.json({ success: true, message: 'Asset deleted successfully.' });
  } catch (err) {
    return res.status(500).json({
      error: { message: 'Asset deletion failed.', status: 500 },
    });
  }
});

