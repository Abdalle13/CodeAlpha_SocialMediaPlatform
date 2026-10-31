import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Camera, Trash2, ArrowLeft, Check, AlertCircle } from 'lucide-react';
import { useAuth } from '../features/auth/AuthContext';
import { uploadToImageKit, deleteFromImageKit } from '../features/media/imagekit';
import { supabase } from '../lib/supabaseClient';
import { Avatar } from '../components/Avatar';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { Toast } from '../components/Toast';

export function SettingsProfilePage() {
  const { user, profile, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [website, setWebsite] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [avatarFileId, setAvatarFileId] = useState('');
  const [coverUrl, setCoverUrl] = useState('');
  const [coverFileId, setCoverFileId] = useState('');

  const [isSaving, setIsSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);
  const [formErrors, setFormErrors] = useState({});

  const avatarInputRef = useRef(null);
  const coverInputRef = useRef(null);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (profile) {
      setDisplayName(profile.display_name || '');
      setBio(profile.bio || '');
      setWebsite(profile.website || '');
      setAvatarUrl(profile.avatar_url || '');
      setAvatarFileId(profile.avatar_file_id || '');
      setCoverUrl(profile.cover_url || '');
      setCoverFileId(profile.cover_file_id || '');
    }
  }, [profile]);

  const showToast = (message, type = 'info') => {
    setToastMessage({ message, type });
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingAvatar(true);
    try {
      const uploadResult = await uploadToImageKit(file, { folder: '/veyra/avatars' });
      setAvatarUrl(uploadResult.url);
      setAvatarFileId(uploadResult.fileId);
      showToast('Avatar uploaded. Remember to save changes.', 'success');
    } catch (err) {
      showToast(err.message || 'Avatar upload failed.', 'error');
    } finally {
      setUploadingAvatar(false);
      if (avatarInputRef.current) avatarInputRef.current.value = '';
    }
  };

  const handleRemoveAvatar = async () => {
    if (avatarFileId) {
      try {
        await deleteFromImageKit(avatarFileId);
      } catch {
        // Fall back gracefully
      }
    }
    setAvatarUrl('');
    setAvatarFileId('');
    showToast('Avatar removed. Click save to persist.', 'info');
  };

  const handleCoverChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingCover(true);
    try {
      const uploadResult = await uploadToImageKit(file, { folder: '/veyra/covers' });
      setCoverUrl(uploadResult.url);
      setCoverFileId(uploadResult.fileId);
      showToast('Cover photo uploaded. Remember to save changes.', 'success');
    } catch (err) {
      showToast(err.message || 'Cover photo upload failed.', 'error');
    } finally {
      setUploadingCover(false);
      if (coverInputRef.current) coverInputRef.current.value = '';
    }
  };

  const handleRemoveCover = async () => {
    if (coverFileId) {
      try {
        await deleteFromImageKit(coverFileId);
      } catch {
        // Fall back gracefully
      }
    }
    setCoverUrl('');
    setCoverFileId('');
    showToast('Cover photo removed. Click save to persist.', 'info');
  };

  const validateForm = () => {
    const errors = {};
    if (!displayName.trim()) {
      errors.displayName = 'Display name cannot be empty.';
    } else if (displayName.length > 50) {
      errors.displayName = 'Display name cannot exceed 50 characters.';
    }

    if (bio.length > 200) {
      errors.bio = 'Bio cannot exceed 200 characters.';
    }

    if (website && website.trim()) {
      try {
        const testUrl = website.startsWith('http') ? website : `https://${website}`;
        new URL(testUrl);
      } catch {
        errors.website = 'Please enter a valid website URL.';
      }
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm() || isSaving) return;

    setIsSaving(true);
    try {
      const updates = {
        display_name: displayName.trim(),
        bio: bio.trim() || null,
        website: website.trim() || null,
        avatar_url: avatarUrl || null,
        avatar_file_id: avatarFileId || null,
        cover_url: coverUrl || null,
        cover_file_id: coverFileId || null,
        updated_at: new Date().toISOString(),
      };

      const { error: updateError } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id);

      if (updateError) throw updateError;

      showToast('Profile updated successfully.', 'success');
      setTimeout(() => {
        if (profile?.username) {
          navigate(`/profile/${profile.username}`);
        }
      }, 1000);
    } catch (err) {
      showToast(err.message || 'Failed to update profile.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50">
          <Toast type={toastMessage.type} message={toastMessage.message} />
        </div>
      )}

      {/* Header with Back Link */}
      <div className="flex items-center justify-between pb-6 border-b border-border mb-8">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link
              to={profile?.username ? `/profile/${profile.username}` : '/'}
              className="inline-flex items-center gap-1 text-xs text-secondary hover:text-primary transition-colors focus-visible:outline-accent rounded"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to profile</span>
            </Link>
          </div>
          <h1 className="text-2xl font-serif font-medium text-primary">Edit Profile</h1>
          <p className="text-xs text-secondary">
            Manage your personal presence and information on Veyra.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Cover Photo Management */}
        <div className="space-y-2">
          <label className="block text-xs font-semibold uppercase tracking-wider text-secondary">
            Cover Banner
          </label>
          <div className="relative h-32 w-full rounded-xl border border-border bg-page overflow-hidden group">
            {coverUrl ? (
              <img src={coverUrl} alt="Cover preview" className="w-full h-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-xs text-secondary/70">
                No cover photo selected
              </div>
            )}

            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                isLoading={uploadingCover}
                onClick={() => coverInputRef.current?.click()}
                className="gap-1.5"
              >
                <Camera className="w-3.5 h-3.5" />
                <span>Upload cover</span>
              </Button>
              {coverUrl && (
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  onClick={handleRemoveCover}
                  className="gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Remove</span>
                </Button>
              )}
            </div>
          </div>
          <input
            ref={coverInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={handleCoverChange}
          />
        </div>

        {/* Avatar Photo Management */}
        <div className="space-y-2">
          <label className="block text-xs font-semibold uppercase tracking-wider text-secondary">
            Profile Avatar
          </label>
          <div className="flex items-center gap-5">
            <Avatar
              src={avatarUrl}
              name={displayName || 'User'}
              size="xl"
              className="ring-2 ring-border"
            />
            <div className="flex flex-wrap items-center gap-3">
              <Button
                type="button"
                variant="outline"
                size="sm"
                isLoading={uploadingAvatar}
                onClick={() => avatarInputRef.current?.click()}
                className="gap-1.5"
              >
                <Camera className="w-3.5 h-3.5" />
                <span>Change photo</span>
              </Button>

              {avatarUrl && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleRemoveAvatar}
                  className="gap-1.5 text-danger hover:text-danger hover:bg-danger-soft"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Remove</span>
                </Button>
              )}
            </div>
          </div>
          <input
            ref={avatarInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={handleAvatarChange}
          />
        </div>

        {/* Form Inputs */}
        <div className="space-y-5 pt-2">
          <Input
            label="Display Name"
            required
            id="displayName"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            error={formErrors.displayName}
            placeholder="Your name"
          />

          <div className="w-full flex flex-col gap-1.5 text-left">
            <div className="flex justify-between items-center">
              <label
                htmlFor="bio"
                className="text-xs font-semibold uppercase tracking-wider text-secondary"
              >
                Bio
              </label>
              <span className="text-[11px] text-secondary">
                {bio.length}/200
              </span>
            </div>
            <textarea
              id="bio"
              rows={3}
              value={bio}
              maxLength={200}
              onChange={(e) => setBio(e.target.value)}
              placeholder="A few words about yourself"
              className="w-full rounded-lg border border-border bg-surface px-3.5 py-2.5 text-sm text-primary placeholder:text-secondary/60 transition-colors focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent disabled:opacity-50"
            />
            {formErrors.bio && (
              <p className="text-xs text-danger flex items-center gap-1 mt-0.5" role="alert">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>{formErrors.bio}</span>
              </p>
            )}
          </div>

          <Input
            label="Website"
            type="url"
            id="website"
            value={website}
            onChange={(e) => setWebsite(e.target.value)}
            error={formErrors.website}
            placeholder="https://example.com"
          />
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-6 border-t border-border">
          <Link to={profile?.username ? `/profile/${profile.username}` : '/'}>
            <Button variant="ghost" size="md">
              Cancel
            </Button>
          </Link>
          <Button
            type="submit"
            variant="primary"
            size="md"
            isLoading={isSaving}
            className="gap-2 min-w-[120px]"
          >
            <Check className="w-4 h-4" />
            <span>Save changes</span>
          </Button>
        </div>
      </form>
    </div>
  );
}

