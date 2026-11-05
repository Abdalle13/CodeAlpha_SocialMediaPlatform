import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useNotifications } from '../features/notifications/useNotifications';
import { useAuth } from '../features/auth/AuthContext';
import { supabase } from '../lib/supabaseClient';
import { Avatar } from '../components/Avatar';
import { Button } from '../components/Button';
import { EmptyState } from '../components/EmptyState';
import { Skeleton } from '../components/Skeleton';
import {
  Bell,
  Heart,
  MessageCircle,
  UserPlus,
  Mail,
  CheckCheck,
  UserCheck,
} from 'lucide-react';

function getNotificationContent(item) {
  if (!item) {
    return {
      icon: Bell,
      iconClass: 'text-secondary bg-surface',
      text: <span>New notification</span>,
      link: null,
    };
  }

  const actorName = item.actor?.display_name || item.actor?.username || 'Someone';

  switch (item.type) {
    case 'like':
      return {
        icon: Heart,
        iconClass: 'text-red-500 bg-red-500/10',
        text: (
          <span>
            <strong className="font-semibold text-primary">{actorName}</strong> liked your post.
          </span>
        ),
        link: item.target_id ? `/post/${item.target_id}` : null,
      };
    case 'comment':
      return {
        icon: MessageCircle,
        iconClass: 'text-blue-500 bg-blue-500/10',
        text: (
          <span>
            <strong className="font-semibold text-primary">{actorName}</strong> commented on your post.
          </span>
        ),
        link: item.target_id ? `/post/${item.target_id}` : null,
      };
    case 'follow':
      return {
        icon: UserPlus,
        iconClass: 'text-accent bg-accent-soft',
        text: (
          <span>
            <strong className="font-semibold text-primary">{actorName}</strong> started following you.
          </span>
        ),
        link: item.actor?.username ? `/profile/${item.actor.username}` : null,
      };
    case 'message':
      return {
        icon: Mail,
        iconClass: 'text-emerald-500 bg-emerald-500/10',
        text: (
          <span>
            <strong className="font-semibold text-primary">{actorName}</strong> sent you a direct message.
          </span>
        ),
        link: '/messages',
      };
    default:
      return {
        icon: Bell,
        iconClass: 'text-secondary bg-surface',
        text: (
          <span>
            <strong className="font-semibold text-primary">{actorName}</strong> sent an update.
          </span>
        ),
        link: null,
      };
  }
}

function formatNotificationTime(isoString) {
  if (!isoString) return '';
  try {
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return '';
    const now = new Date();
    const diffInMinutes = Math.floor((now - date) / 60000);

    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;

    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  } catch {
    return '';
  }
}

// Follow-back button for follow notifications
function FollowBackButton({ actorId }) {
  const { user } = useAuth();
  const [status, setStatus] = useState('idle'); // 'idle' | 'loading' | 'following' | 'error'

  useEffect(() => {
    if (!user || !actorId) return;
    // Check if already following
    supabase
      .from('follows')
      .select('id')
      .eq('follower_id', user.id)
      .eq('following_id', actorId)
      .maybeSingle()
      .then(({ data }) => {
        if (data) setStatus('following');
      });
  }, [user, actorId]);

  const handleFollowBack = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user || status === 'following' || status === 'loading') return;

    setStatus('loading');
    try {
      const { error } = await supabase
        .from('follows')
        .insert({ follower_id: user.id, following_id: actorId });

      if (error) throw error;
      setStatus('following');
    } catch {
      setStatus('idle');
    }
  };

  if (status === 'following') {
    return (
      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-page border border-border text-[11px] font-medium text-secondary shrink-0">
        <UserCheck className="w-3 h-3" />
        Following
      </span>
    );
  }

  return (
    <button
      type="button"
      onClick={handleFollowBack}
      disabled={status === 'loading'}
      className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-accent text-white text-[11px] font-semibold shrink-0 hover:bg-accent/90 transition-colors disabled:opacity-60"
    >
      {status === 'loading' ? (
        <span>...</span>
      ) : (
        <>
          <UserPlus className="w-3 h-3" />
          Follow back
        </>
      )}
    </button>
  );
}

export function NotificationsPage() {
  const {
    notifications,
    unreadCount,
    isLoading,
    error,
    markAllAsRead,
    markAsRead,
  } = useNotifications();

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-primary">Notifications</h1>
          <p className="text-xs text-secondary mt-0.5">
            Activity and interactions regarding your account.
          </p>
        </div>

        {unreadCount > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={markAllAsRead}
            className="gap-1.5 text-xs"
          >
            <CheckCheck className="w-3.5 h-3.5" />
            <span>Mark all read</span>
          </Button>
        )}
      </div>

      {error && (
        <div className="mb-6 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-xs text-red-600 dark:text-red-400">
          <p className="font-medium">Could not load activity</p>
          <p className="mt-1 opacity-90">{error}</p>
        </div>
      )}

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex items-center gap-3.5 p-3.5 rounded-xl border border-border bg-surface">
              <Skeleton className="w-10 h-10 rounded-full shrink-0" />
              <div className="space-y-1.5 flex-1">
                <Skeleton className="w-48 h-4 rounded" />
                <Skeleton className="w-20 h-3 rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : notifications.length === 0 ? (
        <EmptyState
          icon={Bell}
          title="All caught up"
          description="When members interact with your posts or profile, you will see it here."
        />
      ) : (
        <div className="space-y-2">
          {notifications.map((item) => {
            const itemContent = getNotificationContent(item) || {};
            const Icon = itemContent.icon || Bell;
            const iconClass = itemContent.iconClass || 'text-secondary bg-surface';
            const text = itemContent.text || 'Notification';
            const link = itemContent.link || null;
            const isUnread = !item.read_at;
            const isFollowNotif = item.type === 'follow';

            const cardContent = (
              <div
                className={`flex items-center gap-3.5 p-3.5 rounded-xl border transition-colors ${
                  isUnread
                    ? 'border-accent/40 bg-accent-soft/30 dark:bg-accent-soft/10'
                    : 'border-border bg-surface hover:bg-page/50'
                }`}
                onClick={() => {
                  if (isUnread) markAsRead(item.id);
                }}
              >
                <div className="relative shrink-0">
                  <Avatar
                    src={item.actor?.avatar_url}
                    name={item.actor?.display_name || item.actor?.username || 'Member'}
                    size="md"
                  />
                  <div
                    className={`absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full border border-surface shadow-sm ${iconClass}`}
                  >
                    <Icon className="w-3 h-3" />
                  </div>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="text-xs text-primary leading-relaxed">{text}</div>
                  <p className="text-[11px] text-secondary mt-0.5">
                    {formatNotificationTime(item.created_at)}
                  </p>
                </div>

                {/* Follow-back button for follow notifications */}
                {isFollowNotif && item.actor?.id && (
                  <FollowBackButton actorId={item.actor.id} />
                )}

                {isUnread && !isFollowNotif && (
                  <span
                    className="h-2 w-2 rounded-full bg-accent shrink-0"
                    title="Unread notification"
                  />
                )}
              </div>
            );

            return link && !isFollowNotif ? (
              <Link key={item.id} to={link} className="block focus-visible:outline-accent rounded-xl">
                {cardContent}
              </Link>
            ) : (
              <div key={item.id}>{cardContent}</div>
            );
          })}
        </div>
      )}
    </div>
  );
}
