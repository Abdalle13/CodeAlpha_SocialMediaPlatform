import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, Compass, MessageSquare, Image as ImageIcon, Heart, Bookmark, Share2 } from 'lucide-react';
import { Button } from '../components/Button';

export function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-20 md:pt-20 md:pb-28 border-b border-border bg-page">
        <div className="mx-auto max-w-app px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center text-center max-w-3xl mx-auto space-y-6">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-accent-soft text-accent border border-accent/20 tracking-wide uppercase">
              A Content-First Social Space
            </span>

            <h1 className="text-4xl sm:text-5xl md:text-6xl font-serif font-normal tracking-tight text-primary leading-[1.15]">
              Share your world.
            </h1>

            <p className="text-base sm:text-lg text-secondary leading-relaxed max-w-2xl font-sans">
              Veyra is a calm, personal place to share photographs, write thoughts, and connect with people. No algorithmic clutter, no manipulative metrics, just clean editorial typography and genuine community.
            </p>

            <div className="flex flex-col sm:flex-row items-center gap-3 pt-2 w-full sm:w-auto">
              <Link to="/register" className="w-full sm:w-auto">
                <Button variant="primary" size="lg" className="w-full sm:w-auto shadow-sm">
                  Create your account
                </Button>
              </Link>
              <Link to="/login" className="w-full sm:w-auto">
                <Button variant="secondary" size="lg" className="w-full sm:w-auto">
                  Sign in
                </Button>
              </Link>
            </div>
          </div>

          {/* Product UI Preview Composed from Actual Components */}
          <div id="preview" className="mt-14 max-w-4xl mx-auto rounded-2xl border border-border bg-surface p-4 sm:p-6 shadow-sm">
            <div className="flex items-center justify-between pb-4 border-b border-border text-xs text-secondary font-medium">
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-accent inline-block"></span>
                <span>Editorial Feed Preview</span>
              </div>
              <span className="text-secondary/70">Chronological timeline</span>
            </div>

            <div className="mt-5 grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
              {/* Sample Post Card */}
              <article className="md:col-span-8 rounded-xl border border-border bg-page p-5 space-y-4">
                <header className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-accent text-white flex items-center justify-center font-serif text-sm font-semibold select-none">
                      EA
                    </div>
                    <div>
                      <h2 className="text-sm font-semibold text-primary">Elena Archer</h2>
                      <p className="text-xs text-secondary">@elena • 2 hours ago</p>
                    </div>
                  </div>
                  <span className="text-xs text-secondary">Quiet moments</span>
                </header>

                <p className="text-sm leading-relaxed text-primary">
                  Morning light through the studio windows. Taking time to compose photographs before the day begins.
                </p>

                {/* Clean Aspect-Ratio Box Representing Image Presentation */}
                <div className="aspect-[16/10] w-full rounded-lg bg-surface border border-border flex flex-col items-center justify-center p-6 text-center select-none">
                  <div className="h-12 w-12 rounded-full bg-accent-soft text-accent flex items-center justify-center mb-2">
                    <ImageIcon className="w-6 h-6" aria-hidden="true" />
                  </div>
                  <span className="text-xs font-serif italic text-primary">Studio Morning Light</span>
                  <span className="text-[11px] text-secondary mt-0.5">High-resolution media delivered through ImageKit CDN</span>
                </div>

                <footer className="flex items-center justify-between pt-2 border-t border-border/60 text-xs text-secondary">
                  <div className="flex items-center gap-5">
                    <span className="inline-flex items-center gap-1.5 hover:text-accent transition-colors cursor-default">
                      <Heart className="w-4 h-4" /> 24
                    </span>
                    <span className="inline-flex items-center gap-1.5 hover:text-accent transition-colors cursor-default">
                      <MessageSquare className="w-4 h-4" /> 6 comments
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Bookmark className="w-4 h-4 hover:text-primary transition-colors cursor-default" />
                    <Share2 className="w-4 h-4 hover:text-primary transition-colors cursor-default" />
                  </div>
                </footer>
              </article>

              {/* Sample Profile Sidebar Preview */}
              <aside className="md:col-span-4 rounded-xl border border-border bg-page p-5 space-y-4">
                <div className="flex flex-col items-center text-center">
                  <div className="h-14 w-14 rounded-full bg-accent-soft text-accent border border-accent/20 flex items-center justify-center font-serif text-lg font-semibold mb-2.5">
                    VY
                  </div>
                  <h3 className="text-sm font-semibold text-primary">Julian Vance</h3>
                  <p className="text-xs text-secondary">@julian</p>
                  <p className="text-xs text-secondary mt-2 leading-relaxed">
                    Visual artist & bookbinder based in Kyoto. Exploring paper, shadows, and ink.
                  </p>
                </div>

                <div className="flex justify-around py-3 border-y border-border/60 text-center">
                  <div>
                    <span className="block text-sm font-semibold text-primary">18</span>
                    <span className="text-[11px] text-secondary">Posts</span>
                  </div>
                  <div>
                    <span className="block text-sm font-semibold text-primary">342</span>
                    <span className="text-[11px] text-secondary">Followers</span>
                  </div>
                  <div>
                    <span className="block text-sm font-semibold text-primary">190</span>
                    <span className="text-[11px] text-secondary">Following</span>
                  </div>
                </div>

                <Button variant="secondary" size="sm" className="w-full justify-center">
                  Follow
                </Button>
              </aside>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Principles */}
      <section id="features" className="py-16 md:py-24 border-b border-border bg-surface">
        <div className="mx-auto max-w-app px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-14 space-y-3">
            <h2 className="text-2xl sm:text-3xl font-serif text-primary">
              Crafted for intentional sharing
            </h2>
            <p className="text-sm text-secondary leading-relaxed">
              Every detail in Veyra is designed around human focus and thoughtful interaction.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="rounded-xl border border-border bg-page p-6 space-y-3">
              <div className="h-10 w-10 rounded-lg bg-accent-soft text-accent flex items-center justify-center">
                <ImageIcon className="w-5 h-5" aria-hidden="true" />
              </div>
              <h3 className="text-base font-semibold text-primary">Editorial Profiles</h3>
              <p className="text-xs leading-relaxed text-secondary">
                Curate your identity with custom covers, avatars, and a dedicated grid of your compositions. No badges or synthetic status tiers.
              </p>
            </div>

            <div className="rounded-xl border border-border bg-page p-6 space-y-3">
              <div className="h-10 w-10 rounded-lg bg-accent-soft text-accent flex items-center justify-center">
                <Compass className="w-5 h-5" aria-hidden="true" />
              </div>
              <h3 className="text-base font-semibold text-primary">Chronological Discovery</h3>
              <p className="text-xs leading-relaxed text-secondary">
                Your feed shows posts from people you choose to follow in exact chronological order. Explore new creators without surprise algorithmic resets.
              </p>
            </div>

            <div className="rounded-xl border border-border bg-page p-6 space-y-3">
              <div className="h-10 w-10 rounded-lg bg-accent-soft text-accent flex items-center justify-center">
                <ShieldCheck className="w-5 h-5" aria-hidden="true" />
              </div>
              <h3 className="text-base font-semibold text-primary">Direct Privacy Controls</h3>
              <p className="text-xs leading-relaxed text-secondary">
                Built-in blocking, reporting, and direct message permissions. Your private conversations remain between you and your recipient.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Trust & Safety Section */}
      <section id="principles" className="py-16 md:py-24 bg-page border-b border-border">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 text-center space-y-4">
          <span className="text-xs uppercase tracking-wider font-semibold text-accent">Trust & Architecture</span>
          <h2 className="text-2xl sm:text-3xl font-serif text-primary">Built on honest foundations</h2>
          <p className="text-sm text-secondary leading-relaxed max-w-xl mx-auto">
            Veyra enforces security at the PostgreSQL database engine layer with Row Level Security. We store your media securely through ImageKit, respect dark mode preferences, and never monetize personal data.
          </p>
          <div className="pt-4 flex justify-center gap-4 text-xs font-medium text-secondary">
            <Link to="/terms" className="hover:text-primary underline underline-offset-4">Read Terms</Link>
            <span>•</span>
            <Link to="/privacy" className="hover:text-primary underline underline-offset-4">Privacy Notice</Link>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-16 md:py-20 bg-surface">
        <div className="mx-auto max-w-app px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <h2 className="text-3xl sm:text-4xl font-serif text-primary">
            Ready to share your world?
          </h2>
          <p className="text-sm text-secondary max-w-md mx-auto">
            Join the community today. Create an account in under a minute.
          </p>
          <div>
            <Link to="/register">
              <Button variant="primary" size="lg">
                Get started on Veyra
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

