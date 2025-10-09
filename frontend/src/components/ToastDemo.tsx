import React from 'react';
import { useToast } from './ui';

const ToastDemo = () => {
  const { success, error, warning, info, toast } = useToast();

  const showSuccessToast = () => {
    success('Operation completed successfully!');
  };

  const showErrorToast = () => {
    error('Something went wrong. Please try again.');
  };

  const showWarningToast = () => {
    warning('This action cannot be undone.');
  };

  const showInfoToast = () => {
    info('Here is some useful information.');
  };

  const showCustomToast = () => {
    toast('Custom message with action', {
      type: 'info',
      duration: 10000, // 10 seconds
      action: {
        label: 'Undo',
        onClick: () => {
          success('Action undone!');
        }
      }
    });
  };

  const showPersistentToast = () => {
    toast('This toast will stay until manually closed', {
      type: 'warning',
      duration: 0 // 0 means it won't auto-dismiss
    });
  };

  return (
    <div className="p-8 space-y-4">
      <h2 className="text-2xl font-bold mb-6">Toast Notification Demo</h2>
      
      <div className="grid grid-cols-2 gap-4">
        <button
          onClick={showSuccessToast}
          className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
        >
          Show Success Toast
        </button>
        
        <button
          onClick={showErrorToast}
          className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
        >
          Show Error Toast
        </button>
        
        <button
          onClick={showWarningToast}
          className="bg-yellow-500 text-white px-4 py-2 rounded hover:bg-yellow-600"
        >
          Show Warning Toast
        </button>
        
        <button
          onClick={showInfoToast}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Show Info Toast
        </button>
        
        <button
          onClick={showCustomToast}
          className="bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-600"
        >
          Show Custom Toast with Action
        </button>
        
        <button
          onClick={showPersistentToast}
          className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
        >
          Show Persistent Toast
        </button>
      </div>

      <div className="mt-8 p-4 bg-gray-100 rounded">
        <h3 className="font-semibold mb-2">Usage Examples:</h3>
        <pre className="text-sm bg-white p-2 rounded overflow-x-auto">
{`// Import the hook
import { useToast } from './ui';

// In your component
const { success, error, warning, info, toast } = useToast();

// Basic usage
success('Profile updated successfully!');
error('Failed to save changes');
warning('This will delete all data');
info('New features available');

// Custom toast with action
toast('Item added to cart', {
  type: 'success',
  duration: 5000,
  action: {
    label: 'View Cart',
    onClick: () => navigate('/cart')
  }
});

// Persistent toast (manual dismiss only)
toast('Important notice', {
  type: 'warning',
  duration: 0 // Won't auto-dismiss
});`}
        </pre>
      </div>
    </div>
  );
};

export default ToastDemo;