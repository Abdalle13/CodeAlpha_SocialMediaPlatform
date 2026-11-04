import React, { useState, useEffect, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';
import { PostCard } from '../features/posts/PostCard';
import { ImageViewerModal } from '../features/posts/ImageViewerModal';
import { Button } from '../components/Button';
import { EmptyState } from '../components/EmptyState';
import { Skeleton } from '../components/Skeleton';
import { Compass, Search, Grid, ListFilter } from 'lucide-react';

export function ExplorePage() {
  const [posts, setPosts] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState('feed'); // 'feed' | 'grid'
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activePhoto, setActivePhoto] = useState(null);

  const fetchExplorePosts = useCallback(async () => {
    if (!isSupabaseConfigured()) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      let query = supabase
        .from('posts')
        .select(
          '*, profiles:profiles!author_id(id, username, display_name, avatar_url), post_media(*), likes(user_id), saved_posts(user_id)'
        )
        .eq('status', 'active')
        .eq('visibility', 'public')
        .order('created_at', { ascending: false })
        .limit(30);

      if (searchQuery.trim()) {
        query = query.ilike('caption', `%${searchQuery.trim()}%`);
      }

      const { data, error: fetchErr } = await query;
      if (fetchErr) throw fetchErr;

      setPosts(data || []);
    } catch (err) {
      setError(err.message || 'Could not load explore posts.');
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchExplorePosts();
    }, 250);
    return () => clearTimeout(timer);
  }, [fetchExplorePosts]);

  const allPhotos = posts.flatMap((p) =>
    (p.post_media || []).map((m) => ({
      ...m,
      post: p,
    }))
  );

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      {/* Header and Search */}
      <div className="mb-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-primary">Explore Veyra</h1>
            <p className="text-xs text-secondary mt-0.5">
              Discover stories, perspectives, and visual work from across the community.
            </p>
          </div>

          {/* View toggle */}
          <div className="flex items-center rounded-lg border border-border p-1 bg-surface self-start sm:self-auto">
            <button
              type="button"
              onClick={() => setViewMode('feed')}
              className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                viewMode === 'feed'
                  ? 'bg-accent-soft text-accent'
                  : 'text-secondary hover:text-primary'
              }`}
            >
              <ListFilter className="w-3.5 h-3.5" />
              <span>Stories</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                viewMode === 'grid'
                  ? 'bg-accent-soft text-accent'
                  : 'text-secondary hover:text-primary'
              }`}
            >
              <Grid className="w-3.5 h-3.5" />
              <span>Gallery</span>
            </button>
          </div>
        </div>

        {/* Search input */}
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary" />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search posts and topics..."
            className="w-full rounded-xl border border-border bg-surface pl-10 pr-4 py-2 text-sm text-primary placeholder:text-secondary/60 focus:border-accent focus:outline-none shadow-sm transition-colors"
          />
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="mb-6 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-xs text-red-600 dark:text-red-400">
          <p className="font-medium">Could not complete search</p>
          <p className="mt-1 opacity-90">{error}</p>
        </div>
      )}

      {/* Loading */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[1, 2, 4, 5].map((i) => (
            <div key={i} className="rounded-xl border border-border bg-surface p-4 space-y-3">
              <Skeleton className="w-full h-44 rounded-lg" />
              <Skeleton className="w-3/4 h-4 rounded" />
            </div>
          ))}
        </div>
      ) : posts.length === 0 ? (
        <EmptyState
          icon={Compass}
          title="No posts found"
          description={
            searchQuery
              ? `We could not find any public posts matching "${searchQuery}".`
              : 'There are no public posts available yet.'
          }
        />
      ) : viewMode === 'feed' ? (
        /* Feed View */
        <div className="max-w-2xl mx-auto space-y-4">
          {posts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      ) : (
        /* Visual Photo Grid View */
        <div>
          {allPhotos.length === 0 ? (
            <EmptyState
              icon={Grid}
              title="No photos yet"
              description="Posts with photos will be showcased in this gallery."
            />
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
              {allPhotos.map((photo, idx) => (
                <div
                  key={idx}
                  onClick={() => setActivePhoto(photo.url)}
                  className="group relative aspect-square overflow-hidden rounded-lg bg-page border border-border cursor-pointer"
                >
                  <img
                    src={photo.url}
                    alt="Gallery item"
                    loading="lazy"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-2.5">
                    <span className="text-[11px] font-medium text-white truncate">
                      @{photo.post?.profiles?.username || 'member'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activePhoto && (
        <ImageViewerModal
          isOpen={Boolean(activePhoto)}
          onClose={() => setActivePhoto(null)}
          src={activePhoto}
        />
      )}
    </div>
  );
}

