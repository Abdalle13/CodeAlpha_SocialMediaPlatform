import React from 'react';
import { Link } from 'react-router-dom';
import { Wordmark } from './Wordmark';

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-border bg-surface text-secondary transition-colors">
      <div className="mx-auto max-w-app px-4 sm:px-6 lg:px-8 py-12 md:py-16">
        <div className="flex flex-col md:flex-row items-start justify-between gap-8">
          <div className="space-y-3 max-w-sm">
            <Wordmark size="md" />
            <p className="text-xs leading-relaxed text-secondary">
              A thoughtful, content-first social platform. Share genuine moments, curate an editorial profile, and discover people without artificial algorithms.
            </p>
            <p className="text-xs font-serif italic text-primary/80">
              Share your world.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-8 text-xs font-medium">
            <div className="space-y-2.5">
              <span className="text-xs uppercase tracking-wider text-primary font-semibold">Product</span>
              <ul className="space-y-2">
                <li><Link to="/" className="hover:text-primary transition-colors focus-visible:outline-accent rounded">Home</Link></li>
                <li><Link to="/register" className="hover:text-primary transition-colors focus-visible:outline-accent rounded">Join Veyra</Link></li>
                <li><Link to="/login" className="hover:text-primary transition-colors focus-visible:outline-accent rounded">Member Login</Link></li>
              </ul>
            </div>

            <div className="space-y-2.5">
              <span className="text-xs uppercase tracking-wider text-primary font-semibold">Legal & Safety</span>
              <ul className="space-y-2">
                <li><Link to="/terms" className="hover:text-primary transition-colors focus-visible:outline-accent rounded">Terms of Service</Link></li>
                <li><Link to="/privacy" className="hover:text-primary transition-colors focus-visible:outline-accent rounded">Privacy Notice</Link></li>
              </ul>
            </div>

            <div className="space-y-2.5">
              <span className="text-xs uppercase tracking-wider text-primary font-semibold">Community</span>
              <ul className="space-y-2">
                <li><span className="text-secondary/70">Content Guidelines</span></li>
                <li><span className="text-secondary/70">Support & Feedback</span></li>
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-12 pt-6 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-secondary">
          <p>© {currentYear} Veyra. All rights reserved.</p>
          <p className="text-secondary/80">Built with calm, tactile craftsmanship.</p>
        </div>
      </div>
    </footer>
  );
}

