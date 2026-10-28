import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Wordmark } from '../components/Wordmark';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { Toast } from '../components/Toast';

export function RegisterPage() {
  const [formData, setFormData] = useState({
    displayName: '',
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    agreeTerms: false,
  });
  const [infoMessage, setInfoMessage] = useState(
    'Phase 1 preview: Form layout and design tokens are active. Full Supabase account creation connects in Phase 2.'
  );

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setInfoMessage(
      'Account registration will create persistent records upon Phase 2 database & auth initialization.'
    );
  };

  return (
    <div className="min-h-[85vh] flex flex-col items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-7 bg-surface p-6 sm:p-8 rounded-2xl border border-border shadow-sm">
        <div className="text-center space-y-2">
          <Link to="/" className="inline-block focus-visible:outline-accent rounded">
            <Wordmark size="lg" />
          </Link>
          <h1 className="text-xl font-serif text-primary">Create your account</h1>
          <p className="text-xs text-secondary">
            Join Veyra to share photographs, write thoughts, and connect.
          </p>
        </div>

        {infoMessage && (
          <Toast
            type="info"
            message={infoMessage}
            onClose={() => setInfoMessage('')}
          />
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Display Name"
            name="displayName"
            type="text"
            required
            placeholder="Elena Archer"
            value={formData.displayName}
            onChange={handleChange}
          />

          <Input
            label="Username"
            name="username"
            type="text"
            required
            placeholder="elena"
            hint="3-30 letters, numbers, or underscores"
            value={formData.username}
            onChange={handleChange}
          />

          <Input
            label="Email Address"
            name="email"
            type="email"
            required
            autoComplete="email"
            placeholder="elena@example.com"
            value={formData.email}
            onChange={handleChange}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Password"
              name="password"
              type="password"
              required
              autoComplete="new-password"
              placeholder="••••••••"
              value={formData.password}
              onChange={handleChange}
            />

            <Input
              label="Confirm Password"
              name="confirmPassword"
              type="password"
              required
              autoComplete="new-password"
              placeholder="••••••••"
              value={formData.confirmPassword}
              onChange={handleChange}
            />
          </div>

          <div className="pt-1">
            <label className="flex items-start gap-2.5 cursor-pointer text-xs text-secondary">
              <input
                type="checkbox"
                name="agreeTerms"
                checked={formData.agreeTerms}
                onChange={handleChange}
                required
                className="mt-0.5 rounded border-border text-accent focus:ring-accent h-4 w-4"
              />
              <span>
                I agree to the{' '}
                <Link to="/terms" className="text-accent underline underline-offset-2">Terms of Service</Link>{' '}
                and{' '}
                <Link to="/privacy" className="text-accent underline underline-offset-2">Privacy Notice</Link>.
              </span>
            </label>
          </div>

          <Button type="submit" variant="primary" size="md" className="w-full justify-center">
            Create account
          </Button>
        </form>

        <div className="text-center text-xs text-secondary pt-2 border-t border-border">
          Already have an account?{' '}
          <Link to="/login" className="font-semibold text-accent hover:underline focus-visible:outline-accent rounded">
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
}

