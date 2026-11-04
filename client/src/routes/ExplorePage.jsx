import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';
import { ImageViewerModal } from '../features/posts/ImageViewerModal';
import { Avatar } from '../components/Avatar';
import { Skeleton } from '../components/Skeleton';
import { Search, X, Heart, MessageCircle, Image as ImageIcon } from 'lucide-react';

export function ExplorePage() {
  const navigate = useNavigate();
  const [posts, setPosts] = useState([]);
  const [matchingUsers, setMatchingUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activePhoto, setActivePhoto] = useState(null);
  const searchContainerRef = useRef(null);

  // Fetch explore posts and search results
  const fetchExplore = useCallback(async (queryText) => {
    if (!isSupabaseConfigured()) {
      setIsLoading(false);
      return;
    }

    const term = (queryText || '').trim();
    setIsLoading(true);
    setError(null);

    try {
      // 1. Fetch visual posts for gallery grid
      let postsQuery = supabase
        .from('posts')
        .select(`
          id,
          caption,
          created_at,
          author_id,
          profiles:profiles!author_id (id, username, display_name, avatar_url),
          post_media (*),
          likes (user_id),
          comments (id)
        `)
        .eq('status', 'active')
        .eq('visibility', 'public')
        .order('created_at', { ascending: false })
        .limit(60);

      if (term) {
        postsQuery = postsQuery.ilike('caption', `%${term}%`);
      }

      const { data: postsData, error: postsErr } = await postsQuery;
      if (postsErr) throw postsErr;

      // Filter to posts with media, or fallback to visual representation
      setPosts(postsData || []);

      // 2. If user is searching, find matching user accounts
      if (term) {
        const { data: usersData, error: usersErr } = await supabase
          .from('profiles')
          .select('id, username, display_name, avatar_url, bio')
          .or(`username.ilike.%${term}%,display_name.ilike.%${term}%`)
          .eq('status', 'active')
          .limit(8);

        if (usersErr) throw usersErr;
        setMatchingUsers(usersData || []);
      } else {
        setMatchingUsers([]);
      }
    } catch (err) {
      console.error('Explore fetch error:', err);
      setError(err.message || 'Could not load explore gallery.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchExplore(searchQuery);
    }, 200);
    return () => clearTimeout(timer);
  }, [searchQuery, fetchExplore]);

  // Flatten media items so every image gets its own square tile in the Instagram grid
  const galleryItems = posts.flatMap((post) => {
    const mediaList = post.post_media || [];
    if (mediaList.length > 0) {
      return mediaList.map((m) => ({
        id: `${post.id}-${m.id}`,
        postId: post.id,
        imageUrl: m.url,
        caption: post.caption,
        author: post.profiles,
        likeCount: post.likes?.length || 0,
        commentCount: post.comments?.length || 0,
      }));
    }
    // Stylized square for text posts
    return [
      {
        id: post.id,
        postId: post.id,
        imageUrl: null,
        caption: post.caption,
        author: post.profiles,
        likeCount: post.likes?.length || 0,
        commentCount: post.comments?.length || 0,
      },
    ];
  });

  return (
    <div className="mx-auto max-w-4xl px-2 sm:px-4 py-4 sm:py-6">
      {/* Instagram-style Search Bar */}
      <div ref={searchContainerRef} className="relative mb-4 sm:mb-6 max-w-lg mx-auto">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => setIsSearching(true)}
            placeholder="Search"
            className="w-full rounded-xl border border-border bg-surface pl-10 pr-9 py-2 text-sm text-primary placeholder:text-secondary/60 focus:border-accent focus:outline-none transition-colors"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setMatchingUsers([]);
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-zinc-400 hover:text-primary rounded-full"
              title="Clear search"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Search Results Dropdown for Accounts */}
        {searchQuery.trim().length > 0 && (
          <div className="absolute left-0 right-0 top-full mt-2 rounded-2xl border border-border bg-surface shadow-2xl p-2 z-30 max-h-80 overflow-y-auto animate-in fade-in duration-100">
            {matchingUsers.length === 0 ? (
              <p className="py-4 text-center text-xs text-secondary">
                No accounts found matching &quot;{searchQuery}&quot;
              </p>
            ) : (
              <div className="space-y-1">
                <p className="px-3 py-1 text-[11px] font-semibold text-secondary uppercase tracking-wider">
                  Accounts
                </p>
                {matchingUsers.map((u) => (
                  <Link
                    key={u.id}
                    to={`/profile/${u.username}`}
                    onClick={() => {
                      setIsSearching(false);
                      setSearchQuery('');
                    }}
                    className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-page transition-colors"
                  >
                    <Avatar
                      src={u.avatar_url}
                      name={u.display_name || u.username}
                      size="sm"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold text-primary truncate">
                        {u.username}
                      </p>
                      <p className="text-[11px] text-secondary truncate">
                        {u.display_name || `@${u.username}`}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Error state */}
      {error && (
        <div className="mb-4 rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-xs text-red-600 dark:text-red-400 text-center">
          {error}
        </div>
      )}

      {/* Loading Skeleton Grid */}
      {isLoading ? (
        <div className="grid grid-cols-3 gap-1 sm:gap-2 md:gap-3">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((i) => (
            <Skeleton key={i} className="aspect-square w-full rounded-sm sm:rounded-md" />
          ))}
        </div>
      ) : galleryItems.length === 0 ? (
        <div className="py-16 text-center text-secondary">
          <ImageIcon className="w-10 h-10 mx-auto text-zinc-400 mb-2 opacity-50" />
          <p className="text-sm font-medium text-primary">No posts yet</p>
          <p className="text-xs text-secondary mt-1">
            {searchQuery
              ? `No posts matched "${searchQuery}".`
              : 'Public posts and photos will appear here.'}
          </p>
        </div>
      ) : (
        /* Pure Instagram Visual Gallery Grid (3 columns, square tiles) */
        <div className="grid grid-cols-3 gap-1 sm:gap-2 md:gap-3">
          {galleryItems.map((item) => (
            <div
              key={item.id}
              onClick={() => {
                if (item.imageUrl) {
                  setActivePhoto(item.imageUrl);
                } else if (item.author?.username) {
                  navigate(`/profile/${item.author.username}`);
                }
              }}
              className="group relative aspect-square overflow-hidden rounded-sm sm:rounded-md bg-zinc-900 border border-border/40 cursor-pointer select-none"
            >
              {item.imageUrl ? (
                <img
                  src={item.imageUrl}
                  alt={item.caption || 'Explore post'}
                  loading="lazy"
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
              ) : (
                /* Stylized text tile if post has no photo */
                <div className="w-full h-full p-3 sm:p-4 bg-gradient-to-br from-zinc-800 to-zinc-950 flex flex-col justify-between">
                  <p className="text-xs sm:text-sm text-zinc-200 line-clamp-4 leading-relaxed font-serif">
                    {item.caption}
                  </p>
                  <p className="text-[10px] text-zinc-400 font-mono truncate">
                    @{item.author?.username || 'member'}
                  </p>
                </div>
              )}

              {/* Instagram-style Hover Overlay with Likes & Comments Count */}
              <div className="absolute inset-0 bg-black/45 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3 sm:gap-6 text-white font-semibold text-xs sm:text-sm">
                <div className="flex items-center gap-1.5">
                  <Heart className="w-4 h-4 sm:w-5 sm:h-5 fill-white text-white" />
                  <span>{item.likeCount}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <MessageCircle className="w-4 h-4 sm:w-5 sm:h-5 fill-white text-white" />
                  <span>{item.commentCount}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Image preview modal on click */}
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
