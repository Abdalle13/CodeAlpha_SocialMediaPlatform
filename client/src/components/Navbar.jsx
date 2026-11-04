import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Home,
  Film,
  Send,
  Search,
  Bell,
  Bookmark,
  Shield,
  Settings,
  LogOut,
  User,
} from 'lucide-react';
import { ThemeToggle } from './ThemeToggle';
import { Wordmark } from './Wordmark';
import { useAuth } from '../features/auth/AuthContext';
import { useNotifications } from '../features/notifications/useNotifications';
import { useMessages } from '../features/messages/useMessages';

export function Navbar() {
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, profile, signOut } = useAuth();
  const { unreadCount: unreadNotifications } = useNotifications();
  const { unreadCount: unreadMessages } = useMessages();

  const handleSignOut = async () => {
    setProfileMenuOpen(false);
    await signOut();
    navigate('/login');
  };

  const isHome = location.pathname === '/' || location.pathname === '/feed';
  const isActive = (path) => location.pathname === path;
  const isProfileActive =
    location.pathname.startsWith('/profile') ||
    location.pathname.startsWith('/settings');

  // If guest and on auth routes, keep the screen completely minimal
  if (!user) {
    if (
      location.pathname === '/login' ||
      location.pathname === '/register' ||
      location.pathname === '/forgot-password' ||
      location.pathname === '/reset-password'
    ) {
      return null;
    }

    // Guest on public pages (e.g. explore or welcome)
    return (
      <nav
        className="fixed bottom-5 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 rounded-full bg-[#121214]/95 dark:bg-[#121214]/95 backdrop-blur-xl border border-white/10 px-4 py-2 shadow-2xl text-white"
        aria-label="Public Navigation Dock"
      >
        <Link to="/welcome" className="flex items-center py-1">
          <Wordmark size="sm" />
        </Link>
        <div className="h-4 w-px bg-white/20" />
        <Link
          to="/explore"
          className="text-xs text-zinc-300 hover:text-white transition-colors"
        >
          Explore
        </Link>
        <Link
          to="/login"
          className="rounded-full bg-accent px-3.5 py-1.5 text-xs font-semibold text-white shadow hover:opacity-90 transition-opacity"
        >
          Log in
        </Link>
      </nav>
    );
  }

  // Authenticated user navigation dock (Instagram-style bottom pill bar)
  return (
    <nav
      className="fixed bottom-5 left-1/2 -translate-x-1/2 z-50 flex items-center gap-1.5 sm:gap-2 rounded-full bg-[#121214]/95 dark:bg-[#121214]/95 backdrop-blur-xl border border-white/10 px-2.5 py-1.5 sm:px-3 sm:py-2 shadow-2xl text-white transition-all duration-200"
      aria-label="App Navigation Dock"
    >
      {/* 1. Home Button */}
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

      {/* 2. Media / Explore Button */}
      <Link
        to="/explore"
        className={`flex items-center justify-center transition-all ${
          isActive('/explore')
            ? 'rounded-full bg-white/15 px-4 py-2 sm:px-5 sm:py-2 text-white shadow-sm'
            : 'p-2 sm:p-2.5 text-zinc-400 hover:text-white hover:bg-white/5 rounded-full'
        }`}
        title="Explore Posts"
      >
        <Film className="w-5 h-5" />
      </Link>

      {/* 3. Direct Messages */}
      <Link
        to="/messages"
        className={`relative flex items-center justify-center transition-all ${
          isActive('/messages')
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

      {/* 4. Search */}
      <Link
        to="/explore"
        className={`flex items-center justify-center transition-all ${
          location.pathname === '/explore' && location.search
            ? 'rounded-full bg-white/15 px-4 py-2 sm:px-5 sm:py-2 text-white shadow-sm'
            : 'p-2 sm:p-2.5 text-zinc-400 hover:text-white hover:bg-white/5 rounded-full'
        }`}
        title="Search"
      >
        <Search className="w-5 h-5" />
      </Link>

      {/* 5. Profile with Avatar */}
      <div className="relative">
        <button
          type="button"
          onClick={() => setProfileMenuOpen((prev) => !prev)}
          className={`relative p-1 rounded-full transition-all focus:outline-none ${
            profileMenuOpen || isProfileActive ? 'ring-2 ring-white/60' : 'hover:opacity-90'
          }`}
          title="Account Menu"
          aria-expanded={profileMenuOpen}
        >
          <div className="h-7 w-7 rounded-full overflow-hidden border border-white/20 bg-zinc-800">
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
            <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-[#121214]" />
          )}
        </button>

        {/* Upward Popover Menu */}
        {profileMenuOpen && (
          <>
            <div
              className="fixed inset-0 z-40"
              onClick={() => setProfileMenuOpen(false)}
            />
            <div className="absolute bottom-full right-0 mb-3 w-56 rounded-2xl border border-white/10 bg-[#18181b]/95 p-2 shadow-2xl backdrop-blur-xl z-50 text-xs text-zinc-200 animate-in fade-in slide-in-from-bottom-2 duration-150">
              <div className="px-3 py-2 border-b border-white/10 mb-1">
                <p className="font-semibold text-white truncate">
                  {profile?.display_name || 'My Account'}
                </p>
                <p className="text-[11px] text-zinc-400 truncate">
                  @{profile?.username || user?.email}
                </p>
              </div>

              <Link
                to={profile?.username ? `/profile/${profile.username}` : '#'}
                onClick={() => setProfileMenuOpen(false)}
                className="flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-white/10 text-white transition-colors"
              >
                <User className="w-4 h-4 text-zinc-400" />
                <span>View Profile</span>
              </Link>

              <Link
                to="/notifications"
                onClick={() => setProfileMenuOpen(false)}
                className="flex items-center justify-between px-3 py-2 rounded-xl hover:bg-white/10 text-white transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <Bell className="w-4 h-4 text-zinc-400" />
                  <span>Notifications</span>
                </div>
                {unreadNotifications > 0 && (
                  <span className="flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                    {unreadNotifications}
                  </span>
                )}
              </Link>

              <Link
                to="/saved"
                onClick={() => setProfileMenuOpen(false)}
                className="flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-white/10 text-white transition-colors"
              >
                <Bookmark className="w-4 h-4 text-zinc-400" />
                <span>Saved Posts</span>
              </Link>

              {profile?.role === 'admin' && (
                <Link
                  to="/admin"
                  onClick={() => setProfileMenuOpen(false)}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-amber-400 hover:bg-amber-500/10 transition-colors"
                >
                  <Shield className="w-4 h-4" />
                  <span>Admin Console</span>
                </Link>
              )}

              <Link
                to="/settings/profile"
                onClick={() => setProfileMenuOpen(false)}
                className="flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-white/10 text-white transition-colors"
              >
                <Settings className="w-4 h-4 text-zinc-400" />
                <span>Settings</span>
              </Link>

              <div className="my-1 border-t border-white/10" />

              <div className="flex items-center justify-between px-3 py-1.5 text-zinc-400">
                <span>Theme</span>
                <ThemeToggle />
              </div>

              <div className="my-1 border-t border-white/10" />

              <button
                type="button"
                onClick={handleSignOut}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-red-400 hover:bg-red-500/10 transition-colors text-left"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out</span>
              </button>
            </div>
          </>
        )}
      </div>
    </nav>
  );
}
