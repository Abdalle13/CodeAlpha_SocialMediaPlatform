import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import { Wordmark } from '../components/Wordmark';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { Toast } from '../components/Toast';
import { useAuth } from '../features/auth/AuthContext';

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { signIn, isConfigured } = useAuth();

  const [identity, setIdentity] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const from = location.state?.from?.pathname || '/';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setIsLoading(true);

    try {
      await signIn(identity, password, rememberMe);
      navigate(from, { replace: true });
    } catch (err) {
      setErrorMessage(err.message || 'Unable to sign in. Please check your credentials and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex flex-col items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-sm space-y-7 bg-surface p-6 sm:p-8 rounded-2xl border border-border shadow-sm">
        <div className="text-center space-y-2">
          <Link to="/" className="inline-block focus-visible:outline-accent rounded">
            <Wordmark size="lg" />
          </Link>
          <h1 className="text-xl font-serif text-primary">Welcome back</h1>
          <p className="text-xs text-secondary">
            Sign in to your account to share and explore.
          </p>
        </div>

        {!isConfigured && (
          <Toast
            type="info"
            message="Live authentication requires VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your local environment."
          />
        )}

        {errorMessage && (
          <Toast
            type="error"
            message={errorMessage}
            onClose={() => setErrorMessage('')}
          />
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Email or Username"
            id="login-identity"
            type="text"
            required
            autoComplete="username"
            placeholder="elena or elena@example.com"
            value={identity}
            onChange={(e) => setIdentity(e.target.value)}
          />

          <div className="space-y-1 text-left">
            <div className="flex items-center justify-between">
              <label htmlFor="login-password" className="text-xs font-semibold uppercase tracking-wider text-secondary">
                Password
              </label>
              <Link to="/forgot-password" className="text-xs text-accent hover:underline focus-visible:outline-accent rounded">
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <input
                id="login-password"
                type={showPassword ? 'text' : 'password'}
                required
                autoComplete="current-password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg border border-border bg-surface px-3.5 py-2 pr-10 text-sm text-primary placeholder:text-secondary/60 transition-colors focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
              />
              <button
                type="button"
                onClick={() => setShowPassword(prev => !prev)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-secondary hover:text-primary focus-visible:outline-accent"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs pt-1">
            <label className="flex items-center gap-2 cursor-pointer select-none text-secondary">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="rounded border-border text-accent focus:ring-accent h-4 w-4"
              />
              <span>Remember me</span>
            </label>
          </div>

          <Button
            type="submit"
            variant="primary"
            size="md"
            isLoading={isLoading}
            className="w-full justify-center"
          >
            Sign in
          </Button>
        </form>

        <div className="text-center text-xs text-secondary pt-2 border-t border-border">
          Don't have an account?{' '}
          <Link to="/register" className="font-semibold text-accent hover:underline focus-visible:outline-accent rounded">
            Create account
          </Link>
        </div>
      </div>
    </div>
  );
}
