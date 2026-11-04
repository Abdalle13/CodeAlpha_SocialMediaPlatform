import { useState, useCallback, useRef } from 'react';
import { supabase, isSupabaseConfigured } from '../../lib/supabaseClient';
import { useAuth } from '../auth/AuthContext';

/**
 * usePostInteractions: manages like and save state for a single post.
 *
 * Accepts a post object that includes pre-fetched `likes` and `saved_posts`
 * arrays (as returned by the feed query). All mutations are optimistic with
 * rollback on failure, and double-click is guarded by in-flight flags.
 */
export function usePostInteractions(post) {
  const { user } = useAuth();

  // Derive initial state from the pre-fetched arrays on the post object.
  const userId = user?.id ?? null;

  const initialIsLiked = Boolean(
    post?.likes && userId && post.likes.some((l) => l.user_id === userId)
  );
  const initialLikeCount = post?.likes?.length ?? 0;
  const initialIsSaved = Boolean(
    post?.saved_posts && userId && post.saved_posts.some((s) => s.user_id === userId)
  );

  const [isLiked, setIsLiked] = useState(initialIsLiked);
  const [likeCount, setLikeCount] = useState(initialLikeCount);
  const [isSaved, setIsSaved] = useState(initialIsSaved);

  // In-flight guards prevent duplicate requests during optimistic update.
  const likePendingRef = useRef(false);
  const savePendingRef = useRef(false);

  /**
   * toggleLike: optimistically flips isLiked and adjusts likeCount.
   * Rolls back to the previous values on any database error.
   */
  const toggleLike = useCallback(async () => {
    if (!isSupabaseConfigured() || !user || !post?.id) return;
    if (likePendingRef.current) return;

    likePendingRef.current = true;

    const prevIsLiked = isLiked;
    const prevLikeCount = likeCount;

    // Optimistic update.
    setIsLiked(!prevIsLiked);
    setLikeCount((c) => (prevIsLiked ? Math.max(0, c - 1) : c + 1));

    try {
      if (prevIsLiked) {
        const { error } = await supabase
          .from('likes')
          .delete()
          .eq('user_id', user.id)
          .eq('post_id', post.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('likes')
          .insert({ user_id: user.id, post_id: post.id });

        if (error) throw error;
      }
    } catch {
      // Rollback on failure.
      setIsLiked(prevIsLiked);
      setLikeCount(prevLikeCount);
    } finally {
      likePendingRef.current = false;
    }
  }, [user, post, isLiked, likeCount]);

  /**
   * toggleSave: optimistically flips isSaved.
   * Rolls back on any database error.
   */
  const toggleSave = useCallback(async () => {
    if (!isSupabaseConfigured() || !user || !post?.id) return;
    if (savePendingRef.current) return;

    savePendingRef.current = true;

    const prevIsSaved = isSaved;

    // Optimistic update.
    setIsSaved(!prevIsSaved);

    try {
      if (prevIsSaved) {
        const { error } = await supabase
          .from('saved_posts')
          .delete()
          .eq('user_id', user.id)
          .eq('post_id', post.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('saved_posts')
          .insert({ user_id: user.id, post_id: post.id });

        if (error) throw error;
      }
    } catch {
      // Rollback on failure.
      setIsSaved(prevIsSaved);
    } finally {
      savePendingRef.current = false;
    }
  }, [user, post, isSaved]);

  return {
    isLiked,
    likeCount,
    isSaved,
    toggleLike,
    toggleSave,
  };
}

