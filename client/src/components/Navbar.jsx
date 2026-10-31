import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X, LogOut, User, Settings } from 'lucide-react';
import { Wordmark } from './Wordmark';
import { ThemeToggle } from './ThemeToggle';
import { Button } from './Button';
import { Avatar } from './Avatar';
import { useAuth } from '../features/auth/AuthContext';

export function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, profile, signOut } = useAuth();

  const toggleMobileMenu = () => setMobileMenuOpen(prev => !prev);
  const closeMobileMenu = () => setMobileMenuOpen(false);

  const handleSignOut = async () => {
    closeMobileMenu();
    await signOut();
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border bg-surface/90 backdrop-blur-md transition-colors">
      <div className="mx-auto flex h-16 max-w-app items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand */}
        <Link to="/" onClick={closeMobileMenu} className="focus-visible:outline-accent rounded">
          <Wordmark size="md" />
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-secondary" aria-label="Main navigation">
          {location.pathname === '/' ? (
            <>
              <a href="#features" className="hover:text-primary transition-colors focus-visible:outline-accent rounded">Features</a>
              <a href="#preview" className="hover:text-primary transition-colors focus-visible:outline-accent rounded">Experience</a>
              <a href="#principles" className="hover:text-primary transition-colors focus-visible:outline-accent rounded">Principles</a>
            </>
          ) : (
            <>
              <Link to="/" className="hover:text-primary transition-colors focus-visible:outline-accent rounded">Home</Link>
              <Link to="/terms" className="hover:text-primary transition-colors focus-visible:outline-accent rounded">Terms</Link>
              <Link to="/privacy" className="hover:text-primary transition-colors focus-visible:outline-accent rounded">Privacy</Link>
            </>
          )}
        </nav>

        {/* Actions & Theme */}
        <div className="hidden md:flex items-center gap-3">
          <ThemeToggle />
          {user ? (
            <div className="flex items-center gap-3">
              <Link
                to={profile?.username ? `/profile/${profile.username}` : '#'}
                className="flex items-center gap-2 hover:opacity-85 transition-opacity focus-visible:outline-accent rounded py-1 px-1.5"
              >
                <Avatar
                  src={profile?.avatar_url}
                  name={profile?.display_name || user.email}
                  size="sm"
                />
                <span className="text-xs font-medium text-primary">
                  {profile?.display_name || user.email}
                </span>
              </Link>
              <Link to="/settings/profile" title="Edit Profile">
                <Button variant="ghost" size="sm" className="px-2" aria-label="Profile Settings">
                  <Settings className="w-4 h-4 text-secondary" />
                </Button>
              </Link>
              <Button
                variant="outline"
                size="sm"
                onClick={handleSignOut}
                className="gap-1.5"
                aria-label="Sign out"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign out</span>
              </Button>
            </div>
          ) : (
            <>
              <Link to="/login">
                <Button variant="ghost" size="sm">Log in</Button>
              </Link>
              <Link to="/register">
                <Button variant="primary" size="sm">Create account</Button>
              </Link>
            </>
          )}
        </div>

        {/* Mobile menu trigger */}
        <div className="flex md:hidden items-center gap-2">
          <ThemeToggle />
          <button
            type="button"
            onClick={toggleMobileMenu}
            aria-expanded={mobileMenuOpen}
            aria-label="Toggle navigation menu"
            className="inline-flex items-center justify-center h-9 w-9 rounded-lg border border-border bg-surface text-primary focus-visible:outline-accent"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-border bg-surface px-4 py-5 shadow-lg animate-in slide-in-from-top-2 duration-150">
          <nav className="flex flex-col gap-3 text-sm font-medium text-primary">
            <Link
              to="/"
              onClick={closeMobileMenu}
              className="px-3 py-2 rounded-lg hover:bg-page transition-colors"
            >
              Home
            </Link>
            <Link
              to="/terms"
              onClick={closeMobileMenu}
              className="px-3 py-2 rounded-lg hover:bg-page transition-colors"
            >
              Terms of Service
            </Link>
            <Link
              to="/privacy"
              onClick={closeMobileMenu}
              className="px-3 py-2 rounded-lg hover:bg-page transition-colors"
            >
              Privacy Notice
            </Link>
            <div className="pt-3 border-t border-border flex flex-col gap-2">
              {user ? (
                <>
                  <Link
                    to={profile?.username ? `/profile/${profile.username}` : '#'}
                    onClick={closeMobileMenu}
                    className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-page transition-colors"
                  >
                    <Avatar
                      src={profile?.avatar_url}
                      name={profile?.display_name || user.email}
                      size="sm"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-primary truncate">
                        {profile?.display_name || user.email}
                      </p>
                      {profile?.username && (
                        <p className="text-xs text-secondary truncate">@{profile.username}</p>
                      )}
                    </div>
                  </Link>
                  <Link
                    to="/settings/profile"
                    onClick={closeMobileMenu}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-secondary hover:text-primary hover:bg-page transition-colors"
                  >
                    <Settings className="w-4 h-4" />
                    <span>Edit profile</span>
                  </Link>
                  <Button
                    variant="outline"
                    onClick={handleSignOut}
                    className="w-full justify-center gap-2 mt-1"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Sign out</span>
                  </Button>
                </>
              ) : (
                <>
                  <Link to="/login" onClick={closeMobileMenu}>
                    <Button variant="secondary" className="w-full justify-center">Log in</Button>
                  </Link>
                  <Link to="/register" onClick={closeMobileMenu}>
                    <Button variant="primary" className="w-full justify-center">Create account</Button>
                  </Link>
                </>
              )}
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
