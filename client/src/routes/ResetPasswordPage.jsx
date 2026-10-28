import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Wordmark } from '../components/Wordmark';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { Toast } from '../components/Toast';

export function ResetPasswordPage() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [statusMessage, setStatusMessage] = useState(
    'Phase 1 preview: Password reset session handler connects in Phase 2.'
  );

  const handleSubmit = (e) => {
    e.preventDefault();
    setStatusMessage('Password update will execute via Supabase Auth in Phase 2.');
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
            type="info"
            message={statusMessage}
            onClose={() => setStatusMessage('')}
          />
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="New Password"
            type="password"
            required
            autoComplete="new-password"
            placeholder="••••••••"
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

          <Button type="submit" variant="primary" size="md" className="w-full justify-center">
            Update password
          </Button>
        </form>

        <div className="text-center text-xs text-secondary pt-2 border-t border-border">
          <Link to="/login" className="font-semibold text-accent hover:underline focus-visible:outline-accent rounded">
            Return to Sign in
          </Link>
        </div>
      </div>
    </div>
  );
}

