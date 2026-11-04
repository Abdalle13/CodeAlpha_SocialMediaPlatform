import { useState, useEffect, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '../../lib/supabaseClient';
import { useAuth } from '../auth/AuthContext';

export function useNotifications() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchNotifications = useCallback(async () => {
    if (!isSupabaseConfigured() || !user) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const { data, error: fetchErr } = await supabase
        .from('notifications')
        .select(`
          id,
          recipient_id,
          actor_id,
          type,
          target_type,
          target_id,
          read_at,
          created_at,
          actor:profiles!actor_id (
            id,
            username,
            display_name,
            avatar_url
          )
        `)
        .eq('recipient_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (fetchErr) throw fetchErr;

      const items = data || [];
      setNotifications(items);
      setUnreadCount(items.filter((n) => !n.read_at).length);
    } catch (err) {
      setError(err.message || 'Could not load notifications.');
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  // Initial load and realtime subscription
  useEffect(() => {
    fetchNotifications();

    if (!user || !isSupabaseConfigured()) return;

    const channel = supabase
      .channel(`notifications:${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `recipient_id=eq.${user.id}`,
        },
        () => {
          fetchNotifications();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, fetchNotifications]);

  const markAllAsRead = async () => {
    if (!user || !isSupabaseConfigured()) return;

    // Optimistically mark all read
    setNotifications((prev) =>
      prev.map((n) => ({ ...n, read_at: n.read_at || new Date().toISOString() }))
    );
    setUnreadCount(0);

    try {
      await supabase
        .from('notifications')
        .update({ read_at: new Date().toISOString() })
        .eq('recipient_id', user.id)
        .is('read_at', null);
    } catch (err) {
      console.error('Failed to mark notifications read:', err);
      fetchNotifications();
    }
  };

  const markAsRead = async (id) => {
    if (!user || !isSupabaseConfigured()) return;

    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read_at: new Date().toISOString() } : n))
    );
    setUnreadCount((c) => Math.max(0, c - 1));

    try {
      await supabase
        .from('notifications')
        .update({ read_at: new Date().toISOString() })
        .eq('id', id);
    } catch (err) {
      console.error('Failed to mark notification read:', err);
    }
  };

  return {
    notifications,
    unreadCount,
    isLoading,
    error,
    markAllAsRead,
    markAsRead,
    refresh: fetchNotifications,
  };
}

