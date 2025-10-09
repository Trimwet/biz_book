import { cn } from '../../utils/cn';
import React from 'react';
// Skeleton component

const Skeleton = ({ className, variant = 'default', animation = 'pulse', ...props }) => {
  const variants = {
    default: 'bg-gray-200',
    light: 'bg-gray-100',
    dark: 'bg-gray-300',
    primary: 'bg-blue-100',
  };

  const animations = {
    pulse: 'animate-pulse',
    shimmer: 'animate-shimmer bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 bg-[length:200%_100%]',
    none: '',
  };

  return (
    <div
      className={cn(
        'rounded-md',
        variants[variant],
        animations[animation],
        className
      )}
      {...props}
    />
  );
};

// Preset skeleton components
Skeleton.Text = ({ lines = 3, className, ...props }) => (
  <div className={cn('space-y-2', className)} {...props}>
    {Array.from({ length: lines }).map((_, i) => (
      <Skeleton
        key={i}
        className={cn(
          'h-4',
          i === lines - 1 && 'w-3/4'
        )}
      />
    ))}
  </div>
);

Skeleton.Avatar = ({ size = 'md', className, ...props }) => {
  const sizes = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16',
  };

  return (
    <Skeleton
      className={cn('rounded-full', sizes[size], className)}
      {...props}
    />
  );
};

Skeleton.Card = ({ className, ...props }) => (
  <div className={cn('space-y-4', className)} {...props}>
    <Skeleton className="h-48 w-full rounded-lg" />
    <div className="space-y-2">
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-5/6" />
    </div>
    <div className="flex justify-between items-center pt-2">
      <Skeleton className="h-8 w-24" />
      <Skeleton className="h-8 w-20" />
    </div>
  </div>
);

Skeleton.Table = ({ rows = 5, columns = 4, className, ...props }) => (
  <div className={cn('w-full', className)} {...props}>
    {/* Header */}
    <div className="flex gap-4 p-4 border-b">
      {Array.from({ length: columns }).map((_, i) => (
        <Skeleton key={i} className="h-4 flex-1" />
      ))}
    </div>
    {/* Rows */}
    {Array.from({ length: rows }).map((_, rowIndex) => (
      <div key={rowIndex} className="flex gap-4 p-4 border-b">
        {Array.from({ length: columns }).map((_, colIndex) => (
          <Skeleton key={colIndex} className="h-4 flex-1" />
        ))}
      </div>
    ))}
  </div>
);

export default Skeleton;