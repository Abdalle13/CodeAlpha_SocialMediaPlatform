import React, { useId } from 'react';

export const Input = React.forwardRef(function Input(
  {
    label,
    hint,
    error,
    id: providedId,
    type = 'text',
    className = '',
    required = false,
    ...props
  },
  ref
) {
  const generatedId = useId();
  const id = providedId || generatedId;
  const hintId = `${id}-hint`;
  const errorId = `${id}-error`;

  return (
    <div className="w-full flex flex-col gap-1.5 text-left">
      {label && (
        <label htmlFor={id} className="text-xs font-semibold uppercase tracking-wider text-secondary">
          {label}
          {required && <span className="text-danger ml-1" aria-hidden="true">*</span>}
        </label>
      )}

      <input
        ref={ref}
        id={id}
        type={type}
        required={required}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? errorId : hint ? hintId : undefined}
        className={`w-full rounded-lg border bg-surface px-3.5 py-2 text-sm text-primary placeholder:text-secondary/60 transition-colors focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent disabled:opacity-50 disabled:bg-page ${
          error ? 'border-danger focus:border-danger focus:ring-danger' : 'border-border'
        } ${className}`}
        {...props}
      />

      {hint && !error && (
        <p id={hintId} className="text-xs text-secondary">
          {hint}
        </p>
      )}

      {error && (
        <p id={errorId} role="alert" className="text-xs font-medium text-danger">
          {error}
        </p>
      )}
    </div>
  );
});

