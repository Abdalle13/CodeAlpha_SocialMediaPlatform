import React from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export function Toast({ type = 'info', message, onClose, className = '' }) {
  if (!message) return null;

  const icons = {
    success: <CheckCircle2 className="w-5 h-5 text-accent shrink-0" aria-hidden="true" />,
    error: <AlertCircle className="w-5 h-5 text-danger shrink-0" aria-hidden="true" />,
    info: <Info className="w-5 h-5 text-secondary shrink-0" aria-hidden="true" />,
  };

  const borders = {
    success: 'border-accent/30 bg-accent-soft text-primary',
    error: 'border-danger/30 bg-danger-soft text-danger',
    info: 'border-border bg-surface text-primary',
  };

  return (
    <aside
      aria-live="polite"
      role="status"
      className={`flex items-center justify-between gap-3 rounded-lg border px-4 py-3 shadow-sm text-sm ${borders[type] || borders.info} ${className}`}
    >
      <div className="flex items-center gap-2.5">
        {icons[type]}
        <span>{message}</span>
      </div>
      {onClose && (
        <button
          onClick={onClose}
          type="button"
          aria-label="Dismiss alert"
          className="opacity-70 hover:opacity-100 p-0.5 rounded focus-visible:outline-2 focus-visible:outline-accent"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </aside>
  );
}

