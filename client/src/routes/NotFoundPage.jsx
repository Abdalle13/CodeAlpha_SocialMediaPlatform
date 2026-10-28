import React from 'react';
import { Link } from 'react-router-dom';
import { FileQuestion, Home } from 'lucide-react';
import { Button } from '../components/Button';

export function NotFoundPage() {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-4 py-16">
      <div className="h-16 w-16 rounded-full bg-accent-soft text-accent flex items-center justify-center mb-6">
        <FileQuestion className="w-8 h-8" aria-hidden="true" />
      </div>

      <span className="text-xs uppercase tracking-wider font-semibold text-accent mb-2">Error 404</span>
      <h1 className="text-3xl sm:text-4xl font-serif text-primary">Page not found</h1>
      <p className="mt-3 text-sm text-secondary max-w-sm leading-relaxed">
        The page you are looking for doesn't exist, has been moved, or you may not have permission to view it.
      </p>

      <div className="mt-8 flex items-center gap-3">
        <Link to="/">
          <Button variant="primary" className="gap-2">
            <Home className="w-4 h-4" />
            <span>Return to Home</span>
          </Button>
        </Link>
      </div>
    </div>
  );
}

