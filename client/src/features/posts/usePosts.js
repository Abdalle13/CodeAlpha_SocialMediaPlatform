import { useState, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '../../lib/supabaseClient';
import { useAuth } from '../auth/AuthContext';
import { uploadToImageKit, deleteFromImageKit } from '../media/imagekit';

const PAGE_SIZE = 12;

const POST_WITH_MEDIA_SELECT = '*, post_media(*)';

export function usePosts() {
  const { user } = useAuth();
  const [isCreating, setIsCreating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState(null);

  /**
   * createPost: inserts a post row, uploads any media files to ImageKit,
   * then inserts post_media rows. Returns the created post on success.
   */
  const createPost = useCallback(
    async (caption, visibility = 'public', mediaFiles = []) => {
      if (!isSupabaseConfigured() || !user) {
        throw new Error('Authentication required to create a post.');
      }

      if (caption && caption.length > 2000) {
        throw new Error('Caption cannot exceed 2000 characters.');
      }

      if (!['public', 'followers'].includes(visibility)) {
        throw new Error('Visibility must be public or followers.');
      }

      setIsCreating(true);
      setError(null);

      try {
        // 1. Insert the post row.
        const { data: post, error: insertErr } = await supabase
          .from('posts')
          .insert({
            author_id: user.id,
            caption: caption || null,
            visibility,
            status: 'active',
          })
          .select('*')
          .single();

        if (insertErr) throw insertErr;

        // 2. Upload media files and insert post_media rows.
        if (mediaFiles.length > 0) {
          const uploadedMedia = await Promise.all(
            mediaFiles.map((file, index) =>
              uploadToImageKit(file, { folder: '/veyra/posts' }).then((result) => ({
                post_id: post.id,
                url: result.url,
                file_id: result.fileId,
                width: result.width || null,
                height: result.height || null,
                mime_type: file.type,
                size_bytes: file.size,
                position: index,
              }))
            )
          );

          const { error: mediaErr } = await supabase
            .from('post_media')
            .insert(uploadedMedia);

          if (mediaErr) {
            // Best-effort cleanup: soft-delete the post so it does not appear.
            await supabase
              .from('posts')
              .update({ status: 'deleted' })
              .eq('id', post.id);
            throw mediaErr;
          }
        }

        return post;
      } catch (err) {
        const message = err.message || 'Could not create post.';
        setError(message);
        throw new Error(message);
      } finally {
        setIsCreating(false);
      }
    },
    [user]
  );

  /**
   * updatePost: updates caption and/or visibility of an owned post.
   * RLS enforces ownership; the author_id check here is an early guard.
   */
  const updatePost = useCallback(
    async (postId, { caption, visibility } = {}) => {
      if (!isSupabaseConfigured() || !user) {
        throw new Error('Authentication required to edit a post.');
      }

      if (caption !== undefined && caption.length > 2000) {
        throw new Error('Caption cannot exceed 2000 characters.');
      }

      if (visibility !== undefined && !['public', 'followers'].includes(visibility)) {
        throw new Error('Visibility must be public or followers.');
      }

      setError(null);

      const updates = {};
      if (caption !== undefined) updates.caption = caption;
      if (visibility !== undefined) updates.visibility = visibility;
      updates.updated_at = new Date().toISOString();

      const { data, error: updateErr } = await supabase
        .from('posts')
        .update(updates)
        .eq('id', postId)
        .eq('author_id', user.id)
        .select('*')
        .single();

      if (updateErr) {
        const message = updateErr.message || 'Could not update post.';
        setError(message);
        throw new Error(message);
      }

      return data;
    },
    [user]
  );

  /**
   * deletePost: soft-deletes a post (status = 'deleted') and removes
   * all associated ImageKit media assets.
   */
  const deletePost = useCallback(
    async (postId) => {
      if (!isSupabaseConfigured() || !user) {
        throw new Error('Authentication required to delete a post.');
      }

      setIsDeleting(true);
      setError(null);

      try {
        // Fetch associated media file IDs so we can clean up ImageKit.
        const { data: media } = await supabase
          .from('post_media')
          .select('file_id')
          .eq('post_id', postId);

        // Soft-delete the post. RLS enforces author_id = auth.uid().
        const { error: deleteErr } = await supabase
          .from('posts')
          .update({ status: 'deleted', updated_at: new Date().toISOString() })
          .eq('id', postId)
          .eq('author_id', user.id);

        if (deleteErr) throw deleteErr;

        // Remove ImageKit assets. Failures are logged but do not block the
        // soft-delete which already hides the post from all users.
        if (media && media.length > 0) {
          await Promise.allSettled(
            media.map((m) => deleteFromImageKit(m.file_id))
          );
        }

        return true;
      } catch (err) {
        const message = err.message || 'Could not delete post.';
        setError(message);
        throw new Error(message);
      } finally {
        setIsDeleting(false);
      }
    },
    [user]
  );

  /**
   * fetchUserPosts: paged fetch of a user's active posts with media.
   * Returns { posts, hasMore }.
   */
  const fetchUserPosts = useCallback(async (userId, cursor = null) => {
    if (!isSupabaseConfigured()) {
      return { posts: [], hasMore: false };
    }

    let query = supabase
      .from('posts')
      .select(POST_WITH_MEDIA_SELECT)
      .eq('author_id', userId)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(PAGE_SIZE);

    if (cursor) {
      query = query.lt('created_at', cursor);
    }

    const { data, error: fetchError } = await query;

    if (fetchError) {
      throw new Error(fetchError.message || 'Could not fetch posts.');
    }

    const rows = data || [];
    return {
      posts: rows,
      hasMore: rows.length === PAGE_SIZE,
    };
  }, []);

  return {
    isCreating,
    isDeleting,
    error,
    createPost,
    updatePost,
    deletePost,
    fetchUserPosts,
  };
}

