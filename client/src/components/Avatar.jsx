import React, { useState } from 'react';

const SIZES = {
  xs: 'w-6 h-6 text-[10px]',
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-14 h-14 text-base font-semibold',
  xl: 'w-20 h-20 text-xl font-semibold',
  '2xl': 'w-28 h-28 text-2xl font-semibold',
};

function getInitials(name) {
  if (!name) return 'V';
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return parts[0].slice(0, 2).toUpperCase();
}

export function Avatar({
  src,
  alt = '',
  name = '',
  size = 'md',
  className = '',
}) {
  const [imageError, setImageError] = useState(false);
  const sizeClasses = SIZES[size] || SIZES.md;
  const initials = getInitials(name || alt);

  return (
    <div
      className={`relative inline-flex items-center justify-center shrink-0 rounded-full select-none overflow-hidden bg-accent-soft text-accent border border-border/50 ${sizeClasses} ${className}`}
      aria-label={alt || name || 'User avatar'}
    >
      {src && !imageError ? (
        <img
          src={src}
          alt={alt || name}
          onError={() => setImageError(true)}
          className="w-full h-full object-cover rounded-full"
          loading="lazy"
        />
      ) : (
        <span className="font-medium tracking-wider" aria-hidden="true">
          {initials}
        </span>
      )}
    </div>
  );
}

