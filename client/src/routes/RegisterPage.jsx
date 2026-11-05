import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Wordmark } from '../components/Wordmark';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { Toast } from '../components/Toast';
import { useAuth } from '../features/auth/AuthContext';

export function RegisterPage() {
  const navigate = useNavigate();
  const { signUp, isConfigured } = useAuth();

  const [formData, setFormData] = useState({
    displayName: '',
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    agreeTerms: false,
  });

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successNotice, setSuccessNotice] = useState('');

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    if (name === 'username') {
      // Auto-sanitize username as user types:
      // Replace spaces, dots, dashes with underscores, remove invalid symbols, lowercase, max 30 chars
      const sanitized = value
        .toLowerCase()
        .replace(/[\s.-]+/g, '_')
        .replace(/[^a-z0-9_]/g, '')
        .slice(0, 30);

      setFormData((prev) => ({ ...prev, username: sanitized }));
      return;
    }

    setFormData((prev) => {
      const next = {
        ...prev,
        [name]: type === 'checkbox' ? checked : value,
      };

      // Auto-suggest a clean username from display name if username has not been typed yet
      if (name === 'displayName' && !prev.username) {
        next.username = value
          .toLowerCase()
          .replace(/[\s.-]+/g, '_')
          .replace(/[^a-z0-9_]/g, '')
          .slice(0, 30);
      }

      return next;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessNotice('');

    if (formData.password !== formData.confirmPassword) {
      setErrorMessage('Passwords do not match.');
      return;
    }

    if (formData.password.length < 8) {
      setErrorMessage('Password must be at least 8 characters long.');
      return;
    }

    // Sanitize and ensure valid username
    let cleanUsername = (formData.username || '').trim().toLowerCase();

    // If user pasted an email address into username field, extract handle
    if (cleanUsername.includes('@')) {
      cleanUsername = cleanUsername.split('@')[0];
    }

    cleanUsername = cleanUsername
      .replace(/[\s.-]+/g, '_')
      .replace(/[^a-z0-9_]/g, '')
      .slice(0, 30);

    // If still under 3 characters, derive from email or display name
    if (cleanUsername.length < 3) {
      const fallback = (formData.email.split('@')[0] || formData.displayName || 'user')
        .toLowerCase()
        .replace(/[\s.-]+/g, '_')
        .replace(/[^a-z0-9_]/g, '');
      cleanUsername = (fallback + '_' + Math.random().toString(36).slice(2, 6)).slice(0, 30);
    }

    if (!formData.agreeTerms) {
      setErrorMessage('You must accept the Terms of Service and Privacy Notice.');
      return;
    }

    setIsLoading(true);

    try {
      const data = await signUp({
        email: formData.email,
        password: formData.password,
        username: cleanUsername,
        displayName: formData.displayName || cleanUsername,
      });

      // If email confirmation is required by Supabase settings:
      if (data?.user && !data.session) {
        setSuccessNotice('Account created! Please check your email to confirm your account before signing in.');
      } else {
        navigate('/onboarding', { replace: true });
      }
    } catch (err) {
      setErrorMessage(err.message || 'Unable to create account. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center p-4 sm:p-6 w-full my-auto">
      <div className="w-full max-w-lg space-y-6 bg-surface p-7 sm:p-10 rounded-3xl border border-border shadow-xl">
        <div className="text-center space-y-2">
          <Link to="/" className="inline-block focus-visible:outline-accent rounded">
            <Wordmark size="lg" />
          </Link>
          <h1 className="text-xl font-serif text-primary">Create your account</h1>
          <p className="text-xs text-secondary">
            Join Veyra to share moments and connect with creators.
          </p>
        </div>

        {!isConfigured && (
          <Toast
            type="info"
            message="Live account creation requires VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your local environment."
          />
        )}

        {errorMessage && (
          <Toast
            type="error"
            message={errorMessage}
            onClose={() => setErrorMessage('')}
          />
        )}

        {successNotice && (
          <Toast
            type="success"
            message={successNotice}
          />
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Display Name"
            name="displayName"
            type="text"
            required
            placeholder="e.g. Abdullahi Mohamed"
            value={formData.displayName}
            onChange={handleChange}
          />

          <Input
            label="Username"
            name="username"
            type="text"
            required
            placeholder="e.g. abdalle_13"
            hint="Letters, numbers, or underscores (spaces auto-convert to _)"
            value={formData.username}
            onChange={handleChange}
          />

          <Input
            label="Email Address"
            name="email"
            type="email"
            required
            autoComplete="email"
            placeholder="e.g. yourname@gmail.com"
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
              hint="Min 8 characters"
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

          <Button
            type="submit"
            variant="primary"
            size="md"
            isLoading={isLoading}
            className="w-full justify-center"
          >
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
