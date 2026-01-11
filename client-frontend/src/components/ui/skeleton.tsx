import React from 'react';
import { cn } from '@/lib/utils';

interface SkeletonProps {
  className?: string;
  rows?: number;
  height?: string;
}

const Skeleton: React.FC<SkeletonProps> = ({ className, rows = 1, height = 'h-4' }) => {
  if (rows === 1) {
    return (
      <div
        className={cn(
          'animate-pulse bg-gray-200 rounded',
          height,
          className
        )}
      />
    );
  }

  return (
    <div className="space-y-2">
      {Array.from({ length: rows }).map((_, index) => (
        <div
          key={index}
          className={cn(
            'animate-pulse bg-gray-200 rounded',
            height,
            className
          )}
        />
      ))}
    </div>
  );
};

// Mobile-optimized skeleton card
export const SkeletonCard: React.FC<{ className?: string }> = ({ className }) => (
  <div className={cn('p-4 space-y-3', className)}>
    <Skeleton height="h-6" />
    <Skeleton height="h-4" />
    <Skeleton height="h-4" />
    <Skeleton height="h-8" />
  </div>
);

// Mobile-optimized skeleton table
export const SkeletonTable: React.FC<{ rows?: number; className?: string }> = ({ 
  rows = 5, 
  className 
}) => (
  <div className={cn('space-y-2', className)}>
    <div className="flex space-x-4">
      <Skeleton height="h-6" className="w-1/4" />
      <Skeleton height="h-6" className="w-1/4" />
      <Skeleton height="h-6" className="w-1/4" />
      <Skeleton height="h-6" className="w-1/4" />
    </div>
    {Array.from({ length: rows }).map((_, index) => (
      <div key={index} className="flex space-x-4">
        <Skeleton height="h-4" className="w-1/4" />
        <Skeleton height="h-4" className="w-1/4" />
        <Skeleton height="h-4" className="w-1/4" />
        <Skeleton height="h-4" className="w-1/4" />
      </div>
    ))}
  </div>
);

// Mobile-optimized skeleton list
export const SkeletonList: React.FC<{ items?: number; className?: string }> = ({ 
  items = 3, 
  className 
}) => (
  <div className={cn('space-y-3', className)}>
    {Array.from({ length: items }).map((_, index) => (
      <div key={index} className="flex items-center space-x-3">
        <Skeleton height="h-10" width="w-10" className="rounded-full" />
        <div className="flex-1 space-y-1">
          <Skeleton height="h-4" />
          <Skeleton height="h-3" className="w-3/4" />
        </div>
      </div>
    ))}
  </div>
);

export default Skeleton;
