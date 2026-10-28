import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AuthProvider } from '../features/auth/AuthContext';
import { LoginPage } from '../routes/LoginPage';
import { RegisterPage } from '../routes/RegisterPage';
import { ForgotPasswordPage } from '../routes/ForgotPasswordPage';
import { ResetPasswordPage } from '../routes/ResetPasswordPage';

function renderWithProviders(ui) {
  return render(
    <AuthProvider>
      <MemoryRouter>
        {ui}
      </MemoryRouter>
    </AuthProvider>
  );
}

describe('Authentication Pages & Form Validation', () => {
  describe('LoginPage', () => {
    it('renders login form with remember me checkbox and credentials inputs', () => {
      renderWithProviders(<LoginPage />);
      expect(screen.getByRole('heading', { level: 1, name: /welcome back/i })).toBeInTheDocument();
      expect(screen.getByLabelText(/email or username/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/^password/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/remember me/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
    });

    it('toggles password visibility when show/hide button is clicked', () => {
      renderWithProviders(<LoginPage />);
      const passwordInput = screen.getByLabelText(/^password/i);
      const toggleBtn = screen.getByRole('button', { name: /show password/i });

      expect(passwordInput).toHaveAttribute('type', 'password');
      fireEvent.click(toggleBtn);
      expect(passwordInput).toHaveAttribute('type', 'text');
      fireEvent.click(screen.getByRole('button', { name: /hide password/i }));
      expect(passwordInput).toHaveAttribute('type', 'password');
    });
  });

  describe('RegisterPage', () => {
    it('enforces password confirmation match', () => {
      renderWithProviders(<RegisterPage />);
      
      fireEvent.change(screen.getByLabelText(/display name/i), { target: { value: 'Elena Archer' } });
      fireEvent.change(screen.getByLabelText(/username/i), { target: { value: 'elena' } });
      fireEvent.change(screen.getByLabelText(/email address/i), { target: { value: 'elena@example.com' } });
      fireEvent.change(screen.getByLabelText(/^password/i), { target: { value: 'password123' } });
      fireEvent.change(screen.getByLabelText(/confirm password/i), { target: { value: 'different123' } });
      fireEvent.click(screen.getByLabelText(/i agree to the/i));

      fireEvent.click(screen.getByRole('button', { name: /create account/i }));

      expect(screen.getByText(/passwords do not match/i)).toBeInTheDocument();
    });

    it('enforces minimum 8 character password length', () => {
      renderWithProviders(<RegisterPage />);

      fireEvent.change(screen.getByLabelText(/display name/i), { target: { value: 'Elena Archer' } });
      fireEvent.change(screen.getByLabelText(/username/i), { target: { value: 'elena' } });
      fireEvent.change(screen.getByLabelText(/email address/i), { target: { value: 'elena@example.com' } });
      fireEvent.change(screen.getByLabelText(/^password/i), { target: { value: 'short' } });
      fireEvent.change(screen.getByLabelText(/confirm password/i), { target: { value: 'short' } });
      fireEvent.click(screen.getByLabelText(/i agree to the/i));

      fireEvent.click(screen.getByRole('button', { name: /create account/i }));

      expect(screen.getByText(/at least 8 characters/i)).toBeInTheDocument();
    });

    it('enforces valid username alphanumeric format', () => {
      renderWithProviders(<RegisterPage />);

      fireEvent.change(screen.getByLabelText(/display name/i), { target: { value: 'Elena Archer' } });
      fireEvent.change(screen.getByLabelText(/username/i), { target: { value: 'invalid handle!' } });
      fireEvent.change(screen.getByLabelText(/email address/i), { target: { value: 'elena@example.com' } });
      fireEvent.change(screen.getByLabelText(/^password/i), { target: { value: 'password123' } });
      fireEvent.change(screen.getByLabelText(/confirm password/i), { target: { value: 'password123' } });
      fireEvent.click(screen.getByLabelText(/i agree to the/i));

      fireEvent.click(screen.getByRole('button', { name: /create account/i }));

      expect(screen.getByText(/3-30 alphanumeric characters/i)).toBeInTheDocument();
    });
  });

  describe('ForgotPasswordPage', () => {
    it('presents informative guidance without account enumeration', async () => {
      renderWithProviders(<ForgotPasswordPage />);
      const emailInput = screen.getByLabelText(/email address/i);
      fireEvent.change(emailInput, { target: { value: 'someone@example.com' } });

      fireEvent.click(screen.getByRole('button', { name: /send reset instructions/i }));

      // Either configured recovery success or honest unconfigured guidance is displayed
      const notice = await screen.findByText(/(if an account exists with this email|email delivery requires configured supabase auth credentials)/i);
      expect(notice).toBeInTheDocument();
    });
  });

  describe('ResetPasswordPage', () => {
    it('validates password matching on reset form', () => {
      renderWithProviders(<ResetPasswordPage />);
      fireEvent.change(screen.getByLabelText(/^new password/i), { target: { value: 'password123' } });
      fireEvent.change(screen.getByLabelText(/confirm password/i), { target: { value: 'mismatch123' } });

      fireEvent.click(screen.getByRole('button', { name: /update password/i }));

      expect(screen.getByText(/passwords do not match/i)).toBeInTheDocument();
    });
  });
});
