import React from 'react';

export function Skeleton({ className = '', ...props }) {
  return (
    <div
      className={`animate-pulse rounded-md bg-border/40 ${className}`}
      aria-hidden="true"
      {...props}
    />
  );
}

export function PostCardSkeleton() {
  return (
    <div className="w-full rounded-xl border border-border bg-surface p-5 space-y-4">
      <div className="flex items-center gap-3">
        <Skeleton className="h-10 w-10 rounded-full" />
        <div className="space-y-1.5 flex-1">
          <Skeleton className="h-3.5 w-28" />
          <Skeleton className="h-3 w-16" />
        </div>
      </div>
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-4/5" />
      <Skeleton className="h-64 w-full rounded-lg" />
    </div>
  );
}

