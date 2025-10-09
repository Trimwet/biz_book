import React, { forwardRef, isValidElement, cloneElement } from 'react';
import { cn } from '../../utils/cn';
// Button component with multiple variants, sizes, loading state, and icons
// Using Tailwind CSS for styling

const Button = forwardRef(({ 
  className,
  variant = 'primary',
  size = 'md',
  loading = false,
  icon,
  iconPosition = 'left',
  asChild = false,
  children,
  disabled,
  ...props 
}, ref) => {
  const baseStyles = 'inline-flex items-center justify-center font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98] relative overflow-hidden group';
  
  const variants = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500 shadow-lg hover:shadow-xl',
    secondary: 'bg-gray-100 text-gray-900 hover:bg-gray-200 focus:ring-gray-400',
    outline: 'border-2 border-gray-300 text-gray-700 hover:bg-gray-50 focus:ring-gray-400',
    ghost: 'text-gray-700 hover:bg-gray-100 focus:ring-gray-400',
    danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500',
    success: 'bg-green-600 text-white hover:bg-green-700 focus:ring-green-500',
    gradient: 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 focus:ring-purple-500 shadow-lg hover:shadow-xl',
  };

  const sizes = {
    xs: 'text-xs px-2.5 py-1.5 rounded-md',
    sm: 'text-sm px-3 py-2 rounded-md',
    md: 'text-sm px-4 py-2.5 rounded-lg',
    lg: 'text-base px-6 py-3 rounded-lg',
    xl: 'text-lg px-8 py-4 rounded-xl',
  };

  const iconSizes = {
    xs: 'w-3 h-3',
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
    xl: 'w-7 h-7',
  };

  const LoadingSpinner = () => (
    <svg 
      className={cn("animate-spin", iconSizes[size], iconPosition === 'left' ? 'mr-2' : 'ml-2')} 
      xmlns="http://www.w3.org/2000/svg" 
      fill="none" 
      viewBox="0 0 24 24"
    >
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
  );

  const renderIcon = () => {
    if (loading) return <LoadingSpinner />;
    if (icon) {
      return <span className={cn(iconSizes[size], iconPosition === 'left' ? 'mr-2' : 'ml-2')}>
        {icon}
      </span>;
    }
    return null;
  };

  // Support rendering child as the root element (e.g., Link) when asChild is true
  if (asChild && isValidElement(children)) {
    return cloneElement(children, {
      ref,
      className: cn(baseStyles, variants[variant], sizes[size], children.props.className, className),
      'aria-disabled': disabled || loading ? true : undefined,
      ...props,
      children: (
        <>
          {/* Ripple effect */}
          <span className="absolute inset-0 overflow-hidden rounded-inherit">
            <span className="absolute inset-0 rounded-inherit bg-current opacity-0 transition-opacity duration-300 group-hover:opacity-10"></span>
          </span>
          {/* Content */}
          <span className="relative flex items-center">
            {iconPosition === 'left' && renderIcon()}
            {children.props.children}
            {iconPosition === 'right' && renderIcon()}
          </span>
        </>
      )
    });
  }

  return (
    <button
      ref={ref}
      className={cn(
        baseStyles,
        variants[variant],
        sizes[size],
        className
      )}
      disabled={disabled || loading}
      {...props}
    >
      {/* Ripple effect */}
      <span className="absolute inset-0 overflow-hidden rounded-inherit">
        <span className="absolute inset-0 rounded-inherit bg-current opacity-0 transition-opacity duration-300 group-hover:opacity-10"></span>
      </span>
      
      {/* Content */}
      <span className="relative flex items-center">
        {iconPosition === 'left' && renderIcon()}
        {children}
        {iconPosition === 'right' && renderIcon()}
      </span>
    </button>
  );
});

Button.displayName = 'Button';

export default Button;