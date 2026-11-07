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

  // Authenticated user navigation: full-width on mobile, centered pill on laptops, pure white/black, no shadow
  return (
    <nav
      className="fixed bottom-0 left-0 right-0 w-full z-50 flex items-center justify-around bg-white dark:bg-black border-t border-neutral-200 dark:border-neutral-800 pt-2 px-3 pb-[calc(0.5rem+env(safe-area-inset-bottom,0px))] sm:bottom-5 sm:left-1/2 sm:-translate-x-1/2 sm:w-auto sm:min-w-[340px] sm:max-w-md sm:rounded-full sm:border sm:px-6 sm:py-2 text-primary shadow-none transition-all duration-200"
      aria-label="App Navigation Bar"
    >
      {/* 1. Home Feed */}
      <Link
        to="/"
        className={`flex-1 sm:flex-initial flex flex-col items-center justify-center py-1 sm:px-3 transition-all ${
          isHome
            ? 'text-accent'
            : 'text-secondary hover:text-primary'
        }`}
        title="Home Feed"
      >
        <div className={`p-1.5 rounded-full transition-colors ${isHome ? 'bg-accent-soft text-accent' : ''}`}>
          <Home className={`w-5 h-5 ${isHome ? 'fill-current' : ''}`} />
        </div>
      </Link>

      {/* 2. Unified Search & Explore */}
      <Link
        to="/explore"
        className={`flex-1 sm:flex-initial flex flex-col items-center justify-center py-1 sm:px-3 transition-all ${
          isExplore
            ? 'text-accent'
            : 'text-secondary hover:text-primary'
        }`}
        title="Search & Explore"
      >
        <div className={`p-1.5 rounded-full transition-colors ${isExplore ? 'bg-accent-soft text-accent' : ''}`}>
          <Search className="w-5 h-5" />
        </div>
      </Link>

      {/* 3. Direct Messages */}
      <Link
        to="/messages"
        className={`flex-1 sm:flex-initial flex flex-col items-center justify-center py-1 sm:px-3 transition-all ${
          isMessages
            ? 'text-accent'
            : 'text-secondary hover:text-primary'
        }`}
        title="Direct Messages"
      >
        <div className={`relative p-1.5 rounded-full transition-colors ${isMessages ? 'bg-accent-soft text-accent' : ''}`}>
          <Send className="w-5 h-5" />
          {unreadMessages > 0 && (
            <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-red-500 ring-2 ring-white dark:ring-black" />
          )}
        </div>
      </Link>

      {/* 4. Profile Avatar */}
      <Link
        to={profileHref}
        className={`flex-1 sm:flex-initial flex flex-col items-center justify-center py-1 sm:px-3 transition-all ${
          isProfile
            ? 'text-accent'
            : 'text-secondary hover:text-primary'
        }`}
        title="My Profile"
      >
        <div className="relative">
          <div className={`h-7 w-7 rounded-full overflow-hidden border transition-all ${
            isProfile ? 'ring-2 ring-accent border-transparent scale-105' : 'border-neutral-300 dark:border-neutral-700 hover:opacity-90'
          }`}>
            {profile?.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt={profile?.display_name || 'Profile'}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="h-full w-full flex items-center justify-center text-xs font-semibold bg-neutral-100 dark:bg-neutral-800 text-primary">
                {(profile?.display_name || user?.email || 'U')[0].toUpperCase()}
              </div>
            )}
          </div>
          {unreadNotifications > 0 && (
            <span className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-white dark:ring-black" />
          )}
        </div>
      </Link>
    </nav>
  );
}
