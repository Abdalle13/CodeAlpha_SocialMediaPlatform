import React, { useState, useRef } from 'react';
import { X, ImagePlus, Loader2 } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import { uploadToImageKit } from '../media/imagekit';
import { useAuth } from '../auth/AuthContext';
import { Button } from '../../components/Button';

/**
 * StoryCreateModal
 * Modal for composing and publishing a new 24-hour story.
 */
export function StoryCreateModal({ isOpen, onClose, onStoryCreated }) {
  const { user } = useAuth();
  const fileInputRef = useRef(null);

  const [previewUrl, setPreviewUrl] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [caption, setCaption] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState(null);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setError(null);
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedFile) {
      setError('Please select an image first.');
      return;
    }
    setIsUploading(true);
    setError(null);

    try {
      // Upload to ImageKit in /veyra/stories folder
      const { url, fileId } = await uploadToImageKit(selectedFile, {
        folder: '/veyra/stories',
      });

      // Save story record in Supabase
      const { data, error: dbError } = await supabase
        .from('stories')
        .insert({
          user_id: user.id,
          image_url: url,
          imagekit_file_id: fileId,
          caption: caption.trim() || null,
        })
        .select()
        .single();

      if (dbError) throw dbError;

      onStoryCreated(data);
      handleClose();
    } catch (err) {
      console.error('Story upload error:', err);
      setError(err.message || 'Failed to publish story. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleClose = () => {
    setPreviewUrl(null);
    setSelectedFile(null);
    setCaption('');
    setError(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm p-0 sm:p-4"
      onClick={(e) => { if (e.target === e.currentTarget) handleClose(); }}
    >
      <div className="relative w-full sm:max-w-sm bg-surface rounded-t-2xl sm:rounded-2xl border border-border shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="text-sm font-semibold text-primary">New Story</h2>
          <button
            type="button"
            onClick={handleClose}
            className="p-1.5 rounded-full text-secondary hover:text-primary hover:bg-page transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {/* Image picker */}
          <div
            onClick={() => fileInputRef.current?.click()}
            className={`relative w-full aspect-[9/16] max-h-72 rounded-xl border-2 border-dashed flex items-center justify-center cursor-pointer overflow-hidden transition-colors
              ${previewUrl ? 'border-transparent' : 'border-border hover:border-accent'}`}
          >
            {previewUrl ? (
              <img
                src={previewUrl}
                alt="Story preview"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="flex flex-col items-center gap-2 text-secondary p-6 text-center">
                <ImagePlus className="w-10 h-10 opacity-40" />
                <p className="text-xs font-medium">Tap to select a photo</p>
                <p className="text-[11px] opacity-60">JPG, PNG, WebP up to 5 MB</p>
              </div>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/avif"
              onChange={handleFileChange}
              className="sr-only"
            />
          </div>

          {/* Caption */}
          <input
            type="text"
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="Add a caption... (optional)"
            maxLength={200}
            className="w-full rounded-xl border border-border bg-page px-3.5 py-2.5 text-base sm:text-sm text-primary placeholder:text-secondary/60 focus:border-accent focus:outline-none"
          />

          {/* Error */}
          {error && (
            <p className="text-xs text-red-500">{error}</p>
          )}

          {/* Submit */}
          <Button
            type="submit"
            variant="primary"
            size="md"
            className="w-full"
            disabled={!selectedFile || isUploading}
            isLoading={isUploading}
          >
            {isUploading ? 'Publishing...' : 'Share Story'}
          </Button>
        </form>
      </div>
    </div>
  );
}
