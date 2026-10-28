import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Wordmark } from '../components/Wordmark';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { Toast } from '../components/Toast';
import { useAuth } from '../features/auth/AuthContext';
import { supabase } from '../lib/supabaseClient';

export function ResetPasswordPage() {
  const navigate = useNavigate();
  const { updatePassword, isConfigured } = useAuth();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [hasValidSession, setHasValidSession] = useState(false);

  useEffect(() => {
    // Check if user reached this route via Supabase recovery link
    async function checkRecoverySession() {
      if (!isConfigured) return;

      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setHasValidSession(true);
      } else {
        // Look for recovery hash or error in URL
        const hash = window.location.hash;
        if (hash.includes('error=')) {
          setStatusMessage('Your password recovery link is invalid or has expired. Please request a new one.');
        } else if (hash.includes('access_token=')) {
          setHasValidSession(true);
        }
      }
    }

    checkRecoverySession();
  }, [isConfigured]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatusMessage('');

    if (password !== confirmPassword) {
      setStatusMessage('Passwords do not match.');
      return;
    }

    if (password.length < 8) {
      setStatusMessage('Password must be at least 8 characters long.');
      return;
    }

    setIsLoading(true);

    try {
      await updatePassword(password);
      setIsSuccess(true);
      setStatusMessage('Password updated successfully! Redirecting to sign in...');
      setTimeout(() => {
        navigate('/login', { replace: true });
      }, 2000);
    } catch (err) {
      setStatusMessage(err.message || 'Unable to update password. Your recovery link may have expired.');
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
          <h1 className="text-xl font-serif text-primary">Set new password</h1>
          <p className="text-xs text-secondary">
            Enter your new secure password below.
          </p>
        </div>

        {statusMessage && (
          <Toast
            type={isSuccess ? 'success' : 'error'}
            message={statusMessage}
            onClose={() => setStatusMessage('')}
          />
        )}

        {!hasValidSession && !isSuccess && (
          <div className="text-xs text-secondary bg-page p-3.5 rounded-lg border border-border">
            Enter your new password below. If your recovery link has expired, you can request a new one.
          </div>
        )}

        {!isSuccess && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="New Password"
              type="password"
              required
              autoComplete="new-password"
              placeholder="••••••••"
              hint="Min 8 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />

            <Input
              label="Confirm Password"
              type="password"
              required
              autoComplete="new-password"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />

            <Button
              type="submit"
              variant="primary"
              size="md"
              isLoading={isLoading}
              className="w-full justify-center"
            >
              Update password
            </Button>
          </form>
        )}

        <div className="text-center text-xs text-secondary pt-2 border-t border-border">
          <Link to="/login" className="font-semibold text-accent hover:underline focus-visible:outline-accent rounded">
            Return to Sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
