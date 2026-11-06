import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, MessageSquare } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { usePosts } from '../features/posts/usePosts';
import { PostCard } from '../features/posts/PostCard';
import { Skeleton } from '../components/Skeleton';
import { EmptyState } from '../components/EmptyState';
import { Button } from '../components/Button';

export function PostDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { deletePost, updatePost } = usePosts();

  const [post, setPost] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function loadPost() {
      if (!id) return;
      setIsLoading(true);
      setError(null);

      try {
        const { data, error: fetchErr } = await supabase
          .from('posts')
          .select(`
            *,
            profiles:profiles!author_id (id, username, display_name, avatar_url),
            post_media (*),
            likes (user_id),
            saved_posts (user_id),
            comments (id)
          `)
          .eq('id', id)
          .eq('status', 'active')
          .maybeSingle();

        if (fetchErr) throw fetchErr;
        if (!data) {
          setError('Post not found or has been removed.');
          setPost(null);
        } else {
          setPost(data);
        }
      } catch (err) {
        console.error('Error loading post:', err);
        setError(err.message || 'Could not load post.');
      } finally {
        setIsLoading(false);
      }
    }

    loadPost();
  }, [id]);

  const handlePostDeleted = async (postId) => {
    try {
      await deletePost(postId);
      navigate('/', { replace: true });
    } catch (err) {
      console.error('Failed to delete post:', err);
    }
  };

  const handlePostUpdated = async (postId, updates) => {
    try {
      const updated = await updatePost(postId, updates);
      setPost((prev) => (prev ? { ...prev, ...updated } : prev));
    } catch (err) {
      console.error('Failed to update post:', err);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto px-3 sm:px-4 py-4 sm:py-6">
      {/* Back Header */}
      <div className="flex items-center gap-3 mb-6">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="p-2 rounded-xl text-secondary hover:text-primary hover:bg-surface border border-border transition-colors"
          title="Go back"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h1 className="text-base font-semibold text-primary">Post</h1>
          <p className="text-xs text-secondary">
            View full photo, interactions, and discussion
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="rounded-2xl border border-border bg-surface p-4 sm:p-5 space-y-4 shadow-sm">
          <div className="flex items-center gap-3">
            <Skeleton className="w-10 h-10 rounded-full" />
            <div className="space-y-1.5 flex-1">
              <Skeleton className="w-32 h-4 rounded" />
              <Skeleton className="w-20 h-3 rounded" />
            </div>
          </div>
          <Skeleton className="w-full h-72 rounded-xl" />
          <div className="space-y-2">
            <Skeleton className="w-3/4 h-4 rounded" />
            <Skeleton className="w-1/2 h-3 rounded" />
          </div>
        </div>
      ) : error || !post ? (
        <div className="py-12 text-center">
          <EmptyState
            icon={MessageSquare}
            title="Post not found"
            description="The post you are trying to view might have been deleted or the link is invalid."
            action={
              <Link to="/">
                <Button variant="primary" size="sm">
                  Back to feed
                </Button>
              </Link>
            }
          />
        </div>
      ) : (
        <PostCard
          post={post}
          initialShowComments={true}
          onPostDeleted={handlePostDeleted}
          onPostUpdated={handlePostUpdated}
        />
      )}
    </div>
  );
}

