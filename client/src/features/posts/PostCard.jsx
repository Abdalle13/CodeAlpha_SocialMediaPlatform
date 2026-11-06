import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { usePostInteractions } from './usePostInteractions';
import { CommentThread } from './CommentThread';
import { EditPostModal } from './EditPostModal';
import { ImageViewerModal } from './ImageViewerModal';
import { ReportModal } from '../moderation/ReportModal';
import { Avatar } from '../../components/Avatar';
import { Button } from '../../components/Button';
import { Dialog } from '../../components/Dialog';
import {
  Heart,
  MessageCircle,
  Bookmark,
  Share2,
  MoreHorizontal,
  Edit2,
  Trash2,
  Globe,
  Users,
  Check,
  Flag,
} from 'lucide-react';

function formatPostDate(isoString) {
  if (!isoString) return '';
  const date = new Date(isoString);
  const now = new Date();
  const diffInSeconds = Math.floor((now - date) / 1000);

  if (diffInSeconds < 60) return 'Just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;

  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
  });
}

export function PostCard({ post, onPostDeleted, onPostUpdated, initialShowComments = false }) {
  const { user } = useAuth();
  const { isLiked, likeCount, isSaved, toggleLike, toggleSave } = usePostInteractions(post);

  const [showComments, setShowComments] = useState(initialShowComments);
  const [menuOpen, setMenuOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [activeMediaUrl, setActiveMediaUrl] = useState(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);

  const author = post.profiles;
  const mediaList = post.post_media || [];
  const isAuthor = user && user.id === post.author_id;

  const handleCopyLink = async () => {
    try {
      const postUrl = `${window.location.origin}/post/${post.id}`;
      await navigator.clipboard.writeText(postUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    } catch {
      // Fallback
    }
  };

  const handleConfirmDelete = async () => {
    setIsDeleting(true);
    try {
      if (onPostDeleted) {
        await onPostDeleted(post.id);
      }
      setIsDeleteModalOpen(false);
    } catch (err) {
      console.error('Delete error:', err);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <article className="rounded-xl border border-border bg-surface shadow-sm overflow-hidden transition-colors">
      {/* Post Header */}
      <div className="p-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <Link
            to={author?.username ? `/profile/${author.username}` : '#'}
            className="focus-visible:outline-accent rounded-full"
          >
            <Avatar
              src={author?.avatar_url}
              name={author?.display_name || 'Member'}
              size="md"
            />
          </Link>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <Link
                to={author?.username ? `/profile/${author.username}` : '#'}
                className="font-semibold text-sm text-primary hover:underline truncate"
              >
                {author?.display_name || 'Veyra Member'}
              </Link>
              {author?.username && (
                <span className="text-secondary text-xs">@{author.username}</span>
              )}
            </div>
            <div className="flex items-center gap-1.5 text-[11px] text-secondary mt-0.5">
              <span>{formatPostDate(post.created_at)}</span>
              <span>&middot;</span>
              <span className="inline-flex items-center gap-1" title={post.visibility === 'followers' ? 'Followers only' : 'Public'}>
                {post.visibility === 'followers' ? (
                  <>
                    <Users className="w-3 h-3 text-accent" />
                    <span className="text-accent">Followers</span>
                  </>
                ) : (
                  <>
                    <Globe className="w-3 h-3" />
                    <span>Public</span>
                  </>
                )}
              </span>
            </div>
          </div>
        </div>

        {/* Header Options Menu */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setMenuOpen((prev) => !prev)}
            aria-label="Post options"
            className="rounded-lg p-1.5 text-secondary hover:text-primary hover:bg-page transition-colors"
          >
            <MoreHorizontal className="w-5 h-5" />
          </button>

          {menuOpen && (
            <div className="absolute right-0 top-full mt-1 w-44 rounded-lg border border-border bg-surface p-1 shadow-lg z-20 text-xs animate-in fade-in duration-100">
              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  handleCopyLink();
                }}
                className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded text-left text-primary hover:bg-page transition-colors"
              >
                {copiedLink ? <Check className="w-3.5 h-3.5 text-accent" /> : <Share2 className="w-3.5 h-3.5 text-secondary" />}
                <span>{copiedLink ? 'Link copied' : 'Copy link'}</span>
              </button>

              {isAuthor ? (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      setMenuOpen(false);
                      setIsEditModalOpen(true);
                    }}
                    className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded text-left text-primary hover:bg-page transition-colors"
                  >
                    <Edit2 className="w-3.5 h-3.5 text-secondary" />
                    <span>Edit post</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setMenuOpen(false);
                      setIsDeleteModalOpen(true);
                    }}
                    disabled={isDeleting}
                    className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded text-left text-red-600 hover:bg-red-500/10 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete post</span>
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    setIsReportModalOpen(true);
                  }}
                  className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded text-left text-secondary hover:text-red-600 hover:bg-red-500/10 transition-colors"
                >
                  <Flag className="w-3.5 h-3.5" />
                  <span>Report post</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Post Caption */}
      {post.caption && (
        <div className="px-4 pb-3">
          <p className="text-sm text-primary whitespace-pre-wrap break-words leading-relaxed">
            {post.caption}
          </p>
        </div>
      )}

      {/* Post Media Gallery */}
      {mediaList.length > 0 && (
        <div className={`border-y border-border/60 bg-black/5 dark:bg-black/20 ${
          mediaList.length === 1 ? '' : 'grid grid-cols-2 gap-0.5'
        }`}>
          {mediaList.map((media, index) => (
            <div
              key={media.id || index}
              onClick={() => setActiveMediaUrl(media.url)}
              className="relative cursor-pointer overflow-hidden group bg-page"
            >
              <img
                src={media.url}
                alt="Post photo"
                loading="lazy"
                className={`w-full object-cover group-hover:scale-[1.01] transition-transform duration-200 ${
                  mediaList.length === 1 ? 'max-h-[550px]' : 'aspect-square'
                }`}
              />
            </div>
          ))}
        </div>
      )}

      {/* Interaction Toolbar */}
      <div className="px-4 py-2.5 flex items-center justify-between border-t border-border/60 text-secondary">
        <div className="flex items-center gap-4">
          {/* Like button */}
          <button
            type="button"
            onClick={toggleLike}
            aria-label={isLiked ? 'Unlike post' : 'Like post'}
            className={`flex items-center gap-1.5 text-xs font-medium transition-colors focus-visible:outline-accent rounded ${
              isLiked ? 'text-red-500' : 'hover:text-primary'
            }`}
          >
            <Heart className={`w-4 h-4 ${isLiked ? 'fill-current text-red-500' : ''}`} />
            <span>{likeCount}</span>
          </button>

          {/* Comment toggle button */}
          <button
            type="button"
            onClick={() => setShowComments((prev) => !prev)}
            aria-label="Toggle comments"
            className="flex items-center gap-1.5 text-xs font-medium hover:text-primary transition-colors focus-visible:outline-accent rounded"
          >
            <MessageCircle className="w-4 h-4" />
            <span>Comments</span>
            {(post.comments?.length || 0) > 0 && (
              <span className="rounded-full bg-accent-soft text-accent font-semibold px-1.5 py-0.5 text-[10px]">
                {post.comments.length}
              </span>
            )}
          </button>
        </div>

        <div className="flex items-center gap-2">
          {/* Save / Bookmark button */}
          <button
            type="button"
            onClick={toggleSave}
            aria-label={isSaved ? 'Unsave post' : 'Save post'}
            className={`p-1.5 rounded-lg transition-colors focus-visible:outline-accent ${
              isSaved ? 'text-accent' : 'hover:text-primary'
            }`}
          >
            <Bookmark className={`w-4 h-4 ${isSaved ? 'fill-current text-accent' : ''}`} />
          </button>

          {/* Share button */}
          <button
            type="button"
            onClick={handleCopyLink}
            aria-label="Share post link"
            className="p-1.5 rounded-lg hover:text-primary transition-colors focus-visible:outline-accent"
          >
            {copiedLink ? <Check className="w-4 h-4 text-accent" /> : <Share2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Embedded Comments Thread */}
      {showComments && (
        <div className="px-4 pb-4 bg-page/30">
          <CommentThread postId={post.id} postAuthorId={post.author_id} />
        </div>
      )}

      {/* Edit Modal */}
      {isEditModalOpen && (
        <EditPostModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          post={post}
          onUpdate={async (id, updates) => {
            if (onPostUpdated) await onPostUpdated(id, updates);
          }}
        />
      )}

      {/* Full Lightbox Image Viewer */}
      {activeMediaUrl && (
        <ImageViewerModal
          isOpen={Boolean(activeMediaUrl)}
          onClose={() => setActiveMediaUrl(null)}
          src={activeMediaUrl}
        />
      )}

      {/* Report Modal */}
      {isReportModalOpen && (
        <ReportModal
          isOpen={isReportModalOpen}
          onClose={() => setIsReportModalOpen(false)}
          targetType="post"
          targetId={post.id}
          targetName="this post"
        />
      )}
      {/* Delete Confirmation Modal */}
      <Dialog
        isOpen={isDeleteModalOpen}
        onClose={() => !isDeleting && setIsDeleteModalOpen(false)}
        title="Delete post?"
        description="This action cannot be undone. This post will be permanently removed from your profile and feed."
        maxWidth="max-w-sm"
      >
        <div className="flex items-center justify-end gap-3 mt-6">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setIsDeleteModalOpen(false)}
            disabled={isDeleting}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            size="sm"
            onClick={handleConfirmDelete}
            isLoading={isDeleting}
          >
            Delete
          </Button>
        </div>
      </Dialog>
    </article>
  );
}

