import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase, isSupabaseConfigured } from '../../lib/supabaseClient';
import { useAuth } from '../auth/AuthContext';

const PAGE_SIZE = 15;

// Selects all post fields plus related profile, media, likes, and saves so
// the feed card has everything it needs in a single query.
const FEED_SELECT =
  '*, profiles(id, username, display_name, avatar_url), post_media(*), likes(user_id), saved_posts(user_id)';

export function useFeed() {
  const { user } = useAuth();
  const [posts, setPosts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [error, setError] = useState(null);

  // Cursor is the created_at timestamp of the last loaded post.
  const cursorRef = useRef(null);
  // Prevent duplicate in-flight fetches.
  const fetchingRef = useRef(false);

  const fetchPage = useCallback(
    async (cursor, append) => {
      if (!isSupabaseConfigured() || !user) {
        setIsLoading(false);
        return;
      }

      if (fetchingRef.current) return;
      fetchingRef.current = true;

      if (append) {
        setIsLoadingMore(true);
      } else {
        setIsLoading(true);
        setError(null);
      }

      try {
        let query = supabase
          .from('posts')
          .select(FEED_SELECT)
          .eq('status', 'active')
          .order('created_at', { ascending: false })
          .limit(PAGE_SIZE);

        if (cursor) {
          // Fetch posts older than the cursor (strictly before).
          query = query.lt('created_at', cursor);
        }

        const { data, error: fetchError } = await query;

        if (fetchError) throw fetchError;

        const rows = data || [];

        if (append) {
          setPosts((prev) => [...prev, ...rows]);
        } else {
          setPosts(rows);
        }

        setHasMore(rows.length === PAGE_SIZE);

        if (rows.length > 0) {
          cursorRef.current = rows[rows.length - 1].created_at;
        } else if (!append) {
          cursorRef.current = null;
        }
      } catch (err) {
        setError(err.message || 'Could not load feed');
      } finally {
        setIsLoading(false);
        setIsLoadingMore(false);
        fetchingRef.current = false;
      }
    },
    [user]
  );

  // Initial load and reload when the authenticated user changes.
  useEffect(() => {
    cursorRef.current = null;
    fetchPage(null, false);
  }, [fetchPage]);

  const loadMore = useCallback(() => {
    if (hasMore && !isLoadingMore && cursorRef.current) {
      fetchPage(cursorRef.current, true);
    }
  }, [hasMore, isLoadingMore, fetchPage]);

  const refresh = useCallback(() => {
    cursorRef.current = null;
    fetchPage(null, false);
  }, [fetchPage]);

  return {
    posts,
    isLoading,
    isLoadingMore,
    hasMore,
    error,
    loadMore,
    refresh,
  };
}

