import { cn } from '../../utils/cn';
import React from 'react';
// Card component with multiple variants and hover effects

const Card = ({ 
  className,
  variant = 'default',
  hoverable = false,
  padding = 'md',
  children,
  onClick,
  ...props 
}) => {
  const variants = {
    default: 'bg-white border border-gray-200 shadow-sm',
    elevated: 'bg-white shadow-lg',
    outlined: 'bg-transparent border-2 border-gray-300',
    ghost: 'bg-gray-50/50 backdrop-blur-sm',
    gradient: 'bg-gradient-to-br from-white to-gray-50 border border-gray-200 shadow-lg',
    glass: 'bg-white/70 backdrop-blur-md border border-white/20 shadow-xl',
  };

  const paddings = {
    none: 'p-0',
    xs: 'p-2',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
    xl: 'p-10',
  };

  const hoverStyles = hoverable ? 'hover:shadow-xl hover:-translate-y-1 hover:border-gray-300 cursor-pointer active:scale-[0.99]' : '';

  return (
    <div
      className={cn(
        'rounded-xl transition-all duration-300 relative overflow-hidden',
        variants[variant],
        paddings[padding],
        hoverStyles,
        className
      )}
      onClick={onClick}
      {...props}
    >
      {/* Animated gradient overlay for hover effect */}
      {hoverable && (
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/0 to-purple-500/0 hover:from-blue-500/5 hover:to-purple-500/5 transition-all duration-500 pointer-events-none" />
      )}
      
      {children}
    </div>
  );
};

// Sub-components for better composition
Card.Header = ({ className, children, ...props }) => (
  <div className={cn('pb-4 border-b border-gray-200', className)} {...props}>
    {children}
  </div>
);

Card.Title = ({ className, children, ...props }) => (
  <h3 className={cn('text-xl font-semibold text-gray-900', className)} {...props}>
    {children}
  </h3>
);

Card.Description = ({ className, children, ...props }) => (
  <p className={cn('text-sm text-gray-600 mt-1', className)} {...props}>
    {children}
  </p>
);

Card.Content = ({ className, children, ...props }) => (
  <div className={cn('pt-4', className)} {...props}>
    {children}
  </div>
);

Card.Footer = ({ className, children, ...props }) => (
  <div className={cn('pt-4 mt-4 border-t border-gray-200 flex items-center justify-between', className)} {...props}>
    {children}
  </div>
);

export default Card;

// Named exports for sub-components
export const CardHeader = Card.Header;
export const CardTitle = Card.Title;
export const CardContent = Card.Content;
export const CardDescription = Card.Description;
export const CardFooter = Card.Footer;