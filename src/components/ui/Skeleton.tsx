'use me';
import React from 'react';

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {}

export function Skeleton({ className, ...props }: SkeletonProps) {
  return (
    <div
      className={`animate-pulse rounded-xl bg-slate-200/80 ${className || ''}`}
      {...props}
    />
  );
}
