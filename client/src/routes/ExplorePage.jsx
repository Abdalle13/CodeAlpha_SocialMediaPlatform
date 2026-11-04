import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';
import { PostCard } from '../features/posts/PostCard';
import { ImageViewerModal } from '../features/posts/ImageViewerModal';
import { Avatar } from '../components/Avatar';
import { Button } from '../components/Button';
import { EmptyState } from '../components/EmptyState';
import { Skeleton } from '../components/Skeleton';
import { Search, Grid, ListFilter, Users, Sparkles, X } from 'lucide-react';

export function ExplorePage() {
  const [posts, setPosts] = useState([]);
  const [matchedUsers, setMatchedUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'accounts' | 'posts'
  const [viewMode, setViewMode] = useState('feed'); // 'feed' | 'grid'
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activePhoto, setActivePhoto] = useState(null);

  const performSearch = useCallback(async (queryText) => {
    if (!isSupabaseConfigured()) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    const term = (queryText || '').trim();

    try {
      // 1. Fetch Posts
      let postsQuery = supabase
        .from('posts')
        .select(`
          *,
          profiles:profiles!author_id (id, username, display_name, avatar_url),
          post_media (*),
          likes (user_id),
          saved_posts (user_id),
          comments (id)
        `)
        .eq('status', 'active')
        .eq('visibility', 'public')
        .order('created_at', { ascending: false })
        .limit(30);

      if (term) {
        postsQuery = postsQuery.ilike('caption', `%${term}%`);
      }

      const { data: postsData, error: postsErr } = await postsQuery;
      if (postsErr) throw postsErr;
      setPosts(postsData || []);

      // 2. Fetch Users / Accounts (if term is entered or suggestions when empty)
      let usersQuery = supabase
        .from('profiles')
        .select('id, username, display_name, avatar_url, bio')
        .eq('status', 'active')
        .limit(term ? 10 : 6);

      if (term) {
        usersQuery = usersQuery.or(`username.ilike.%${term}%,display_name.ilike.%${term}%`);
      } else {
        usersQuery = usersQuery.order('created_at', { ascending: false });
      }

      const { data: usersData, error: usersErr } = await usersQuery;
      if (usersErr) throw usersErr;
      setMatchedUsers(usersData || []);
    } catch (err) {
      console.error('Explore search error:', err);
      setError(err.message || 'Could not complete search.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      performSearch(searchQuery);
    }, 250);
    return () => clearTimeout(timer);
  }, [searchQuery, performSearch]);

  const allPhotos = posts.flatMap((p) =>
    (p.post_media || []).map((m) => ({
      ...m,
      post: p,
    }))
  );

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6">
      {/* Search Header */}
      <div className="mb-6 space-y-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-primary">Search & Explore</h1>
          <p className="text-xs text-secondary mt-0.5">
            Discover accounts, stories, and visual inspiration across Veyra.
          </p>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search accounts or posts..."
            className="w-full rounded-2xl border border-border bg-surface pl-10 pr-10 py-2.5 text-sm text-primary placeholder:text-secondary/60 focus:border-accent focus:outline-none shadow-sm transition-colors"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 text-secondary hover:text-primary rounded-full"
              title="Clear search"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Search Filter Tabs */}
        <div className="flex items-center justify-between gap-2 pt-1 border-b border-border/70 pb-2">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveTab('all')}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                activeTab === 'all'
                  ? 'bg-accent text-white shadow-sm'
                  : 'bg-surface text-secondary hover:text-primary border border-border'
              }`}
            >
              All
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('accounts')}
              className={`flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                activeTab === 'accounts'
                  ? 'bg-accent text-white shadow-sm'
                  : 'bg-surface text-secondary hover:text-primary border border-border'
              }`}
            >
              <Users className="w-3 h-3" />
              <span>Accounts</span>
              {matchedUsers.length > 0 && (
                <span className="text-[10px] opacity-80">({matchedUsers.length})</span>
              )}
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('posts')}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                activeTab === 'posts'
                  ? 'bg-accent text-white shadow-sm'
                  : 'bg-surface text-secondary hover:text-primary border border-border'
              }`}
            >
              Posts
            </button>
          </div>

          {/* View Mode Toggle for Posts */}
          {(activeTab === 'all' || activeTab === 'posts') && (
            <div className="flex items-center rounded-lg border border-border p-0.5 bg-surface">
              <button
                type="button"
                onClick={() => setViewMode('feed')}
                className={`p-1 rounded transition-colors ${
                  viewMode === 'feed'
                    ? 'bg-accent-soft text-accent'
                    : 'text-secondary hover:text-primary'
                }`}
                title="Feed view"
              >
                <ListFilter className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className={`p-1 rounded transition-colors ${
                  viewMode === 'grid'
                    ? 'bg-accent-soft text-accent'
                    : 'text-secondary hover:text-primary'
                }`}
                title="Grid gallery view"
              >
                <Grid className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="mb-6 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-xs text-red-600 dark:text-red-400">
          <p className="font-medium">Could not complete search</p>
          <p className="mt-1 opacity-90">{error}</p>
        </div>
      )}

      {/* Loading Skeleton */}
      {isLoading ? (
        <div className="space-y-4">
          <div className="flex gap-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex-1 rounded-2xl border border-border bg-surface p-3 space-y-2">
                <Skeleton className="w-10 h-10 rounded-full" />
                <Skeleton className="w-24 h-3.5 rounded" />
              </div>
            ))}
          </div>
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <div key={i} className="rounded-2xl border border-border bg-surface p-4 space-y-3">
                <Skeleton className="w-full h-44 rounded-xl" />
                <Skeleton className="w-2/3 h-4 rounded" />
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Section: People / Accounts */}
          {(activeTab === 'all' || activeTab === 'accounts') && matchedUsers.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between px-1">
                <h2 className="text-xs font-semibold text-secondary uppercase tracking-wider">
                  {searchQuery ? 'Matching Accounts' : 'Suggested People'}
                </h2>
                {activeTab === 'all' && matchedUsers.length > 3 && (
                  <button
                    type="button"
                    onClick={() => setActiveTab('accounts')}
                    className="text-xs text-accent hover:underline"
                  >
                    View all
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {(activeTab === 'all' ? matchedUsers.slice(0, 4) : matchedUsers).map((u) => (
                  <Link
                    key={u.id}
                    to={`/profile/${u.username}`}
                    className="flex items-center justify-between p-3 rounded-2xl border border-border bg-surface hover:bg-page/70 transition-colors group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <Avatar
                        src={u.avatar_url}
                        name={u.display_name || u.username}
                        size="md"
                      />
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-primary truncate group-hover:text-accent transition-colors">
                          {u.display_name || u.username}
                        </p>
                        <p className="text-[11px] text-secondary font-mono truncate">
                          @{u.username}
                        </p>
                        {u.bio && (
                          <p className="text-[11px] text-secondary/80 truncate mt-0.5 max-w-[180px]">
                            {u.bio}
                          </p>
                        )}
                      </div>
                    </div>
                    <span className="text-xs font-semibold text-accent border border-accent/40 rounded-full px-3 py-1 group-hover:bg-accent group-hover:text-white transition-all shrink-0">
                      View
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* If accounts tab was chosen but no accounts found */}
          {activeTab === 'accounts' && matchedUsers.length === 0 && (
            <EmptyState
              icon={Users}
              title="No accounts found"
              description={`No profiles matched "${searchQuery}". Try searching for another name.`}
            />
          )}

          {/* Section: Posts Stream */}
          {(activeTab === 'all' || activeTab === 'posts') && (
            <div>
              {activeTab === 'all' && matchedUsers.length > 0 && posts.length > 0 && (
                <div className="mb-3 px-1">
                  <h2 className="text-xs font-semibold text-secondary uppercase tracking-wider">
                    {searchQuery ? 'Matching Posts' : 'Explore Feed'}
                  </h2>
                </div>
              )}

              {posts.length === 0 && matchedUsers.length === 0 ? (
                <EmptyState
                  icon={Search}
                  title="No results found"
                  description={
                    searchQuery
                      ? `We could not find any accounts or posts matching "${searchQuery}".`
                      : 'There are no public posts available yet.'
                  }
                />
              ) : posts.length === 0 ? (
                <EmptyState
                  icon={Search}
                  title="No posts found"
                  description={`No posts matched "${searchQuery}".`}
                />
              ) : viewMode === 'feed' ? (
                <div className="space-y-4">
                  {posts.map((post) => (
                    <PostCard key={post.id} post={post} />
                  ))}
                </div>
              ) : (
                /* Visual Gallery Grid */
                <div>
                  {allPhotos.length === 0 ? (
                    <EmptyState
                      icon={Grid}
                      title="No photos found"
                      description="Posts with photos will be displayed in this gallery view."
                    />
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {allPhotos.map((photo, idx) => (
                        <div
                          key={idx}
                          onClick={() => setActivePhoto(photo.url)}
                          className="group relative aspect-square overflow-hidden rounded-xl bg-page border border-border cursor-pointer"
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
