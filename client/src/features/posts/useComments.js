import { useState, useCallback, useRef } from 'react';
import { supabase, isSupabaseConfigured } from '../../lib/supabaseClient';
import { useAuth } from '../auth/AuthContext';

const PAGE_SIZE = 20;

const COMMENT_SELECT =
  '*, profiles(id, username, display_name, avatar_url)';

export function useComments(postId) {
  const { user } = useAuth();
  const [comments, setComments] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [error, setError] = useState(null);

  // Cursor is the created_at of the last comment loaded.
  const cursorRef = useRef(null);
  const fetchingRef = useRef(false);

  /**
   * fetchComments: loads the first page of top-level active comments
   * for the post, ordered oldest-first. Replaces current list.
   */
  const fetchComments = useCallback(async () => {
    if (!isSupabaseConfigured() || !postId) return;
    if (fetchingRef.current) return;

    fetchingRef.current = true;
    setIsLoading(true);
    setError(null);
    cursorRef.current = null;

    try {
      const { data, error: fetchError } = await supabase
        .from('comments')
        .select(COMMENT_SELECT)
        .eq('post_id', postId)
        .is('parent_id', null)
        .eq('status', 'active')
        .order('created_at', { ascending: true })
        .limit(PAGE_SIZE);

      if (fetchError) throw fetchError;

      const rows = data || [];
      setComments(rows);
      setHasMore(rows.length === PAGE_SIZE);

      if (rows.length > 0) {
        cursorRef.current = rows[rows.length - 1].created_at;
      }
    } catch (err) {
      setError(err.message || 'Could not load comments.');
    } finally {
      setIsLoading(false);
      fetchingRef.current = false;
    }
  }, [postId]);

  /**
   * fetchMoreComments: appends the next page to the comment list.
   */
  const fetchMoreComments = useCallback(async () => {
    if (!isSupabaseConfigured() || !postId || !hasMore || fetchingRef.current) return;
    if (!cursorRef.current) return;

    fetchingRef.current = true;
    setIsLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from('comments')
        .select(COMMENT_SELECT)
        .eq('post_id', postId)
        .is('parent_id', null)
        .eq('status', 'active')
        .gt('created_at', cursorRef.current)
        .order('created_at', { ascending: true })
        .limit(PAGE_SIZE);

      if (fetchError) throw fetchError;

      const rows = data || [];
      setComments((prev) => [...prev, ...rows]);
      setHasMore(rows.length === PAGE_SIZE);

      if (rows.length > 0) {
        cursorRef.current = rows[rows.length - 1].created_at;
      }
    } catch (err) {
      setError(err.message || 'Could not load more comments.');
    } finally {
      setIsLoading(false);
      fetchingRef.current = false;
    }
  }, [postId, hasMore]);

  /**
   * fetchReplies: fetches all active replies for a given top-level comment.
   * Returns the reply array directly (caller manages its own state).
   */
  const fetchReplies = useCallback(async (commentId) => {
    if (!isSupabaseConfigured() || !commentId) return [];

    const { data, error: fetchError } = await supabase
      .from('comments')
      .select(COMMENT_SELECT)
      .eq('parent_id', commentId)
      .eq('status', 'active')
      .order('created_at', { ascending: true });

    if (fetchError) {
      throw new Error(fetchError.message || 'Could not load replies.');
    }

    return data || [];
  }, []);

  /**
   * addComment: optimistically prepends the new comment, inserts to Supabase,
   * then replaces the temp row with the real database row on success.
   * Rolls back to the snapshot on any failure.
   */
  const addComment = useCallback(
    async (body, parentId = null) => {
      if (!isSupabaseConfigured() || !user) {
        throw new Error('Authentication required to comment.');
      }

      if (!body || body.trim().length === 0) {
        throw new Error('Comment cannot be empty.');
      }

      if (body.trim().length > 1000) {
        throw new Error('Comment cannot exceed 1000 characters.');
      }

      setIsSubmitting(true);
      setError(null);

      // Snapshot for rollback.
      const snapshot = comments;

      // Optimistic comment with a temporary id so the UI can render it
      // immediately while the insert is in flight.
      const tempId = `temp-${Date.now()}`;
      const optimisticComment = {
        id: tempId,
        post_id: postId,
        author_id: user.id,
        body: body.trim(),
        parent_id: parentId,
        status: 'active',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        profiles: null, // Not available until DB round-trip.
        _isOptimistic: true,
      };

      // Only add to the visible list when it is a top-level comment.
      if (!parentId) {
        setComments((prev) => [...prev, optimisticComment]);
      }

      try {
        const { data, error: insertErr } = await supabase
          .from('comments')
          .insert({
            post_id: postId,
            author_id: user.id,
            body: body.trim(),
            parent_id: parentId || null,
            status: 'active',
          })
          .select(COMMENT_SELECT)
          .single();

        if (insertErr) throw insertErr;

        // Replace optimistic row with real row (top-level only).
        if (!parentId) {
          setComments((prev) =>
            prev.map((c) => (c.id === tempId ? data : c))
          );
        }

        return data;
      } catch (err) {
        // Rollback on failure.
        setComments(snapshot);
        const message = err.message || 'Could not post comment.';
        setError(message);
        throw new Error(message);
      } finally {
        setIsSubmitting(false);
      }
    },
    [user, postId, comments]
  );

  /**
   * deleteComment: soft-deletes a comment and removes it from local state.
   * Rolls back if the server call fails.
   */
  const deleteComment = useCallback(
    async (commentId) => {
      if (!isSupabaseConfigured() || !user) {
        throw new Error('Authentication required to delete a comment.');
      }

      const snapshot = comments;

      // Optimistically remove from list.
      setComments((prev) => prev.filter((c) => c.id !== commentId));

      try {
        const { error: updateErr } = await supabase
          .from('comments')
          .update({ status: 'deleted', updated_at: new Date().toISOString() })
          .eq('id', commentId);

        // RLS enforces that only the author or post author can soft-delete.
        if (updateErr) throw updateErr;
      } catch (err) {
        setComments(snapshot);
        const message = err.message || 'Could not delete comment.';
        setError(message);
        throw new Error(message);
      }
    },
    [user, comments]
  );

  return {
    comments,
    isLoading,
    isSubmitting,
    hasMore,
    error,
    fetchComments,
    fetchMoreComments,
    fetchReplies,
    addComment,
    deleteComment,
  };
}

