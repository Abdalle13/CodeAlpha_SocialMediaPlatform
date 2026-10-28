import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { Toast } from '../components/Toast';
import { Wordmark } from '../components/Wordmark';
import { ThemeToggle } from '../components/ThemeToggle';

describe('Veyra UI Primitives', () => {
  describe('Wordmark', () => {
    it('renders the Veyra brand name and monogram', () => {
      render(<Wordmark size="md" />);
      expect(screen.getByText('Veyra')).toBeInTheDocument();
    });
  });

  describe('Button', () => {
    it('renders text and responds to click events', () => {
      const handleClick = vi.fn();
      render(<Button onClick={handleClick}>Explore</Button>);
      const btn = screen.getByRole('button', { name: /explore/i });
      fireEvent.click(btn);
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('shows loading state and disables interactions when isLoading is true', () => {
      render(<Button isLoading>Publishing</Button>);
      const btn = screen.getByRole('button');
      expect(btn).toBeDisabled();
      expect(btn).toHaveAttribute('aria-busy', 'true');
    });

    it('applies destructive styling variant cleanly', () => {
      render(<Button variant="destructive">Delete Post</Button>);
      const btn = screen.getByRole('button', { name: /delete post/i });
      expect(btn.className).toContain('bg-danger');
    });
  });

  describe('Input', () => {
    it('associates label with input using htmlFor and id', () => {
      render(<Input label="Username" id="user-input" placeholder="handle" />);
      const input = screen.getByLabelText(/username/i);
      expect(input).toBeInTheDocument();
      expect(input.id).toBe('user-input');
    });

    it('displays validation error and marks input as aria-invalid', () => {
      render(<Input label="Email" error="Email is required" />);
      const input = screen.getByLabelText(/email/i);
      expect(input).toHaveAttribute('aria-invalid', 'true');
      expect(screen.getByRole('alert')).toHaveTextContent('Email is required');
    });
  });

  describe('Toast', () => {
    it('renders status message in an accessible live region', () => {
      render(<Toast type="success" message="Post published successfully." />);
      const toast = screen.getByRole('status');
      expect(toast).toHaveTextContent('Post published successfully.');
    });
  });

  describe('ThemeToggle', () => {
    it('toggles between light and dark themes on click', () => {
      render(<ThemeToggle />);
      const toggle = screen.getByRole('button', { name: /switch to/i });
      const initialTheme = document.documentElement.classList.contains('dark');
      fireEvent.click(toggle);
      expect(document.documentElement.classList.contains('dark')).toBe(!initialTheme);
    });
  });
});

