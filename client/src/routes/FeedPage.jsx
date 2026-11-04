import React, { useState, useEffect } from 'react';
import { useFeed } from '../features/posts/useFeed';
import { usePosts } from '../features/posts/usePosts';
import { PostComposer } from '../features/posts/PostComposer';
import { PostCard } from '../features/posts/PostCard';
import { Button } from '../components/Button';
import { EmptyState } from '../components/EmptyState';
import { Skeleton } from '../components/Skeleton';
import { RefreshCw, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';

export function FeedPage() {
  const { posts, isLoading, isLoadingMore, hasMore, error, loadMore, refresh } = useFeed();
  const { deletePost, updatePost } = usePosts();
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
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
      {/* Post creation box */}
      <div className="mb-6">
        <PostComposer onPostCreated={handlePostCreated} />
      </div>

      {/* Feed Controls */}
      <div className="flex items-center justify-between mb-4 px-1">
        <h1 className="text-sm font-semibold text-primary uppercase tracking-wider">
          Home Feed
        </h1>
        <Button
          variant="ghost"
          size="sm"
          onClick={refresh}
          disabled={isLoading}
          className="gap-1.5 text-xs text-secondary hover:text-primary"
          aria-label="Refresh feed"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </Button>
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

