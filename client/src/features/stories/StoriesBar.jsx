import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import { useAuth } from '../auth/AuthContext';
import { useStories } from '../../hooks/useStories';
import { StoryViewer } from './StoryViewer';
import { StoryCreateModal } from './StoryCreateModal';
import { Avatar } from '../../components/Avatar';
import { Skeleton } from '../../components/Skeleton';

/**
 * StoriesBar
 * Horizontal scrollable row of story circles shown at the top of the feed.
 * - First circle: current user's story / "Add Story" button
 * - Remaining circles: followed users who have active stories
 */
export function StoriesBar() {
  const { user, profile } = useAuth();
  const { storiesByUser, isLoading, markViewed, addStory, removeStory } = useStories();

  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerGroupIndex, setViewerGroupIndex] = useState(0);
  const [createOpen, setCreateOpen] = useState(false);

  const ownGroup = storiesByUser.find((g) => g.user.id === user?.id);
  const otherGroups = storiesByUser.filter((g) => g.user.id !== user?.id);

  const handleOpenViewer = (groupIndex) => {
    setViewerGroupIndex(groupIndex);
    setViewerOpen(true);
  };

  const handleOwnCircleClick = () => {
    if (ownGroup) {
      // Open own stories for viewing/deleting
      handleOpenViewer(storiesByUser.findIndex((g) => g.user.id === user?.id));
    } else {
      setCreateOpen(true);
    }
  };

  const handleStoryCreated = (story) => {
    addStory(story, {
      id: profile.id,
      username: profile.username,
      display_name: profile.display_name,
      avatar_url: profile.avatar_url,
    });
  };

  if (isLoading) {
    return (
      <div className="flex gap-3 overflow-x-auto px-1 pb-1 no-scrollbar">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex flex-col items-center gap-1 shrink-0">
            <Skeleton className="w-14 h-14 rounded-full" />
            <Skeleton className="w-10 h-2 rounded" />
          </div>
        ))}
      </div>
    );
  }

  // Don't render the bar at all if there are no stories and nothing to show
  // Always show if the user is logged in (they can always add one)
  if (!user) return null;

  return (
    <>
      <div className="flex gap-3 overflow-x-auto px-1 pb-1 no-scrollbar">
        {/* Own story circle */}
        <StoryCircle
          label="Your Story"
          avatarSrc={profile?.avatar_url}
          avatarName={profile?.display_name || profile?.username || 'You'}
          hasUnviewed={false}
          isOwn
          hasStory={!!ownGroup}
          onClick={handleOwnCircleClick}
          onAddClick={() => setCreateOpen(true)}
        />

        {/* Followed users' stories */}
        {otherGroups.map((group, idx) => (
          <StoryCircle
            key={group.user.id}
            label={group.user.display_name || group.user.username}
            avatarSrc={group.user.avatar_url}
            avatarName={group.user.display_name || group.user.username}
            hasUnviewed={group.hasUnviewed}
            onClick={() => {
              // Find real index in full storiesByUser list
              const realIdx = storiesByUser.findIndex((g) => g.user.id === group.user.id);
              handleOpenViewer(realIdx);
            }}
          />
        ))}
      </div>

      {/* Story Viewer */}
      {viewerOpen && storiesByUser.length > 0 && (
        <StoryViewer
          groups={storiesByUser}
          startGroupIndex={viewerGroupIndex}
          startStoryIndex={0}
          onClose={() => setViewerOpen(false)}
          onViewed={markViewed}
          onDeleted={(storyId) => {
            removeStory(storyId);
            setViewerOpen(false);
          }}
        />
      )}

      {/* Create Story Modal */}
      <StoryCreateModal
        isOpen={createOpen}
        onClose={() => setCreateOpen(false)}
        onStoryCreated={handleStoryCreated}
      />
    </>
  );
}

/* ---------------------------------------------------------------------------
 * StoryCircle — a single avatar ring button
 * --------------------------------------------------------------------------- */
function StoryCircle({ label, avatarSrc, avatarName, hasUnviewed, isOwn, hasStory, onClick, onAddClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex flex-col items-center gap-1.5 shrink-0 group focus:outline-none"
    >
      <div className="relative">
        {/* Gradient ring for unviewed stories */}
        <div
          className={`w-[62px] h-[62px] rounded-full flex items-center justify-center transition-all
            ${hasUnviewed
              ? 'bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600 p-[2.5px]'
              : isOwn
              ? 'bg-border p-[2px]'
              : 'bg-border/50 p-[2px]'
            }`}
        >
          <div className="w-full h-full rounded-full bg-page overflow-hidden flex items-center justify-center">
            <Avatar src={avatarSrc} name={avatarName} size="lg" className="w-full h-full" />
          </div>
        </div>

        {/* "+" add button overlay for own circle */}
        {isOwn && (
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onAddClick(); }}
            className="absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full bg-accent flex items-center justify-center border-2 border-page hover:brightness-110 transition-all"
            aria-label="Add story"
          >
            <Plus className="w-3 h-3 text-white" />
          </button>
        )}
      </div>

      <span className="text-[10px] text-secondary truncate max-w-[60px] text-center leading-tight group-hover:text-primary transition-colors">
        {label}
      </span>
    </button>
  );
}

