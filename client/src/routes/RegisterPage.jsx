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
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
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

    const usernameRegex = /^[a-zA-Z0-9_]{3,30}$/;
    if (!usernameRegex.test(formData.username)) {
      setErrorMessage('Username must be 3-30 alphanumeric characters or underscores.');
      return;
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
        username: formData.username,
        displayName: formData.displayName,
      });

      // If email confirmation is required by Supabase settings:
      if (data?.user && !data.session) {
        setSuccessNotice('Account created! Please check your email to confirm your account before signing in.');
      } else {
        navigate('/', { replace: true });
      }
    } catch (err) {
      setErrorMessage(err.message || 'Unable to create account. Please try again.');
    } finally {
      setIsLoading(false);
    }
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
