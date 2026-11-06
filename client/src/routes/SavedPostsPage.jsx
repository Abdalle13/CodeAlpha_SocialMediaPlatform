import React, { useState, useEffect, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';
import { useAuth } from '../features/auth/AuthContext';
import { PostCard } from '../features/posts/PostCard';
import { EmptyState } from '../components/EmptyState';
import { Skeleton } from '../components/Skeleton';
import { Bookmark } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '../components/Button';

export function SavedPostsPage() {
  const { user } = useAuth();
  const [savedPosts, setSavedPosts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchSavedPosts = useCallback(async () => {
    if (!isSupabaseConfigured() || !user) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const { data, error: fetchErr } = await supabase
        .from('saved_posts')
        .select(`
          created_at,
          posts (
            *,
            profiles:profiles!author_id (id, username, display_name, avatar_url),
            post_media (*),
            likes (user_id),
            saved_posts (user_id)
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (fetchErr) throw fetchErr;

      // Filter out posts that might have been deleted or inaccessible
      const validPosts = (data || [])
        .map((row) => row.posts)
        .filter((p) => p && p.status === 'active');

      setSavedPosts(validPosts);
    } catch (err) {
      setError(err.message || 'Could not load your saved posts.');
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchSavedPosts();
  }, [fetchSavedPosts]);

  const handlePostDeleted = (deletedId) => {
    setSavedPosts((prev) => prev.filter((p) => p.id !== deletedId));
  };

  return (
    <div className="w-full max-w-2xl mx-auto px-3 sm:px-4 py-4 sm:py-8">
      <div className="mb-6">
        <h1 className="text-xl font-bold tracking-tight text-primary">Saved Posts</h1>
        <p className="text-xs text-secondary mt-0.5">
          Everything you bookmark is saved here privately.
        </p>
      </div>

      {error && (
        <div className="mb-6 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-xs text-red-600 dark:text-red-400">
          <p className="font-medium">Could not load saved bookmarks</p>
          <p className="mt-1 opacity-90">{error}</p>
        </div>
      )}

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="rounded-xl border border-border bg-surface p-4 space-y-3">
              <div className="flex items-center gap-3">
                <Skeleton className="w-10 h-10 rounded-full" />
                <div className="space-y-1.5 flex-1">
                  <Skeleton className="w-32 h-4 rounded" />
                  <Skeleton className="w-20 h-3 rounded" />
                </div>
              </div>
              <Skeleton className="w-full h-24 rounded-lg" />
            </div>
          ))}
        </div>
      ) : savedPosts.length === 0 ? (
        <EmptyState
          icon={Bookmark}
          title="No saved posts"
          description="Click the bookmark icon on any post to save it for later review."
          action={
            <Link to="/explore">
              <Button variant="primary" size="sm">
                Explore posts
              </Button>
            </Link>
          }
        />
      ) : (
        <div className="space-y-4">
          {savedPosts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              onPostDeleted={handlePostDeleted}
            />
          ))}
        </div>
      )}
    </div>
  );
}

