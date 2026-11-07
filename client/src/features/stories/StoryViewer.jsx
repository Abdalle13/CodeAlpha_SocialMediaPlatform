import React, { useState, useEffect, useRef, useCallback } from 'react';
import { X, Eye, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import { deleteFromImageKit } from '../media/imagekit';
import { useAuth } from '../auth/AuthContext';
import { Avatar } from '../../components/Avatar';
function formatStoryAge(isoString) {
  if (!isoString) return '';
  const diff = Math.floor((Date.now() - new Date(isoString)) / 1000);
  if (diff < 60) return 'Just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

const STORY_DURATION_MS = 5000; // 5 seconds per story

/**
 * StoryViewer
 * Full-screen story viewer with progress bar, tap-to-advance, and swipe between users.
 */
export function StoryViewer({ groups, startGroupIndex = 0, startStoryIndex = 0, onClose, onViewed, onDeleted }) {
  const { user } = useAuth();

  const [groupIndex, setGroupIndex] = useState(startGroupIndex);
  const [storyIndex, setStoryIndex] = useState(startStoryIndex);
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [viewCounts, setViewCounts] = useState({});
  const [imageLoaded, setImageLoaded] = useState(false);

  const intervalRef = useRef(null);
  const hasMarkedView = useRef(new Set());

  const currentGroup = groups[groupIndex];
  const currentStory = currentGroup?.stories[storyIndex];
  const isOwnStory = currentStory?.user_id === user?.id;

  // Fetch view count for own stories
  useEffect(() => {
    if (!isOwnStory || !currentStory) return;
    supabase
      .from('story_views')
      .select('id', { count: 'exact' })
      .eq('story_id', currentStory.id)
      .then(({ count }) => {
        setViewCounts((prev) => ({ ...prev, [currentStory.id]: count || 0 }));
      });
  }, [currentStory?.id, isOwnStory]);

  // Mark story as viewed
  useEffect(() => {
    if (!currentStory || isOwnStory) return;
    if (hasMarkedView.current.has(currentStory.id)) return;
    hasMarkedView.current.add(currentStory.id);
    onViewed?.(currentStory.id);
  }, [currentStory?.id, isOwnStory, onViewed]);

  const goNext = useCallback(() => {
    setImageLoaded(false);
    setProgress(0);
    if (storyIndex < currentGroup.stories.length - 1) {
      setStoryIndex((i) => i + 1);
    } else if (groupIndex < groups.length - 1) {
      setGroupIndex((g) => g + 1);
      setStoryIndex(0);
    } else {
      onClose();
    }
  }, [storyIndex, groupIndex, currentGroup, groups, onClose]);

  const goPrev = useCallback(() => {
    setImageLoaded(false);
    setProgress(0);
    if (storyIndex > 0) {
      setStoryIndex((i) => i - 1);
    } else if (groupIndex > 0) {
      const prevGroup = groups[groupIndex - 1];
      setGroupIndex((g) => g - 1);
      setStoryIndex(prevGroup.stories.length - 1);
    }
  }, [storyIndex, groupIndex, groups]);

  // Auto-progress timer
  useEffect(() => {
    if (!imageLoaded || isPaused) return;
    intervalRef.current = setInterval(() => {
      setProgress((p) => {
        const next = p + (100 / (STORY_DURATION_MS / 100));
        if (next >= 100) {
          clearInterval(intervalRef.current);
          goNext();
          return 100;
        }
        return next;
      });
    }, 100);
    return () => clearInterval(intervalRef.current);
  }, [imageLoaded, isPaused, goNext]);

  // Reset progress when story changes
  useEffect(() => {
    setProgress(0);
    setImageLoaded(false);
  }, [currentStory?.id]);

  const handleDelete = async () => {
    if (!currentStory) return;
    if (!confirm('Delete this story?')) return;
    try {
      if (currentStory.imagekit_file_id) {
        await deleteFromImageKit(currentStory.imagekit_file_id);
      }
      await supabase.from('stories').delete().eq('id', currentStory.id);
      onDeleted?.(currentStory.id);
      goNext();
    } catch (err) {
      console.error('Delete story error:', err);
    }
  };

  if (!currentGroup || !currentStory) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-black flex items-center justify-center">
      {/* Story container - portrait aspect ratio, centered */}
      <div className="relative w-full h-full sm:w-auto sm:h-full sm:max-h-screen sm:aspect-[9/16] overflow-hidden">
        {/* Background image */}
        <img
          key={currentStory.id}
          src={currentStory.image_url}
          alt="Story"
          onLoad={() => setImageLoaded(true)}
          className="absolute inset-0 w-full h-full object-cover"
        />

        {/* Gradient overlays */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-black/60 pointer-events-none" />

        {/* Progress bars - one per story in current group */}
        <div className="absolute top-0 left-0 right-0 flex gap-1 p-3 pt-safe">
          {currentGroup.stories.map((s, idx) => (
            <div
              key={s.id}
              className="flex-1 h-0.5 rounded-full bg-white/30 overflow-hidden"
            >
              <div
                className="h-full bg-white rounded-full transition-none"
                style={{
                  width:
                    idx < storyIndex
                      ? '100%'
                      : idx === storyIndex
                      ? `${progress}%`
                      : '0%',
                }}
              />
            </div>
          ))}
        </div>

        {/* Top bar: avatar + name + time + close */}
        <div className="absolute top-6 left-0 right-0 flex items-center gap-2.5 px-3">
          <Avatar
            src={currentGroup.user.avatar_url}
            name={currentGroup.user.display_name || currentGroup.user.username}
            size="sm"
          />
          <div className="flex-1 min-w-0">
            <p className="text-white text-xs font-semibold truncate">
              {currentGroup.user.display_name || currentGroup.user.username}
            </p>
            <p className="text-white/70 text-[10px]">
            {formatStoryAge(currentStory.created_at)}
            </p>
          </div>

          {/* View count badge (only own stories) */}
          {isOwnStory && (
            <span className="flex items-center gap-1 text-white/80 text-[11px]">
              <Eye className="w-3.5 h-3.5" />
              {viewCounts[currentStory.id] ?? 0}
            </span>
          )}

          {/* Delete button (only own stories) */}
          {isOwnStory && (
            <button
              onClick={handleDelete}
              className="p-1.5 rounded-full bg-black/30 text-white/80 hover:text-red-400 transition-colors"
              aria-label="Delete story"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}

          <button
            onClick={onClose}
            className="p-1.5 rounded-full bg-black/30 text-white/80 hover:text-white transition-colors"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Caption */}
        {currentStory.caption && (
          <div className="absolute bottom-10 left-0 right-0 px-4">
            <p className="text-white text-sm text-center leading-snug drop-shadow-lg">
              {currentStory.caption}
            </p>
          </div>
        )}

        {/* Tap zones: left = prev, right = next, hold = pause */}
        <div className="absolute inset-0 flex">
          <button
            className="flex-1 h-full flex items-center pl-2 opacity-0 focus:opacity-0"
            onClick={goPrev}
            onMouseDown={() => setIsPaused(true)}
            onMouseUp={() => setIsPaused(false)}
            onTouchStart={() => setIsPaused(true)}
            onTouchEnd={() => setIsPaused(false)}
            aria-label="Previous story"
          />
          <button
            className="flex-[2] h-full flex items-center justify-end pr-2 opacity-0 focus:opacity-0"
            onClick={goNext}
            onMouseDown={() => setIsPaused(true)}
            onMouseUp={() => setIsPaused(false)}
            onTouchStart={() => setIsPaused(true)}
            onTouchEnd={() => setIsPaused(false)}
            aria-label="Next story"
          />
        </div>

        {/* Visible nav arrows (desktop) */}
        {groupIndex > 0 && (
          <button
            onClick={(e) => { e.stopPropagation(); goPrev(); }}
            className="hidden sm:flex absolute left-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/40 text-white hover:bg-black/60 transition-colors z-10"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
        )}
        {groupIndex < groups.length - 1 && (
          <button
            onClick={(e) => { e.stopPropagation(); goNext(); }}
            className="hidden sm:flex absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/40 text-white hover:bg-black/60 transition-colors z-10"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Click outside to close (desktop) */}
      <button
        className="hidden sm:block absolute inset-0 -z-10"
        onClick={onClose}
        aria-label="Close viewer"
      />
    </div>
  );
}
