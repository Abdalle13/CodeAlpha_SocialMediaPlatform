import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Camera, ArrowRight, Sparkles, User, Image as ImageIcon } from 'lucide-react';
import { useAuth } from '../features/auth/AuthContext';
import { uploadToImageKit } from '../features/media/imagekit';
import { supabase } from '../lib/supabaseClient';
import { Avatar } from '../components/Avatar';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { Wordmark } from '../components/Wordmark';
import { ImageCropperModal } from '../components/ImageCropperModal';

export function OnboardingProfilePage() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();

  const [displayName, setDisplayName] = useState(profile?.display_name || '');
  const [bio, setBio] = useState(profile?.bio || '');
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url || '');
  const [avatarFileId, setAvatarFileId] = useState('');
  const [coverUrl, setCoverUrl] = useState(profile?.cover_url || '');
  const [coverFileId, setCoverFileId] = useState('');

  const [cropperModal, setCropperModal] = useState({
    isOpen: false,
    imageSrc: null,
    aspectRatio: '1:1',
    target: 'avatar', // 'avatar' | 'cover'
    title: 'Crop Image',
  });

  const [isSaving, setIsSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const avatarInputRef = useRef(null);
  const coverInputRef = useRef(null);

  // When a user selects a file from disk, read it as Data URL and open the cropper
  const handleFileSelect = (e, target) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setCropperModal({
        isOpen: true,
        imageSrc: reader.result,
        aspectRatio: target === 'avatar' ? '1:1' : '3:1',
        target,
        title: target === 'avatar' ? 'Crop Profile Photo' : 'Crop Cover Banner',
      });
    };
    reader.readAsDataURL(file);

    // Reset input so same file can be re-selected if needed
    e.target.value = '';
  };

  // When crop is confirmed, upload cropped file to ImageKit
  const handleCropComplete = async (croppedFile) => {
    setUploading(true);
    setErrorMessage('');

    try {
      if (cropperModal.target === 'avatar') {
        const res = await uploadToImageKit(croppedFile, { folder: '/veyra/avatars' });
        setAvatarUrl(res.url);
        setAvatarFileId(res.fileId);
      } else {
        const res = await uploadToImageKit(croppedFile, { folder: '/veyra/covers' });
        setCoverUrl(res.url);
        setCoverFileId(res.fileId);
      }
    } catch (err) {
      console.error('Upload error:', err);
      setErrorMessage(err.message || 'Image upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleSaveAndContinue = async (e) => {
    e.preventDefault();
    if (!user) return;

    setIsSaving(true);
    setErrorMessage('');

    try {
      const updates = {
        display_name: displayName.trim() || profile?.username || 'Member',
        bio: bio.trim() || null,
        avatar_url: avatarUrl || null,
        avatar_file_id: avatarFileId || null,
        cover_url: coverUrl || null,
        cover_file_id: coverFileId || null,
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id);

      if (error) throw error;

      navigate('/', { replace: true });
    } catch (err) {
      setErrorMessage(err.message || 'Could not save profile.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-8 sm:px-6">
      <div className="w-full max-w-xl space-y-6 bg-surface p-6 sm:p-8 rounded-3xl border border-border shadow-lg">
        {/* Header */}
        <div className="text-center space-y-2">
          <Wordmark size="md" />
          <h1 className="text-2xl font-bold tracking-tight text-primary">
            Welcome to Veyra
          </h1>
          <p className="text-xs text-secondary max-w-md mx-auto">
            Set up your profile picture and cover so friends and creators can recognize your work.
          </p>
        </div>

        {errorMessage && (
          <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-xs text-red-600 dark:text-red-400 text-center">
            {errorMessage}
          </div>
        )}

        <form onSubmit={handleSaveAndContinue} className="space-y-6">
          {/* Cover & Avatar Visual Editor */}
          <div className="relative rounded-2xl overflow-hidden border border-border bg-page">
            {/* Cover Banner */}
            <div className="relative h-32 sm:h-36 w-full bg-gradient-to-r from-zinc-800 to-zinc-900 overflow-hidden">
              {coverUrl ? (
                <img
                  src={coverUrl}
                  alt="Cover preview"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-zinc-500">
                  <ImageIcon className="w-8 h-8 opacity-40" />
                </div>
              )}

              {/* Cover change button */}
              <button
                type="button"
                onClick={() => coverInputRef.current?.click()}
                disabled={uploading}
                className="absolute top-3 right-3 flex items-center gap-1.5 rounded-full bg-black/60 backdrop-blur-sm px-3 py-1.5 text-xs font-medium text-white hover:bg-black/80 transition-colors shadow-md disabled:opacity-50"
              >
                <Camera className="w-3.5 h-3.5" />
                <span>{coverUrl ? 'Change Cover' : 'Add Cover'}</span>
              </button>
            </div>

            {/* Hidden cover input */}
            <input
              ref={coverInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={(e) => handleFileSelect(e, 'cover')}
            />

            {/* Avatar Circle */}
            <div className="px-6 pb-4 -mt-12 flex items-end justify-between">
              <div className="relative group">
                <div className="h-24 w-24 rounded-full ring-4 ring-surface overflow-hidden bg-zinc-800 shadow-md">
                  {avatarUrl ? (
                    <img
                      src={avatarUrl}
                      alt="Avatar preview"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-xl font-bold text-white bg-accent">
                      {(displayName || profile?.username || 'U')[0].toUpperCase()}
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => avatarInputRef.current?.click()}
                  disabled={uploading}
                  className="absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-white text-[11px] font-medium transition-opacity cursor-pointer disabled:opacity-0"
                >
                  <Camera className="w-5 h-5 mb-0.5" />
                  <span>Upload</span>
                </button>
              </div>

              {/* Hidden avatar input */}
              <input
                ref={avatarInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={(e) => handleFileSelect(e, 'avatar')}
              />

              <button
                type="button"
                onClick={() => avatarInputRef.current?.click()}
                className="text-xs font-semibold text-accent hover:underline pb-1"
              >
                {avatarUrl ? 'Change Photo' : 'Upload Photo'}
              </button>
            </div>
          </div>

          {/* Form Inputs */}
          <div className="space-y-4">
            <Input
              label="Display Name"
              type="text"
              required
              placeholder="e.g. Abdullahi Mohamed"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
            />

            <div className="space-y-1 text-left">
              <label className="text-xs font-semibold uppercase tracking-wider text-secondary">
                Bio (Optional)
              </label>
              <textarea
                rows={3}
                placeholder="Share a short bio, interests, or what you create..."
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                maxLength={200}
                className="w-full rounded-xl border border-border bg-page px-3.5 py-2.5 text-xs text-primary placeholder:text-secondary/50 focus:border-accent focus:outline-none transition-colors"
              />
              <p className="text-[11px] text-secondary text-right">
                {bio.length}/200
              </p>
            </div>
          </div>

          {/* Submit Actions */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
            <button
              type="button"
              onClick={() => navigate('/', { replace: true })}
              className="text-xs text-secondary hover:text-primary transition-colors order-2 sm:order-1"
            >
              Skip for now
            </button>

            <Button
              type="submit"
              variant="primary"
              size="md"
              isLoading={isSaving || uploading}
              className="w-full sm:w-auto gap-2 order-1 sm:order-2"
            >
              <span>Continue to Feed</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </form>
      </div>

      {/* Image Cropper Modal */}
      <ImageCropperModal
        isOpen={cropperModal.isOpen}
        imageSrc={cropperModal.imageSrc}
        aspectRatio={cropperModal.aspectRatio}
        title={cropperModal.title}
        onClose={() => setCropperModal((prev) => ({ ...prev, isOpen: false }))}
        onCropComplete={handleCropComplete}
      />
    </div>
  );
}

