import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, ArrowLeft } from 'lucide-react';

export function TermsPage() {
  return (
    <div className="py-12 md:py-20 px-4 sm:px-6 lg:px-8 max-w-3xl mx-auto">
      <div className="mb-8">
        <Link to="/" className="inline-flex items-center gap-2 text-xs font-medium text-secondary hover:text-primary transition-colors mb-4">
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Home</span>
        </Link>
        <div className="flex items-center gap-2 text-xs uppercase font-semibold text-accent tracking-wider mb-2">
          <Shield className="w-4 h-4" />
          <span>Platform Policy</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-serif text-primary">Terms of Service</h1>
        <p className="mt-2 text-xs text-secondary">Last updated: October 2026</p>
      </div>

      <div className="prose prose-sm text-secondary space-y-6 text-sm leading-relaxed border-t border-border pt-6">
        <section className="space-y-2">
          <h2 className="text-base font-semibold text-primary">1. Acceptance of Terms</h2>
          <p>
            By accessing or using Veyra, you agree to be bound by these Terms of Service. If you do not agree to all terms and conditions, you must not access or use the platform.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-semibold text-primary">2. User Accounts & Registration</h2>
          <p>
            When registering an account on Veyra, you agree to provide accurate, non-misleading information and to maintain the security of your account credentials. You are responsible for all activities that occur under your account.
          </p>
          <p>
            We reserve the right to suspend or terminate accounts that violate community safety rules or impersonate others.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-semibold text-primary">3. User Content & Conduct</h2>
          <p>
            You retain ownership of the text and images you publish on Veyra. By posting content, you grant Veyra a non-exclusive license to host, display, and distribute that content solely for the purpose of operating the platform.
          </p>
          <p>You agree not to post content that:</p>
          <ul className="list-disc pl-5 space-y-1 text-xs">
            <li>Infringes on intellectual property or privacy rights.</li>
            <li>Contains malicious code, unauthorized automated scripts, or exploits.</li>
            <li>Constitutes harassment, defamation, abuse, or hate speech.</li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-semibold text-primary">4. Media Storage & Delivery</h2>
          <p>
            Uploaded images are processed and delivered via ImageKit. All uploads are subject to file size limits (5 MB maximum) and format restrictions (JPEG, PNG, WebP). Unauthorized image manipulation or cross-account asset deletion is strictly prohibited.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-semibold text-primary">5. Account Termination</h2>
          <p>
            You may request deletion of your account at any time. Upon deletion, your profile and associated content will be permanently removed or anonymized in accordance with our data retention schedule.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-semibold text-primary">6. Contact</h2>
          <p>
            For inquiries regarding these terms or community moderation, contact the platform administration at support@veyra.local.
          </p>
        </section>
      </div>
    </div>
  );
}

