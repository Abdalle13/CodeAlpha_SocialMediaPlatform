import React, { useState } from 'react';
import { Dialog } from '../../components/Dialog';
import { Button } from '../../components/Button';
import { Globe, Users } from 'lucide-react';

export function EditPostModal({ isOpen, onClose, post, onUpdate }) {
  const [caption, setCaption] = useState(post?.caption || '');
  const [visibility, setVisibility] = useState(post?.visibility || 'public');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  if (!isOpen || !post) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (caption.length > 2000) {
      setError('Caption cannot exceed 2000 characters.');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      await onUpdate(post.id, { caption, visibility });
      onClose();
    } catch (err) {
      setError(err.message || 'Could not update post.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="Edit Post"
      description="Update your caption or visibility settings."
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-3 text-xs text-red-600 dark:text-red-400">
            {error}
          </div>
        )}

        <div>
          <label htmlFor="edit-caption" className="block text-xs font-medium text-secondary mb-1.5">
            Caption
          </label>
          <textarea
            id="edit-caption"
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            rows={4}
            maxLength={2000}
            placeholder="Share what is on your mind..."
            className="w-full rounded-lg border border-border bg-page px-3 py-2 text-sm text-primary placeholder:text-secondary/60 focus:border-accent focus:outline-none resize-none"
          />
          <div className="mt-1 flex justify-end text-[11px] text-secondary">
            {caption.length} / 2000
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-secondary mb-1.5">
            Audience
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setVisibility('public')}
              className={`flex items-center justify-center gap-2 rounded-lg border py-2 px-3 text-xs font-medium transition-colors ${
                visibility === 'public'
                  ? 'border-accent bg-accent-soft text-accent'
                  : 'border-border text-secondary hover:text-primary hover:bg-page'
              }`}
            >
              <Globe className="w-3.5 h-3.5" />
              <span>Public</span>
            </button>
            <button
              type="button"
              onClick={() => setVisibility('followers')}
              className={`flex items-center justify-center gap-2 rounded-lg border py-2 px-3 text-xs font-medium transition-colors ${
                visibility === 'followers'
                  ? 'border-accent bg-accent-soft text-accent'
                  : 'border-border text-secondary hover:text-primary hover:bg-page'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Followers only</span>
            </button>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" size="sm" isLoading={isSubmitting}>
            Save changes
          </Button>
        </div>
      </form>
    </Dialog>
  );
}

