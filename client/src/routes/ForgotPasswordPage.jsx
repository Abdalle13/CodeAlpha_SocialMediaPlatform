import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Wordmark } from '../components/Wordmark';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { Toast } from '../components/Toast';
import { useAuth } from '../features/auth/AuthContext';
import { apiClient } from '../lib/api';

export function ForgotPasswordPage() {
  const { resetPasswordForEmail, isConfigured } = useAuth();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [noticeMessage, setNoticeMessage] = useState('');
  const [noticeType, setNoticeType] = useState('info');
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim()) return;

    setIsLoading(true);
    setNoticeMessage('');

    try {
      // 1. Check if the account actually exists in the database
      const checkRes = await apiClient('/auth/check-email', {
        method: 'POST',
        body: JSON.stringify({ email: email.trim() }),
      }).catch(() => null);

      if (checkRes && checkRes.exists === false) {
        setNoticeType('error');
        setNoticeMessage('No account found with this email address.');
        setIsLoading(false);
        return;
      }

      // 2. Account exists: trigger Supabase password reset email
      await resetPasswordForEmail(email.trim());
      setIsSuccess(true);
      setNoticeType('success');
      setNoticeMessage('Password recovery instructions have been sent to your email inbox.');
    } catch (err) {
      if (!isConfigured) {
        setNoticeType('error');
        setNoticeMessage('Email delivery requires configured Supabase Auth credentials.');
      } else {
        setNoticeType('error');
        setNoticeMessage(err.message || 'Could not send recovery instructions.');
      }
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
          <h1 className="text-xl font-serif text-primary">Reset password</h1>
          <p className="text-xs text-secondary">
            Enter your account email to receive recovery instructions.
          </p>
        </div>

        {noticeMessage && (
          <Toast
            type={noticeType}
            message={noticeMessage}
            onClose={() => setNoticeMessage('')}
          />
        )}

        {!isSuccess && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Email Address"
              type="email"
              required
              autoComplete="email"
              placeholder="name@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />

            <Button
              type="submit"
              variant="primary"
              size="md"
              isLoading={isLoading}
              className="w-full justify-center"
            >
              Send reset instructions
            </Button>
          </form>
        )}

        <div className="text-center text-xs text-secondary pt-2 border-t border-border">
          Remember your password?{' '}
          <Link to="/login" className="font-semibold text-accent hover:underline focus-visible:outline-accent rounded">
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
