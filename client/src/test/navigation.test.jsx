import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { LandingPage } from '../routes/LandingPage';
import { TermsPage } from '../routes/TermsPage';
import { PrivacyPage } from '../routes/PrivacyPage';
import { NotFoundPage } from '../routes/NotFoundPage';

describe('Public Pages Rendering', () => {
  it('renders LandingPage with headline and CTA', () => {
    render(
      <MemoryRouter>
        <LandingPage />
      </MemoryRouter>
    );
    expect(screen.getByRole('heading', { level: 1, name: /share your world/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /create your account/i })).toBeInTheDocument();
  });

  it('renders TermsPage with structured policy sections', () => {
    render(
      <MemoryRouter>
        <TermsPage />
      </MemoryRouter>
    );
    expect(screen.getByRole('heading', { level: 1, name: /terms of service/i })).toBeInTheDocument();
    expect(screen.getByText(/acceptance of terms/i)).toBeInTheDocument();
  });

  it('renders PrivacyPage with data protection details', () => {
    render(
      <MemoryRouter>
        <PrivacyPage />
      </MemoryRouter>
    );
    expect(screen.getByRole('heading', { level: 1, name: /privacy notice/i })).toBeInTheDocument();
    expect(screen.getByText(/our commitment/i)).toBeInTheDocument();
  });

  it('renders NotFoundPage with return action', () => {
    render(
      <MemoryRouter>
        <NotFoundPage />
      </MemoryRouter>
    );
    expect(screen.getByRole('heading', { level: 1, name: /page not found/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /return to home/i })).toBeInTheDocument();
  });
});

