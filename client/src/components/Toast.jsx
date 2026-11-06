import React from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export function Toast({ type = 'info', message, onClose, className = '' }) {
  if (!message) return null;

  const icons = {
    success: (
      <div className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shrink-0">
        <CheckCircle2 className="w-4 h-4" aria-hidden="true" />
      </div>
    ),
    error: (
      <div className="flex h-7 w-7 items-center justify-center rounded-full bg-red-500/10 text-red-600 dark:text-red-400 shrink-0">
        <AlertCircle className="w-4 h-4" aria-hidden="true" />
      </div>
    ),
    info: (
      <div className="flex h-7 w-7 items-center justify-center rounded-full bg-neutral-500/10 text-neutral-600 dark:text-neutral-400 shrink-0">
        <Info className="w-4 h-4" aria-hidden="true" />
      </div>
    ),
  };

  return (
    <aside
      aria-live="polite"
      role="status"
      className={`flex items-center justify-between gap-3 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-black px-4 py-2.5 shadow-none text-xs sm:text-sm text-neutral-900 dark:text-neutral-100 transition-all duration-200 animate-in fade-in slide-in-from-top-2 ${className}`}
    >
      <div className="flex items-center gap-2.5 min-w-0">
        {icons[type] || icons.info}
        <span className="font-medium tracking-tight truncate">{message}</span>
      </div>
      {onClose && (
        <button
          onClick={onClose}
          type="button"
          aria-label="Dismiss alert"
          className="text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 p-1 rounded-full transition-colors focus-visible:outline-accent"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}
    </aside>
  );
}


