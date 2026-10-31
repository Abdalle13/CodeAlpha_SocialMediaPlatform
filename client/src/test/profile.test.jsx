import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { Avatar } from '../components/Avatar';
import { ProfilePage } from '../routes/ProfilePage';
import { SettingsProfilePage } from '../routes/SettingsProfilePage';
import { AuthProvider } from '../features/auth/AuthContext';
import * as useProfileModule from '../features/profiles/useProfile';
import * as authContextModule from '../features/auth/AuthContext';

describe('Phase 3 Profile & Avatar Components', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('Avatar Component', () => {
    it('renders initials derived from display name when src is empty', () => {
      render(<Avatar name="Elena Archer" size="md" />);
      expect(screen.getByText('EA')).toBeInTheDocument();
    });

    it('renders single initial for single-word names', () => {
      render(<Avatar name="Veyra" size="sm" />);
      expect(screen.getByText('VE')).toBeInTheDocument();
    });

    it('renders image element when src is provided', () => {
      render(<Avatar src="https://example.com/photo.jpg" name="Elena Archer" size="lg" />);
      const img = screen.getByRole('img');
      expect(img).toBeInTheDocument();
      expect(img).toHaveAttribute('src', 'https://example.com/photo.jpg');
    });

    it('provides accessible aria-label on wrapper container', () => {
      render(<Avatar name="Julian Reed" />);
      expect(screen.getByLabelText('Julian Reed')).toBeInTheDocument();
    });
  });

  describe('ProfilePage', () => {
    const mockProfile = {
      id: 'profile-1',
      username: 'elena',
      display_name: 'Elena Archer',
      bio: 'Architectural photographer and writer.',
      website: 'https://elena.photos',
      avatar_url: null,
      cover_url: null,
      status: 'active',
      created_at: '2026-01-15T00:00:00Z',
    };

    it('renders user details, bio, handle, and follower counts', () => {
      vi.spyOn(useProfileModule, 'useProfile').mockReturnValue({
        profile: mockProfile,
        followerCount: 142,
        followingCount: 89,
        isFollowing: false,
        isBlocked: false,
        isLoading: false,
        error: null,
        actionLoading: false,
        follow: vi.fn(),
        unfollow: vi.fn(),
        toggleBlock: vi.fn(),
      });

      render(
        <AuthProvider>
          <MemoryRouter initialEntries={['/profile/elena']}>
            <Routes>
              <Route path="/profile/:username" element={<ProfilePage />} />
            </Routes>
          </MemoryRouter>
        </AuthProvider>
      );

      expect(screen.getByText('Elena Archer')).toBeInTheDocument();
      expect(screen.getByText('@elena')).toBeInTheDocument();
      expect(screen.getByText('Architectural photographer and writer.')).toBeInTheDocument();
      expect(screen.getByText('142')).toBeInTheDocument();
      expect(screen.getByText('89')).toBeInTheDocument();
    });

    it('displays Edit Profile action when viewing own profile', () => {
      vi.spyOn(authContextModule, 'useAuth').mockReturnValue({
        user: { id: 'profile-1', email: 'elena@example.com' },
        profile: mockProfile,
        isLoading: false,
      });

      vi.spyOn(useProfileModule, 'useProfile').mockReturnValue({
        profile: mockProfile,
        followerCount: 10,
        followingCount: 5,
        isFollowing: false,
        isBlocked: false,
        isLoading: false,
        error: null,
        follow: vi.fn(),
        unfollow: vi.fn(),
        toggleBlock: vi.fn(),
      });

      render(
        <MemoryRouter initialEntries={['/profile/elena']}>
          <Routes>
            <Route path="/profile/:username" element={<ProfilePage />} />
          </Routes>
        </MemoryRouter>
      );

      expect(screen.getByRole('button', { name: /edit profile/i })).toBeInTheDocument();
    });

    it('displays Follow button when viewing another user profile', () => {
      vi.spyOn(authContextModule, 'useAuth').mockReturnValue({
        user: { id: 'other-user-2', email: 'other@example.com' },
        profile: { id: 'other-user-2', username: 'other' },
        isLoading: false,
      });

      vi.spyOn(useProfileModule, 'useProfile').mockReturnValue({
        profile: mockProfile,
        followerCount: 10,
        followingCount: 5,
        isFollowing: false,
        isBlocked: false,
        isLoading: false,
        error: null,
        follow: vi.fn(),
        unfollow: vi.fn(),
        toggleBlock: vi.fn(),
      });

      render(
        <MemoryRouter initialEntries={['/profile/elena']}>
          <Routes>
            <Route path="/profile/:username" element={<ProfilePage />} />
          </Routes>
        </MemoryRouter>
      );

      expect(screen.getByRole('button', { name: /^follow$/i })).toBeInTheDocument();
    });

    it('displays suspended notice when profile status is suspended', () => {
      vi.spyOn(useProfileModule, 'useProfile').mockReturnValue({
        profile: { ...mockProfile, status: 'suspended' },
        followerCount: 0,
        followingCount: 0,
        isFollowing: false,
        isBlocked: false,
        isLoading: false,
        error: null,
      });

      render(
        <AuthProvider>
          <MemoryRouter initialEntries={['/profile/elena']}>
            <Routes>
              <Route path="/profile/:username" element={<ProfilePage />} />
            </Routes>
          </MemoryRouter>
        </AuthProvider>
      );

      expect(screen.getByText(/account suspended/i)).toBeInTheDocument();
    });
  });

  describe('SettingsProfilePage Form Validation', () => {
    it('renders form inputs and enforces display name requirement', () => {
      vi.spyOn(authContextModule, 'useAuth').mockReturnValue({
        user: { id: 'profile-1', email: 'elena@example.com' },
        profile: {
          id: 'profile-1',
          username: 'elena',
          display_name: 'Elena Archer',
          bio: 'My bio',
          website: '',
        },
        isLoading: false,
      });

      render(
        <MemoryRouter initialEntries={['/settings/profile']}>
          <Routes>
            <Route path="/settings/profile" element={<SettingsProfilePage />} />
          </Routes>
        </MemoryRouter>
      );

      const displayNameInput = screen.getByLabelText(/display name/i);
      expect(displayNameInput).toHaveValue('Elena Archer');

      // Clear display name and submit form
      fireEvent.change(displayNameInput, { target: { value: '' } });
      const form = displayNameInput.closest('form');
      fireEvent.submit(form);

      expect(screen.getByText(/display name cannot be empty/i)).toBeInTheDocument();
    });
  });
});
