import React, { useState, useEffect } from 'react';
import { useFeed } from '../features/posts/useFeed';
import { usePosts } from '../features/posts/usePosts';
import { PostComposer } from '../features/posts/PostComposer';
import { PostCard } from '../features/posts/PostCard';
import { Button } from '../components/Button';
import { EmptyState } from '../components/EmptyState';
import { Skeleton } from '../components/Skeleton';
import { RefreshCw, Sparkles, Bell, Bookmark } from 'lucide-react';
import { Wordmark } from '../components/Wordmark';
import { Link } from 'react-router-dom';
import { useNotifications } from '../features/notifications/useNotifications';

export function FeedPage() {
  const { posts, isLoading, isLoadingMore, hasMore, error, loadMore, refresh } = useFeed();
  const { deletePost, updatePost } = usePosts();
  const { unreadCount: unreadNotifications } = useNotifications();
  const [feedPosts, setFeedPosts] = useState([]);

  useEffect(() => {
    setFeedPosts(posts);
  }, [posts]);

  const handlePostCreated = (newPost) => {
    // Refresh feed to get complete joined data
    refresh();
  };

  const handlePostDeleted = async (postId) => {
    await deletePost(postId);
    setFeedPosts((prev) => prev.filter((p) => p.id !== postId));
  };

  const handlePostUpdated = async (postId, updates) => {
    const updated = await updatePost(postId, updates);
    setFeedPosts((prev) =>
      prev.map((p) => (p.id === postId ? { ...p, ...updated } : p))
    );
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-6 sm:px-6">
      {/* Top Header Bar */}
      <div className="flex items-center justify-between mb-6 px-1">
        <Wordmark size="md" />
        <div className="flex items-center gap-1 sm:gap-2">
          <Link
            to="/notifications"
            className="relative p-2 rounded-full text-secondary hover:text-primary hover:bg-surface transition-colors"
            title="Notifications"
          >
            <Bell className="w-5 h-5" />
            {unreadNotifications > 0 && (
              <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-red-500 ring-2 ring-page" />
            )}
          </Link>
          <Link
            to="/saved"
            className="p-2 rounded-full text-secondary hover:text-primary hover:bg-surface transition-colors"
            title="Saved Posts"
          >
            <Bookmark className="w-5 h-5" />
          </Link>
          <button
            type="button"
            onClick={refresh}
            disabled={isLoading}
            className="flex items-center p-2 rounded-full text-secondary hover:text-primary hover:bg-surface transition-colors disabled:opacity-50"
            title="Refresh feed"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Post creation box */}
      <div className="mb-6">
        <PostComposer onPostCreated={handlePostCreated} />
      </div>

      {/* Error Banner */}
      {error && (
        <div className="mb-6 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-xs text-red-600 dark:text-red-400">
          <p className="font-medium">Could not load latest posts</p>
          <p className="mt-1 opacity-90">{error}</p>
        </div>
      )}

      {/* Loading Skeleton */}
      {isLoading && feedPosts.length === 0 ? (
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
              <Skeleton className="w-full h-16 rounded-lg" />
            </div>
          ))}
        </div>
      ) : feedPosts.length === 0 ? (
        /* Empty State */
        <EmptyState
          icon={Sparkles}
          title="Your feed is quiet"
          description="Follow creative minds or share your first post to bring your feed to life."
          action={
            <Link to="/explore">
              <Button variant="primary" size="sm">
                Explore Community
              </Button>
            </Link>
          }
        />
      ) : (
        /* Post Stream */
        <div className="space-y-4">
          {feedPosts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              onPostDeleted={handlePostDeleted}
              onPostUpdated={handlePostUpdated}
            />
          ))}

          {/* Load More Button */}
          {hasMore && (
            <div className="pt-4 pb-8 text-center">
              <Button
                variant="outline"
                size="md"
                onClick={loadMore}
                isLoading={isLoadingMore}
                disabled={isLoadingMore}
                className="w-full sm:w-auto"
              >
                Load older posts
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

