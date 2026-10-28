import React from 'react';

export function EmptyState({ icon: Icon, title, description, action, className = '' }) {
  return (
    <div className={`flex flex-col items-center justify-center text-center p-8 rounded-xl border border-dashed border-border bg-surface/50 ${className}`}>
      {Icon && (
        <div className="h-12 w-12 rounded-full bg-accent-soft flex items-center justify-center text-accent mb-3.5" aria-hidden="true">
          <Icon className="w-6 h-6" />
        </div>
      )}
      <h3 className="text-base font-semibold text-primary">{title}</h3>
      {description && <p className="mt-1 text-xs text-secondary max-w-sm">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

