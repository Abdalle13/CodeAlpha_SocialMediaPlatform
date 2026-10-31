import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Calendar,
  Globe,
  MoreHorizontal,
  Share2,
  ShieldAlert,
  Grid,
  Bookmark,
  Check,
  UserX,
} from 'lucide-react';
import { useAuth } from '../features/auth/AuthContext';
import { useProfile } from '../features/profiles/useProfile';
import { FollowersModal } from '../features/profiles/FollowersModal';
import { Avatar } from '../components/Avatar';
import { Button } from '../components/Button';
import { Skeleton } from '../components/Skeleton';
import { EmptyState } from '../components/EmptyState';
import { Toast } from '../components/Toast';

export function ProfilePage() {
  const { username } = useParams();
  const { user } = useAuth();
  const {
    profile,
    followerCount,
    followingCount,
    isFollowing,
    isBlocked,
    isLoading,
    error,
    actionLoading,
    follow,
    unfollow,
    toggleBlock,
  } = useProfile(username);

  const [activeTab, setActiveTab] = useState('posts');
  const [modalType, setModalType] = useState(null); // 'followers' | 'following' | null
  const [toastMessage, setToastMessage] = useState(null);
  const [optionsOpen, setOptionsOpen] = useState(false);

  const isOwnProfile = user && profile && user.id === profile.id;

  const showToast = (message, type = 'info') => {
    setToastMessage({ message, type });
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleCopyLink = async () => {
    setOptionsOpen(false);
    try {
      await navigator.clipboard.writeText(window.location.href);
      showToast('Profile link copied to clipboard.', 'success');
    } catch {
      showToast('Could not copy link.', 'error');
    }
  };

  const handleFollowClick = async () => {
    if (!user) {
      return;
    }
    try {
      if (isFollowing) {
        await unfollow();
      } else {
        await follow();
      }
    } catch (err) {
      showToast(err.message || 'Action failed.', 'error');
    }
  };

  const handleBlockClick = async () => {
    setOptionsOpen(false);
    try {
      await toggleBlock();
      showToast(isBlocked ? 'User unblocked.' : 'User blocked.', 'success');
    } catch (err) {
      showToast(err.message || 'Action failed.', 'error');
    }
  };

  const formatJoinDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  if (isLoading) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
        <Skeleton variant="rectangular" className="w-full h-44 sm:h-56 rounded-2xl mb-6" />
        <div className="flex flex-col sm:flex-row gap-6 items-start px-2">
          <Skeleton variant="circular" width={96} height={96} className="-mt-14" />
          <div className="space-y-3 flex-1">
            <Skeleton variant="text" width="45%" height={28} />
            <Skeleton variant="text" width="25%" height={16} />
            <Skeleton variant="text" width="70%" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-20 text-center">
        <EmptyState
          icon={UserX}
          title="Profile not found"
          description="The user you are looking for does not exist or may have changed their username."
          action={
            <Link to="/">
              <Button variant="secondary" size="md">
                Return home
              </Button>
            </Link>
          }
        />
      </div>
    );
  }

  if (profile.status === 'suspended') {
    return (
      <div className="mx-auto max-w-2xl px-4 py-20 text-center">
        <EmptyState
          icon={ShieldAlert}
          title="Account suspended"
          description="This profile is currently suspended for violating Veyra community standards."
        />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6">
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50">
          <Toast type={toastMessage.type} message={toastMessage.message} />
        </div>
      )}

      {/* Profile Header Card */}
      <div className="rounded-2xl border border-border bg-surface overflow-hidden shadow-sm">
        {/* Cover Photo or Fallback Tone */}
        <div className="relative h-36 sm:h-52 w-full bg-gradient-to-r from-accent/20 via-accent/10 to-surface-raised overflow-hidden">
          {profile.cover_url && (
            <img
              src={profile.cover_url}
              alt={`${profile.display_name} cover`}
              className="w-full h-full object-cover"
            />
          )}
        </div>

        {/* Profile Info Container */}
        <div className="px-5 sm:px-8 pb-7">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 -mt-12 sm:-mt-16 mb-5">
            {/* Avatar */}
            <div className="ring-4 ring-surface rounded-full self-start">
              <Avatar
                src={profile.avatar_url}
                name={profile.display_name}
                size="2xl"
                className="w-24 h-24 sm:w-28 sm:h-28 text-2xl"
              />
            </div>

            {/* Profile Action Buttons */}
            <div className="flex items-center gap-2.5 self-start sm:self-auto">
              {isOwnProfile ? (
                <Link to="/settings/profile">
                  <Button variant="outline" size="sm">
                    Edit profile
                  </Button>
                </Link>
              ) : user ? (
                <>
                  <Button
                    variant={isFollowing ? 'secondary' : 'primary'}
                    size="sm"
                    isLoading={actionLoading}
                    onClick={handleFollowClick}
                    className="min-w-[96px]"
                  >
                    {isFollowing ? (
                      <span className="flex items-center gap-1.5">
                        <Check className="w-3.5 h-3.5" />
                        <span>Following</span>
                      </span>
                    ) : (
                      'Follow'
                    )}
                  </Button>

                  {/* Options Menu */}
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setOptionsOpen((prev) => !prev)}
                      aria-label="More profile options"
                      className="inline-flex items-center justify-center h-8 w-8 rounded-lg border border-border bg-surface text-secondary hover:text-primary hover:bg-page transition-colors focus-visible:outline-accent"
                    >
                      <MoreHorizontal className="w-4 h-4" />
                    </button>

                    {optionsOpen && (
                      <div className="absolute right-0 mt-1.5 w-48 rounded-xl border border-border bg-surface shadow-lg py-1.5 z-20 text-xs">
                        <button
                          type="button"
                          onClick={handleCopyLink}
                          className="w-full px-3.5 py-2 text-left flex items-center gap-2.5 text-primary hover:bg-page transition-colors"
                        >
                          <Share2 className="w-3.5 h-3.5 text-secondary" />
                          <span>Copy profile link</span>
                        </button>
                        <button
                          type="button"
                          onClick={handleBlockClick}
                          className="w-full px-3.5 py-2 text-left flex items-center gap-2.5 text-danger hover:bg-danger-soft transition-colors"
                        >
                          <UserX className="w-3.5 h-3.5" />
                          <span>{isBlocked ? 'Unblock user' : 'Block user'}</span>
                        </button>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <Link to="/login">
                  <Button variant="primary" size="sm">
                    Follow
                  </Button>
                </Link>
              )}
            </div>
          </div>

          {/* User Names & Bio */}
          <div className="space-y-3">
            <div>
              <h1 className="text-xl sm:text-2xl font-serif font-medium text-primary leading-tight">
                {profile.display_name}
              </h1>
              <p className="text-sm text-secondary font-mono">
                @{profile.username}
              </p>
            </div>

            {profile.bio && (
              <p className="text-sm text-primary leading-relaxed max-w-2xl whitespace-pre-line font-sans">
                {profile.bio}
              </p>
            )}

            {/* Meta details: Website, Join Date */}
            <div className="flex flex-wrap items-center gap-4 text-xs text-secondary pt-1">
              {profile.website && (
                <a
                  href={profile.website.startsWith('http') ? profile.website : `https://${profile.website}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-accent hover:underline focus-visible:outline-accent rounded"
                >
                  <Globe className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate max-w-[200px]">
                    {profile.website.replace(/^https?:\/\//, '')}
                  </span>
                </a>
              )}

              <div className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 shrink-0 text-secondary" />
                <span>Joined {formatJoinDate(profile.created_at)}</span>
              </div>
            </div>

            {/* Followers / Following Counts */}
            <div className="flex items-center gap-6 pt-3 border-t border-border/70 text-sm">
              <button
                type="button"
                onClick={() => setModalType('followers')}
                className="hover:underline focus-visible:outline-accent rounded text-left"
              >
                <span className="font-semibold text-primary">{followerCount}</span>{' '}
                <span className="text-secondary text-xs">Followers</span>
              </button>

              <button
                type="button"
                onClick={() => setModalType('following')}
                className="hover:underline focus-visible:outline-accent rounded text-left"
              >
                <span className="font-semibold text-primary">{followingCount}</span>{' '}
                <span className="text-secondary text-xs">Following</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Profile Content Navigation Tabs */}
      <div className="mt-8 border-b border-border">
        <nav className="flex gap-8" aria-label="Profile sections">
          <button
            type="button"
            onClick={() => setActiveTab('posts')}
            className={`flex items-center gap-2 pb-3.5 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'posts'
                ? 'border-accent text-accent'
                : 'border-transparent text-secondary hover:text-primary'
            }`}
          >
            <Grid className="w-4 h-4" />
            <span>Posts</span>
          </button>

          {isOwnProfile && (
            <button
              type="button"
              onClick={() => setActiveTab('saved')}
              className={`flex items-center gap-2 pb-3.5 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'saved'
                  ? 'border-accent text-accent'
                  : 'border-transparent text-secondary hover:text-primary'
              }`}
            >
              <Bookmark className="w-4 h-4" />
              <span>Saved</span>
            </button>
          )}
        </nav>
      </div>

      {/* Tab Panels */}
      <div className="py-12">
        {activeTab === 'posts' ? (
          <EmptyState
            icon={Grid}
            title="No posts yet"
            description={
              isOwnProfile
                ? 'Photographs and thoughts you share will appear here on your profile.'
                : `@${profile.username} has not published any posts yet.`
            }
          />
        ) : (
          <EmptyState
            icon={Bookmark}
            title="No saved posts"
            description="Posts you bookmark will be stored here privately for your reference."
          />
        )}
      </div>

      {/* Community Modal for Followers & Following */}
      {modalType && (
        <FollowersModal
          isOpen={Boolean(modalType)}
          onClose={() => setModalType(null)}
          userId={profile.id}
          username={profile.username}
          type={modalType}
        />
      )}
    </div>
  );
}

