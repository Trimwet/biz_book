import React from 'react';

const Loading = ({ size = 'medium', text = 'Loading...' }) => {
  const sizeClasses = {
    small: 'w-4 h-4',
    medium: 'w-8 h-8',
    large: 'w-12 h-12'
  };

  return (
    <div className="flex flex-col items-center justify-center p-8">
      <div className={`spinner ${sizeClasses[size]}`} role="status">
        <span className="sr-only">{text}</span>
      </div>
      {text && (
        <p className="mt-4 text-gray-600 text-sm">{text}</p>
      )}
    </div>
  );
};

export const SkeletonLoader = ({ type = 'card', count = 1 }) => {
  const skeletonElements = [];
  
  for (let i = 0; i < count; i++) {
    if (type === 'card') {
      skeletonElements.push(
        <div key={i} className="skeleton-card hover-lift" />
      );
    } else if (type === 'text') {
      skeletonElements.push(
        <div key={i} className="skeleton-text" />
      );
    } else if (type === 'button') {
      skeletonElements.push(
        <div key={i} className="skeleton-button" />
      );
    }
  }

  return (
    <div className={`skeleton-container ${type === 'card' ? 'grid gap-4' : 'space-y-2'}`}>
      {skeletonElements}
    </div>
  );
};

export default Loading;