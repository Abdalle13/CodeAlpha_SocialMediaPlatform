import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { Wordmark } from './Wordmark';
import { ThemeToggle } from './ThemeToggle';
import { Button } from './Button';

export function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  const isPublicPage = ['/', '/terms', '/privacy', '/404'].includes(location.pathname);

  const toggleMobileMenu = () => setMobileMenuOpen(prev => !prev);
  const closeMobileMenu = () => setMobileMenuOpen(false);

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
          <Link to="/login">
            <Button variant="ghost" size="sm">Log in</Button>
          </Link>
          <Link to="/register">
            <Button variant="primary" size="sm">Create account</Button>
          </Link>
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
              Privacy Policy
            </Link>
            <div className="pt-3 border-t border-border flex flex-col gap-2">
              <Link to="/login" onClick={closeMobileMenu}>
                <Button variant="secondary" className="w-full justify-center">Log in</Button>
              </Link>
              <Link to="/register" onClick={closeMobileMenu}>
                <Button variant="primary" className="w-full justify-center">Create account</Button>
              </Link>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}

