import React from 'react';
import { cn } from '../../utils/cn';

const Badge = ({ 
  className,
  variant = 'default',
  size = 'md',
  dot = false,
  animate = false,
  children,
  ...props 
}) => {
  const variants = {
    default: 'bg-gray-100 text-gray-800 border-gray-200',
    primary: 'bg-blue-100 text-blue-800 border-blue-200',
    secondary: 'bg-purple-100 text-purple-800 border-purple-200',
    success: 'bg-green-100 text-green-800 border-green-200',
    warning: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    danger: 'bg-red-100 text-red-800 border-red-200',
    info: 'bg-cyan-100 text-cyan-800 border-cyan-200',
    outline: 'bg-transparent text-gray-800 border-gray-400',
    gradient: 'bg-gradient-to-r from-blue-500 to-purple-500 text-white border-transparent',
  };

  const sizes = {
    xs: 'text-xs px-2 py-0.5',
    sm: 'text-xs px-2.5 py-0.5',
    md: 'text-sm px-3 py-1',
    lg: 'text-base px-4 py-1.5',
  };

  const dotSizes = {
    xs: 'w-1.5 h-1.5',
    sm: 'w-2 h-2',
    md: 'w-2.5 h-2.5',
    lg: 'w-3 h-3',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center font-medium rounded-full border transition-all duration-200',
        variants[variant],
        sizes[size],
        animate && 'animate-pulse',
        className
      )}
      {...props}
    >
      {dot && (
        <span className={cn('rounded-full bg-current mr-1.5', dotSizes[size], animate && 'animate-pulse')} />
      )}
      {children}
    </span>
  );
};

export default Badge;