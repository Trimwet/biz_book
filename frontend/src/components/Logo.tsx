import React from 'react';

const Logo = ({ className = '', size = 'default' }) => {
  const sizes = {
    small: 'text-xl',
    default: 'text-2xl',
    large: 'text-4xl',
    xlarge: 'text-6xl'
  };

  const textSize = sizes[size] || sizes.default;

  return (
    <div className={`font-bold tracking-tight ${textSize} ${className}`}>
      <span className="text-blue-600">BIZ</span>
      <span className="text-gray-900"> BOOK</span>
    </div>
  );
};

export default Logo;
