import React from 'react';
import { Link } from 'react-router-dom';
import { Lock, ArrowLeft } from 'lucide-react';

export function PrivacyPage() {
  return (
    <div className="py-12 md:py-20 px-4 sm:px-6 lg:px-8 max-w-3xl mx-auto">
      <div className="mb-8">
        <Link to="/" className="inline-flex items-center gap-2 text-xs font-medium text-secondary hover:text-primary transition-colors mb-4">
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Home</span>
        </Link>
        <div className="flex items-center gap-2 text-xs uppercase font-semibold text-accent tracking-wider mb-2">
          <Lock className="w-4 h-4" />
          <span>Data Transparency</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-serif text-primary">Privacy Notice</h1>
        <p className="mt-2 text-xs text-secondary">Last updated: October 2026</p>
      </div>

      <div className="prose prose-sm text-secondary space-y-6 text-sm leading-relaxed border-t border-border pt-6">
        <section className="space-y-2">
          <h2 className="text-base font-semibold text-primary">1. Our Commitment</h2>
          <p>
            Veyra is built with respect for your privacy. We collect only the data necessary to provide a dependable social experience. We do not sell your personal data or track your browsing activity across other websites.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-semibold text-primary">2. Information We Store</h2>
          <ul className="list-disc pl-5 space-y-1 text-xs">
            <li><strong>Account Details:</strong> Your normalized username, display name, and email address managed through Supabase Auth. Passwords are never stored in plain text.</li>
            <li><strong>Content & Media:</strong> Post captions, comments, avatars, covers, and uploaded images hosted securely via ImageKit.</li>
            <li><strong>Social Interactions:</strong> Follow edges, post likes, saved bookmarks, and direct messages strictly isolated to participating users.</li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-semibold text-primary">3. How Your Data is Protected</h2>
          <p>
            Data isolation is enforced at the PostgreSQL database engine level using Row Level Security (RLS). Anonymous visitors cannot query user profiles or posts. Direct messages and saved bookmarks are visible exclusively to the authenticated account holder.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-semibold text-primary">4. Session Storage & Remember Me</h2>
          <p>
            Veyra uses browser storage to maintain your authenticated session:
          </p>
          <ul className="list-disc pl-5 space-y-1 text-xs">
            <li><strong>When "Remember Me" is enabled:</strong> Your authentication session token is stored in persistent local storage so your login survives browser restarts.</li>
            <li><strong>When "Remember Me" is disabled:</strong> Your session token is stored in temporary session storage and terminates when the active tab or browser window closes.</li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-semibold text-primary">5. Content Deletion</h2>
          <p>
            When you delete a post, the record is immediately removed from the active database and its associated ImageKit image asset is purged.
          </p>
        </section>
      </div>
    </div>
  );
}

