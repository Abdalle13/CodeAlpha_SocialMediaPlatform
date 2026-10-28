import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Wordmark } from '../components/Wordmark';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { Toast } from '../components/Toast';
import { useAuth } from '../features/auth/AuthContext';

export function ForgotPasswordPage() {
  const { resetPasswordForEmail, isConfigured } = useAuth();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [noticeMessage, setNoticeMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setNoticeMessage('');

    try {
      await resetPasswordForEmail(email);
      setIsSuccess(true);
      setNoticeMessage('If an account exists with this email, password recovery instructions have been sent to your inbox.');
    } catch (err) {
      // In production or unconfigured environments:
      if (!isConfigured) {
        setNoticeMessage('Email delivery requires configured Supabase Auth credentials in environment variables.');
      } else {
        // Generic response to prevent account enumeration
        setIsSuccess(true);
        setNoticeMessage('If an account exists with this email, password recovery instructions have been sent to your inbox.');
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
            type={isSuccess ? 'success' : 'info'}
            message={noticeMessage}
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
