import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Eye, EyeOff, AlertCircle } from 'lucide-react';
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
    <div className="flex-1 flex items-center justify-center p-4 sm:p-6 w-full my-auto">
      <div className="w-full max-w-md sm:max-w-[460px] space-y-6 bg-surface p-7 sm:p-10 rounded-3xl border border-border shadow-xl">
        {/* Brand & Heading */}
        <div className="text-center space-y-2.5">
          <Link to="/" className="inline-block focus-visible:outline-accent rounded">
            <Wordmark size="lg" />
          </Link>
          <h1 className="text-2xl font-serif font-semibold text-primary">Welcome back</h1>
          <p className="text-xs text-secondary max-w-xs mx-auto">
            Sign in with your email or username to continue.
          </p>
        </div>

        {!isConfigured && (
          <Toast
            type="info"
            message="Live authentication requires VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your local environment."
          />
        )}

        {/* Clear exact error notice */}
        {errorMessage && (
          <div className="flex items-start gap-3 rounded-xl border border-red-500/30 bg-red-500/10 p-3.5 text-xs text-red-600 dark:text-red-400 animate-in fade-in duration-200">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-500" />
            <div className="flex-1 font-medium leading-relaxed">{errorMessage}</div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Email or Username"
            id="login-identity"
            type="text"
            required
            autoComplete="username"
            placeholder="Username or email address"
            value={identity}
            onChange={(e) => {
              setIdentity(e.target.value);
              if (errorMessage) setErrorMessage('');
            }}
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
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (errorMessage) setErrorMessage('');
                }}
                className="w-full rounded-xl border border-border bg-page px-3.5 py-2.5 pr-10 text-sm text-primary placeholder:text-secondary/50 transition-colors focus:border-accent focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-secondary hover:text-primary focus-visible:outline-accent"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs pt-0.5">
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
            className="w-full h-11 justify-center rounded-xl text-sm font-semibold shadow-sm"
          >
            Sign in
          </Button>
        </form>

        <div className="text-center text-xs text-secondary pt-4 border-t border-border">
          Don't have an account?{' '}
          <Link to="/register" className="font-semibold text-accent hover:underline focus-visible:outline-accent rounded">
            Create account
          </Link>
        </div>
      </div>
    </div>
  );
}
