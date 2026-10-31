import { useState, useEffect, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '../../lib/supabaseClient';
import { useAuth } from '../auth/AuthContext';

export function useProfile(username) {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [followerCount, setFollowerCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [isFollowing, setIsFollowing] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchProfileData = useCallback(async () => {
    if (!username || !isSupabaseConfigured()) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // 1. Fetch public profile row
      const { data: profileData, error: profileErr } = await supabase
        .from('profiles')
        .select('*')
        .eq('username', username.toLowerCase())
        .single();

      if (profileErr || !profileData) {
        setError(profileErr?.code === 'PGRST116' ? 'User not found' : 'Could not load profile');
        setProfile(null);
        setIsLoading(false);
        return;
      }

      setProfile(profileData);

      // 2. Fetch follower count
      const { count: followers } = await supabase
        .from('follows')
        .select('*', { count: 'exact', head: true })
        .eq('following_id', profileData.id);

      setFollowerCount(followers || 0);

      // 3. Fetch following count
      const { count: following } = await supabase
        .from('follows')
        .select('*', { count: 'exact', head: true })
        .eq('follower_id', profileData.id);

      setFollowingCount(following || 0);

      // 4. If logged in, check follow relationship and block status
      if (user && user.id !== profileData.id) {
        const { data: followRelation } = await supabase
          .from('follows')
          .select('follower_id')
          .eq('follower_id', user.id)
          .eq('following_id', profileData.id)
          .maybeSingle();

        setIsFollowing(Boolean(followRelation));

        const { data: blockRelation } = await supabase
          .from('blocks')
          .select('blocker_id')
          .eq('blocker_id', user.id)
          .eq('blocked_id', profileData.id)
          .maybeSingle();

        setIsBlocked(Boolean(blockRelation));
      } else {
        setIsFollowing(false);
        setIsBlocked(false);
      }
    } catch (err) {
      setError(err.message || 'An unexpected error occurred while loading profile');
    } finally {
      setIsLoading(false);
    }
  }, [username, user]);

  useEffect(() => {
    fetchProfileData();
  }, [fetchProfileData]);

  const follow = async () => {
    if (!user || !profile || actionLoading) return;
    setActionLoading(true);

    try {
      const { error: insertErr } = await supabase.from('follows').insert({
        follower_id: user.id,
        following_id: profile.id,
      });

      if (insertErr) throw insertErr;

      setIsFollowing(true);
      setFollowerCount((prev) => prev + 1);
    } catch (err) {
      console.error('Follow error:', err.message);
      throw err;
    } finally {
      setActionLoading(false);
    }
  };

  const unfollow = async () => {
    if (!user || !profile || actionLoading) return;
    setActionLoading(true);

    try {
      const { error: deleteErr } = await supabase
        .from('follows')
        .delete()
        .eq('follower_id', user.id)
        .eq('following_id', profile.id);

      if (deleteErr) throw deleteErr;

      setIsFollowing(false);
      setFollowerCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Unfollow error:', err.message);
      throw err;
    } finally {
      setActionLoading(false);
    }
  };

  const toggleBlock = async () => {
    if (!user || !profile || actionLoading) return;
    setActionLoading(true);

    try {
      if (isBlocked) {
        await supabase
          .from('blocks')
          .delete()
          .eq('blocker_id', user.id)
          .eq('blocked_id', profile.id);
        setIsBlocked(false);
      } else {
        // If blocking, unfollow each other first
        await supabase
          .from('follows')
          .delete()
          .or(`and(follower_id.eq.${user.id},following_id.eq.${profile.id}),and(follower_id.eq.${profile.id},following_id.eq.${user.id})`);

        await supabase.from('blocks').insert({
          blocker_id: user.id,
          blocked_id: profile.id,
        });

        setIsBlocked(true);
        setIsFollowing(false);
      }
    } catch (err) {
      console.error('Block toggle error:', err.message);
      throw err;
    } finally {
      setActionLoading(false);
    }
  };

  return {
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
    refresh: fetchProfileData,
  };
}

