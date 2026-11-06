import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Camera, Trash2, ArrowLeft, Check, AlertCircle, Shield, User } from 'lucide-react';
import { useAuth } from '../features/auth/AuthContext';
import { uploadToImageKit, deleteFromImageKit } from '../features/media/imagekit';
import { supabase } from '../lib/supabaseClient';
import { Avatar } from '../components/Avatar';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { Toast } from '../components/Toast';
import { ImageCropperModal } from '../components/ImageCropperModal';

export function SettingsProfilePage() {
  const { user, profile, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('profile'); // 'profile' | 'security'

  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [website, setWebsite] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [avatarFileId, setAvatarFileId] = useState('');
  const [coverUrl, setCoverUrl] = useState('');
  const [coverFileId, setCoverFileId] = useState('');

  // Password update state
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState(null);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // Email update state
  const [newEmail, setNewEmail] = useState('');
  const [emailError, setEmailError] = useState(null);
  const [isChangingEmail, setIsChangingEmail] = useState(false);

  const [isSaving, setIsSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);
  const [formErrors, setFormErrors] = useState({});

  const [cropperModal, setCropperModal] = useState({
    isOpen: false,
    imageSrc: null,
    aspectRatio: '1:1',
    target: 'avatar',
    title: 'Crop Image',
  });

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

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 8) {
      setPasswordError('Password must be at least 8 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('Passwords do not match.');
      return;
    }

    setPasswordError(null);
    setIsChangingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      setNewPassword('');
      setConfirmPassword('');
      showToast('Password updated successfully.', 'success');
    } catch (err) {
      setPasswordError(err.message || 'Could not update password.');
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleEmailChange = async (e) => {
    e.preventDefault();
    const clean = newEmail.trim().toLowerCase();
    if (!clean || !clean.includes('@')) {
      setEmailError('Please enter a valid email address.');
      return;
    }
    if (clean === user?.email?.toLowerCase()) {
      setEmailError('New email is the same as your current email.');
      return;
    }

    setEmailError(null);
    setIsChangingEmail(true);
    try {
      const { error } = await supabase.auth.updateUser({ email: clean });
      if (error) throw error;
      setNewEmail('');
      showToast('Confirmation link sent! Please check your new email to verify.', 'success');
    } catch (err) {
      setEmailError(err.message || 'Could not update email.');
    } finally {
      setIsChangingEmail(false);
    }
  };

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
        title: target === 'avatar' ? 'Crop Profile Avatar' : 'Crop Cover Banner',
      });
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleCropComplete = async (croppedFile) => {
    if (cropperModal.target === 'avatar') {
      setUploadingAvatar(true);
      try {
        const uploadResult = await uploadToImageKit(croppedFile, { folder: '/veyra/avatars' });
        setAvatarUrl(uploadResult.url);
        setAvatarFileId(uploadResult.fileId);
        showToast('Avatar cropped and uploaded. Click Save changes to persist.', 'success');
      } catch (err) {
        showToast(err.message || 'Avatar upload failed.', 'error');
      } finally {
        setUploadingAvatar(false);
      }
    } else {
      setUploadingCover(true);
      try {
        const uploadResult = await uploadToImageKit(croppedFile, { folder: '/veyra/covers' });
        setCoverUrl(uploadResult.url);
        setCoverFileId(uploadResult.fileId);
        showToast('Cover cropped and uploaded. Click Save changes to persist.', 'success');
      } catch (err) {
        showToast(err.message || 'Cover photo upload failed.', 'error');
      } finally {
        setUploadingCover(false);
      }
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
    <div className="w-full max-w-2xl mx-auto px-3 sm:px-4 py-4 sm:py-8">
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50">
          <Toast type={toastMessage.type} message={toastMessage.message} />
        </div>
      )}

      {/* Header with Back Link */}
      <div className="flex items-center justify-between pb-6 border-b border-border mb-6">
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
          <h1 className="text-2xl font-serif font-medium text-primary">Account Settings</h1>
          <p className="text-xs text-secondary">
            Manage your personal profile, account security, and credentials on Veyra.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-3 sm:gap-6 border-b border-border mb-6 sm:mb-8 overflow-x-auto pb-1">
        <button
          type="button"
          onClick={() => setActiveTab('profile')}
          className={`flex items-center gap-2 pb-3 text-xs font-semibold border-b-2 whitespace-nowrap transition-colors ${
            activeTab === 'profile'
              ? 'border-accent text-accent'
              : 'border-transparent text-secondary hover:text-primary'
          }`}
        >
          <User className="w-4 h-4" />
          <span>Profile Details</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('security')}
          className={`flex items-center gap-2 pb-3 text-xs font-semibold border-b-2 whitespace-nowrap transition-colors ${
            activeTab === 'security'
              ? 'border-accent text-accent'
              : 'border-transparent text-secondary hover:text-primary'
          }`}
        >
          <Shield className="w-4 h-4" />
          <span>Security & Credentials</span>
        </button>
      </div>

      {activeTab === 'profile' ? (
        <form onSubmit={handleSubmit} className="space-y-6 sm:space-y-8">
        {/* Cover Photo Management */}
        <div className="space-y-2">
          <label className="block text-xs font-semibold uppercase tracking-wider text-secondary">
            Cover Banner
          </label>
          <div className="relative h-28 sm:h-36 w-full rounded-xl border border-border bg-page overflow-hidden group">
            {coverUrl ? (
              <img src={coverUrl} alt="Cover preview" className="w-full h-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-xs text-secondary/70">
                No cover photo selected
              </div>
            )}

            <div className="absolute inset-0 bg-black/40 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 sm:gap-3 p-2">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                isLoading={uploadingCover}
                onClick={() => coverInputRef.current?.click()}
                className="gap-1.5 text-xs"
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
                  className="gap-1.5 text-xs"
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
            onChange={(e) => handleFileSelect(e, 'cover')}
          />
        </div>

        {/* Avatar Photo Management */}
        <div className="space-y-2">
          <label className="block text-xs font-semibold uppercase tracking-wider text-secondary">
            Profile Avatar
          </label>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <Avatar
              src={avatarUrl}
              name={displayName || 'User'}
              size="xl"
              className="ring-2 ring-border"
            />
            <div className="flex flex-wrap items-center gap-2.5">
              <Button
                type="button"
                variant="outline"
                size="sm"
                isLoading={uploadingAvatar}
                onClick={() => avatarInputRef.current?.click()}
                className="gap-1.5 text-xs"
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
                  className="gap-1.5 text-xs text-danger hover:text-danger hover:bg-danger-soft"
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
            onChange={(e) => handleFileSelect(e, 'avatar')}
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
        <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2.5 sm:gap-3 pt-6 border-t border-border">
          <Link to={profile?.username ? `/profile/${profile.username}` : '/'} className="w-full sm:w-auto">
            <Button variant="ghost" size="md" className="w-full sm:w-auto">
              Cancel
            </Button>
          </Link>
          <Button
            type="submit"
            variant="primary"
            size="md"
            isLoading={isSaving}
            className="gap-2 w-full sm:w-auto min-w-[120px]"
          >
            <Check className="w-4 h-4" />
            <span>Save changes</span>
          </Button>
        </div>
      </form>
      ) : (
        /* Security and Credentials Tab */
        <div className="space-y-6 sm:space-y-8">
          {/* Change Email Address */}
          <form onSubmit={handleEmailChange} className="rounded-xl border border-border bg-surface p-4 sm:p-6 space-y-4">
            <div>
              <h2 className="text-base font-semibold text-primary">Change Email Address</h2>
              <p className="text-xs text-secondary mt-0.5">
                Update the primary email address linked to your Veyra account.
              </p>
            </div>

            {emailError && (
              <div className="flex items-center gap-2 rounded-lg bg-red-500/10 border border-red-500/20 p-2.5 text-xs text-red-600 dark:text-red-400">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{emailError}</span>
              </div>
            )}

            <div className="space-y-3.5 max-w-md">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-secondary mb-1">
                  Current Email
                </label>
                <p className="text-xs font-mono text-primary bg-page border border-border rounded-lg px-3 py-2 select-all">
                  {user?.email || 'No email attached'}
                </p>
              </div>

              <Input
                label="New Email Address"
                type="email"
                id="new-email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="Enter new email address"
                required
              />

              <Button
                type="submit"
                variant="primary"
                size="sm"
                isLoading={isChangingEmail}
                disabled={!newEmail.trim() || isChangingEmail}
                className="w-full sm:w-auto"
              >
                Update email
              </Button>
            </div>
          </form>

          {/* Change Password */}
          <form onSubmit={handlePasswordChange} className="rounded-xl border border-border bg-surface p-4 sm:p-6 space-y-4">
            <div>
              <h2 className="text-base font-semibold text-primary">Change Password</h2>
              <p className="text-xs text-secondary mt-0.5">
                Ensure your account is protected using a strong, unique password.
              </p>
            </div>

            {passwordError && (
              <div className="flex items-center gap-2 rounded-lg bg-red-500/10 border border-red-500/20 p-2.5 text-xs text-red-600 dark:text-red-400">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{passwordError}</span>
              </div>
            )}

            <div className="space-y-4 max-w-md">
              <Input
                label="New Password"
                type="password"
                id="new-password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="At least 8 characters"
                required
              />

              <Input
                label="Confirm New Password"
                type="password"
                id="confirm-new-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repeat new password"
                required
              />

              <Button
                type="submit"
                variant="primary"
                size="sm"
                isLoading={isChangingPassword}
                disabled={!newPassword || isChangingPassword}
                className="w-full sm:w-auto"
              >
                Update password
              </Button>
            </div>
          </form>

          {/* Account Metadata Details */}
          <div className="rounded-xl border border-border bg-surface p-4 sm:p-6 space-y-4">
            <div>
              <h2 className="text-base font-semibold text-primary">Account Information</h2>
              <p className="text-xs text-secondary mt-0.5">
                Authentication and credential identifiers registered with Veyra.
              </p>
            </div>

            <div className="divide-y divide-border/60 text-xs">
              <div className="py-2.5 flex items-center justify-between">
                <span className="text-secondary font-medium">Email address</span>
                <span className="text-primary font-mono">{user?.email}</span>
              </div>
              <div className="py-2.5 flex items-center justify-between">
                <span className="text-secondary font-medium">User Identifier</span>
                <span className="text-primary font-mono text-[11px]">{user?.id}</span>
              </div>
              <div className="py-2.5 flex items-center justify-between">
                <span className="text-secondary font-medium">Member since</span>
                <span className="text-primary">
                  {user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'Active'}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Cropper Modal for Avatar and Cover */}
      <ImageCropperModal
        isOpen={cropperModal.isOpen}
        onClose={() => setCropperModal((prev) => ({ ...prev, isOpen: false, imageSrc: null }))}
        imageSrc={cropperModal.imageSrc}
        aspectRatio={cropperModal.aspectRatio}
        title={cropperModal.title}
        onCropComplete={handleCropComplete}
      />
    </div>
  );
}

