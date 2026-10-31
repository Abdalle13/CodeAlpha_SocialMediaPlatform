import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Dialog } from '../../components/Dialog';
import { Avatar } from '../../components/Avatar';
import { Skeleton } from '../../components/Skeleton';
import { EmptyState } from '../../components/EmptyState';
import { supabase } from '../../lib/supabaseClient';
import { Users } from 'lucide-react';

export function FollowersModal({
  isOpen,
  onClose,
  userId,
  type = 'followers', // 'followers' or 'following'
  username = '',
}) {
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!isOpen || !userId) return;

    let isMounted = true;
    setIsLoading(true);
    setError(null);

    async function loadUsers() {
      try {
        let query;
        if (type === 'followers') {
          // Fetch people following this user
          query = supabase
            .from('follows')
            .select('created_at, profile:follower_id(id, username, display_name, avatar_url, bio)')
            .eq('following_id', userId);
        } else {
          // Fetch people this user follows
          query = supabase
            .from('follows')
            .select('created_at, profile:following_id(id, username, display_name, avatar_url, bio)')
            .eq('follower_id', userId);
        }

        const { data, error: fetchErr } = await query;
        if (fetchErr) throw fetchErr;

        if (isMounted) {
          const list = (data || [])
            .map((item) => item.profile)
            .filter(Boolean);
          setUsers(list);
        }
      } catch (err) {
        if (isMounted) setError(err.message || 'Could not load community members.');
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadUsers();

    return () => {
      isMounted = false;
    };
  }, [isOpen, userId, type]);

  const title = type === 'followers' ? 'Followers' : 'Following';

  return (
    <Dialog isOpen={isOpen} onClose={onClose} title={title}>
      <div className="max-h-[60vh] overflow-y-auto px-1 divide-y divide-border/60">
        {isLoading ? (
          <div className="space-y-4 py-2">
            {[1, 2, 3].map((n) => (
              <div key={n} className="flex items-center gap-3">
                <Skeleton variant="circular" width={40} height={40} />
                <div className="space-y-1.5 flex-1">
                  <Skeleton variant="text" width="40%" />
                  <Skeleton variant="text" width="25%" height={12} />
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="py-6 text-center text-sm text-danger">
            {error}
          </div>
        ) : users.length === 0 ? (
          <EmptyState
            icon={Users}
            title={type === 'followers' ? 'No followers yet' : 'Not following anyone yet'}
            description={
              type === 'followers'
                ? `@${username} does not have any followers yet.`
                : `@${username} is not following anyone yet.`
            }
          />
        ) : (
          users.map((u) => (
            <div key={u.id} className="flex items-center justify-between py-3">
              <Link
                to={`/profile/${u.username}`}
                onClick={onClose}
                className="flex items-center gap-3 min-w-0 flex-1 hover:opacity-80 transition-opacity rounded focus-visible:outline-accent"
              >
                <Avatar src={u.avatar_url} name={u.display_name} size="md" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-primary truncate leading-snug">
                    {u.display_name}
                  </p>
                  <p className="text-xs text-secondary truncate">
                    @{u.username}
                  </p>
                </div>
              </Link>
            </div>
          ))
        )}
      </div>
    </Dialog>
  );
}

