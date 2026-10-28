import React from 'react';

export function Wordmark({ size = 'md', className = '', showMonogram = true }) {
  const sizeClasses = {
    sm: 'text-lg',
    md: 'text-xl',
    lg: 'text-2xl',
    xl: 'text-3xl',
  };

  const markSizes = {
    sm: 20,
    md: 24,
    lg: 28,
    xl: 36,
  };

  const currentMarkSize = markSizes[size] || 24;

  return (
    <div className={`inline-flex items-center gap-2.5 font-semibold tracking-tight text-primary select-none ${className}`}>
      {showMonogram && (
        <svg
          width={currentMarkSize}
          height={currentMarkSize}
          viewBox="0 0 32 32"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
          className="shrink-0 transition-transform duration-150 hover:scale-105"
        >
          <rect width="32" height="32" rx="7" fill="currentColor" className="text-accent" />
          <path
            d="M9 10L16 23L23 10"
            stroke="#F8F8F5"
            strokeWidth="2.75"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )}
      <span className={`font-serif tracking-tight ${sizeClasses[size] || 'text-xl'}`}>
        Veyra
      </span>
    </div>
  );
}

