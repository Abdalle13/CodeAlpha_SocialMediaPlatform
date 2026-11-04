import React, { useState, useRef } from 'react';
import { usePosts } from './usePosts';
import { useAuth } from '../auth/AuthContext';
import { Avatar } from '../../components/Avatar';
import { Button } from '../../components/Button';
import { Image, Globe, Users, X, AlertCircle } from 'lucide-react';

export function PostComposer({ onPostCreated }) {
  const { user, profile } = useAuth();
  const { createPost, isCreating, error } = usePosts();

  const [caption, setCaption] = useState('');
  const [visibility, setVisibility] = useState('public');
  const [mediaFiles, setMediaFiles] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [formError, setFormError] = useState(null);

  const fileInputRef = useRef(null);

  if (!user) return null;

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    // Validate size (5MB each) and format
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/avif'];
    for (const file of files) {
      if (!validTypes.includes(file.type)) {
        setFormError('Only JPG, PNG, WebP, and AVIF images are supported.');
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        setFormError('Images must be smaller than 5 MB.');
        return;
      }
    }

    setFormError(null);
    setMediaFiles((prev) => [...prev, ...files]);

    const newPreviews = files.map((file) => URL.createObjectURL(file));
    setPreviews((prev) => [...prev, ...newPreviews]);
  };

  const removeFile = (index) => {
    URL.revokeObjectURL(previews[index]);
    setPreviews((prev) => prev.filter((_, i) => i !== index));
    setMediaFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!caption.trim() && mediaFiles.length === 0) {
      setFormError('Please write a caption or attach a photo.');
      return;
    }

    setFormError(null);

    try {
      const created = await createPost(caption.trim(), visibility, mediaFiles);
      setCaption('');
      setMediaFiles([]);
      previews.forEach((url) => URL.revokeObjectURL(url));
      setPreviews([]);
      if (fileInputRef.current) fileInputRef.current.value = '';
      if (onPostCreated) onPostCreated(created);
    } catch (err) {
      setFormError(err.message || 'Could not publish post.');
    }
  };

  return (
    <div className="rounded-xl border border-border bg-surface p-4 shadow-sm">
      {(formError || error) && (
        <div className="mb-3 flex items-center gap-2 rounded-lg bg-red-500/10 border border-red-500/20 p-2.5 text-xs text-red-600 dark:text-red-400">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{formError || error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="flex gap-3 items-start">
          <Avatar
            src={profile?.avatar_url}
            name={profile?.display_name || user.email}
            size="md"
          />
          <div className="flex-1 min-w-0">
            <textarea
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Share an update, insight, or story..."
              maxLength={2000}
              rows={3}
              className="w-full rounded-lg border-0 bg-transparent text-sm text-primary placeholder:text-secondary/60 focus:outline-none resize-none leading-relaxed"
            />

            {/* Image Previews */}
            {previews.length > 0 && (
              <div className="mt-2 grid grid-cols-2 sm:grid-cols-3 gap-2">
                {previews.map((previewUrl, idx) => (
                  <div key={idx} className="relative group rounded-lg overflow-hidden border border-border bg-page aspect-square">
                    <img
                      src={previewUrl}
                      alt="Upload preview"
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => removeFile(idx)}
                      className="absolute top-1.5 right-1.5 rounded-full bg-black/60 p-1 text-white hover:bg-black/85 transition-colors"
                      aria-label="Remove image"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Toolbar & Actions */}
        <div className="mt-3 pt-3 border-t border-border flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-1.5">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/jpeg,image/png,image/webp,image/avif"
              multiple
              className="hidden"
              id="post-media-picker"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-1.5 text-xs font-medium text-secondary hover:text-primary px-2.5 py-1.5 rounded-lg hover:bg-page transition-colors"
            >
              <Image className="w-4 h-4 text-accent" />
              <span>Photo</span>
            </button>

            <button
              type="button"
              onClick={() => setVisibility((v) => (v === 'public' ? 'followers' : 'public'))}
              className="flex items-center gap-1.5 text-xs font-medium text-secondary hover:text-primary px-2.5 py-1.5 rounded-lg hover:bg-page transition-colors"
              title="Click to toggle visibility"
            >
              {visibility === 'public' ? (
                <>
                  <Globe className="w-4 h-4" />
                  <span>Public</span>
                </>
              ) : (
                <>
                  <Users className="w-4 h-4 text-accent" />
                  <span className="text-accent">Followers</span>
                </>
              )}
            </button>
          </div>

          <div className="flex items-center gap-3">
            {caption.length > 1500 && (
              <span className="text-[11px] text-secondary">
                {caption.length} / 2000
              </span>
            )}
            <Button
              type="submit"
              variant="primary"
              size="sm"
              disabled={(!caption.trim() && mediaFiles.length === 0) || isCreating}
              isLoading={isCreating}
            >
              Publish
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
