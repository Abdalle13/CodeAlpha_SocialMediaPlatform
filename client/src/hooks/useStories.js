import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../features/auth/AuthContext';

/**
 * useStories - Fetch stories for the feed (own + followed users)
 * Returns stories grouped by user, with the current user's stories first.
 */
export function useStories() {
  const { user } = useAuth();
  const [storiesByUser, setStoriesByUser] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchStories = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    setError(null);

    try {
      // Fetch active stories from followed users + own stories
      const { data, error: fetchError } = await supabase
        .from('stories')
        .select(`
          id,
          user_id,
          image_url,
          imagekit_file_id,
          caption,
          created_at,
          expires_at,
          profiles:user_id (
            id,
            username,
            display_name,
            avatar_url
          )
        `)
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      const stories = data || [];

      // Fetch which stories the current user has already viewed
      const storyIds = stories.map((s) => s.id);
      let viewedIds = new Set();
      if (storyIds.length > 0) {
        const { data: views } = await supabase
          .from('story_views')
          .select('story_id')
          .eq('viewer_id', user.id)
          .in('story_id', storyIds);
        viewedIds = new Set((views || []).map((v) => v.story_id));
      }

      // Group stories by user_id, with viewed flag
      const grouped = {};
      for (const story of stories) {
        const uid = story.user_id;
        if (!grouped[uid]) {
          grouped[uid] = {
            user: story.profiles,
            stories: [],
            hasUnviewed: false,
          };
        }
        const enriched = { ...story, viewed: viewedIds.has(story.id) };
        grouped[uid].stories.push(enriched);
        if (!enriched.viewed) grouped[uid].hasUnviewed = true;
      }

      // Convert to array: own stories first, then others
      const list = Object.values(grouped).filter((g) => g && g.user);
      list.sort((a, b) => {
        if (a.user?.id === user.id) return -1;
        if (b.user?.id === user.id) return 1;
        // Unviewed before viewed
        if (a.hasUnviewed && !b.hasUnviewed) return -1;
        if (!a.hasUnviewed && b.hasUnviewed) return 1;
        return 0;
      });

      setStoriesByUser(list);
    } catch (err) {
      console.error('Stories fetch error:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchStories();
  }, [fetchStories]);

  /**
   * Mark a story as viewed
   */
  const markViewed = useCallback(async (storyId) => {
    if (!user) return;
    await supabase
      .from('story_views')
      .upsert({ story_id: storyId, viewer_id: user.id }, { onConflict: 'story_id,viewer_id' });

    // Update local state optimistically
    setStoriesByUser((prev) =>
      prev.map((group) => ({
        ...group,
        stories: group.stories.map((s) =>
          s.id === storyId ? { ...s, viewed: true } : s
        ),
        hasUnviewed: group.stories.some(
          (s) => s.id !== storyId && !s.viewed
        ),
      }))
    );
  }, [user]);

  /**
   * Add a newly created story to local state immediately
   */
  const addStory = useCallback((story, profile) => {
    setStoriesByUser((prev) => {
      const existing = prev.find((g) => g.user.id === profile.id);
      const enriched = { ...story, viewed: false, profiles: profile };
      if (existing) {
        return [
          {
            ...existing,
            stories: [enriched, ...existing.stories],
            hasUnviewed: true,
          },
          ...prev.filter((g) => g.user.id !== profile.id),
        ];
      }
      return [
        { user: profile, stories: [enriched], hasUnviewed: true },
        ...prev,
      ];
    });
  }, []);

  /**
   * Remove a story from local state (after deletion)
   */
  const removeStory = useCallback((storyId) => {
    setStoriesByUser((prev) =>
      prev
        .map((group) => ({
          ...group,
          stories: group.stories.filter((s) => s.id !== storyId),
        }))
        .filter((group) => group.stories.length > 0)
    );
  }, []);

  return { storiesByUser, isLoading, error, refetch: fetchStories, markViewed, addStory, removeStory };
}
