import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Search, Send } from 'lucide-react';
import { Wordmark } from './Wordmark';
import { useAuth } from '../features/auth/AuthContext';
import { useNotifications } from '../features/notifications/useNotifications';
import { useMessages } from '../features/messages/useMessages';

export function Navbar() {
  const location = useLocation();
  const { user, profile } = useAuth();
  const { unreadCount: unreadNotifications } = useNotifications();
  const { unreadCount: unreadMessages } = useMessages();

  const isHome = location.pathname === '/' || location.pathname === '/feed';
  const isExplore = location.pathname === '/explore';
  const isMessages = location.pathname === '/messages';
  const isProfile =
    Boolean(profile?.username) &&
    location.pathname === `/profile/${profile.username}`;

  // If not logged in, do not render any bottom dock
  if (!user) {
    return null;
  }

  const profileHref = profile?.username ? `/profile/${profile.username}` : '#';

  // Authenticated user navigation dock (Instagram-style bottom dock)
  return (
    <nav
      className="fixed bottom-5 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 sm:gap-4 rounded-full bg-[#121214]/95 dark:bg-[#121214]/95 backdrop-blur-xl border border-white/10 px-3 py-1.5 sm:px-4 sm:py-2 shadow-2xl text-white transition-all duration-200"
      aria-label="App Navigation Dock"
    >
      {/* 1. Home Feed */}
      <Link
        to="/"
        className={`flex items-center justify-center transition-all ${
          isHome
            ? 'rounded-full bg-white/15 px-4 py-2 sm:px-5 sm:py-2 text-white shadow-sm'
            : 'p-2 sm:p-2.5 text-zinc-400 hover:text-white hover:bg-white/5 rounded-full'
        }`}
        title="Home Feed"
      >
        <Home className={`w-5 h-5 ${isHome ? 'fill-current' : ''}`} />
      </Link>

      {/* 2. Unified Search & Explore */}
      <Link
        to="/explore"
        className={`flex items-center justify-center transition-all ${
          isExplore
            ? 'rounded-full bg-white/15 px-4 py-2 sm:px-5 sm:py-2 text-white shadow-sm'
            : 'p-2 sm:p-2.5 text-zinc-400 hover:text-white hover:bg-white/5 rounded-full'
        }`}
        title="Search & Explore"
      >
        <Search className="w-5 h-5" />
      </Link>

      {/* 3. Direct Messages */}
      <Link
        to="/messages"
        className={`relative flex items-center justify-center transition-all ${
          isMessages
            ? 'rounded-full bg-white/15 px-4 py-2 sm:px-5 sm:py-2 text-white shadow-sm'
            : 'p-2 sm:p-2.5 text-zinc-400 hover:text-white hover:bg-white/5 rounded-full'
        }`}
        title="Direct Messages"
      >
        <Send className="w-5 h-5" />
        {unreadMessages > 0 && (
          <span className="absolute bottom-1 right-1 h-2 w-2 rounded-full bg-red-500 ring-2 ring-[#121214]" />
        )}
      </Link>

      {/* 4. Profile Avatar (Direct link to profile page, no popup menu) */}
      <Link
        to={profileHref}
        className={`relative p-0.5 rounded-full transition-all flex items-center justify-center ${
          isProfile
            ? 'ring-2 ring-white scale-105'
            : 'hover:opacity-90 opacity-80 hover:opacity-100'
        }`}
        title="My Profile"
      >
        <div className="h-7 w-7 sm:h-8 sm:w-8 rounded-full overflow-hidden border border-white/20 bg-zinc-800">
          {profile?.avatar_url ? (
            <img
              src={profile.avatar_url}
              alt={profile?.display_name || 'Profile'}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="h-full w-full flex items-center justify-center text-xs font-semibold text-white">
              {(profile?.display_name || user?.email || 'U')[0].toUpperCase()}
            </div>
          )}
        </div>
        {unreadNotifications > 0 && (
          <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-[#121214]" />
        )}
      </Link>
    </nav>
  );
}
