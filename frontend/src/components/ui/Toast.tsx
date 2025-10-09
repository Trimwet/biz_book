import React, { useCallback, useState } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '../../utils/cn';
import { FiX, FiCheck, FiAlertCircle, FiInfo, FiAlertTriangle } from 'react-icons/fi';
import { ToastContext } from '../../contexts/ToastContext';

// Toast Provider
let toastCounter = 0;

export const ToastProvider = ({ children, position = 'top-right', duration = 5000 }) => {
  const [toasts, setToasts] = useState([]);

  const toast = useCallback((message, options = {}) => {
    // Generate unique ID using timestamp + counter to avoid collisions
    const id = `${Date.now()}-${++toastCounter}`;
    const newToast = {
      id,
      message,
      type: options.type || 'default',
      duration: options.duration || duration,
      ...options,
    };

    setToasts((prev) => [...prev, newToast]);

    // Auto dismiss
    if (newToast.duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, newToast.duration);
    }
  }, [duration]);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  // Helper methods
  const success = useCallback((message, options) => 
    toast(message, { ...options, type: 'success' }), [toast]);
  
  const error = useCallback((message, options) => 
    toast(message, { ...options, type: 'error' }), [toast]);
  
  const warning = useCallback((message, options) => 
    toast(message, { ...options, type: 'warning' }), [toast]);
  
  const info = useCallback((message, options) => 
    toast(message, { ...options, type: 'info' }), [toast]);

  const value = {
    toast,
    success,
    error,
    warning,
    info,
    removeToast,
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      {createPortal(
        <ToastContainer toasts={toasts} removeToast={removeToast} position={position} />,
        document.body
      )}
    </ToastContext.Provider>
  );
};

// Toast Container
const ToastContainer = ({ toasts, removeToast, position }) => {
  const positions = {
    'top-left': 'top-4 left-4',
    'top-center': 'top-4 left-1/2 -translate-x-1/2',
    'top-right': 'top-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'bottom-center': 'bottom-4 left-1/2 -translate-x-1/2',
    'bottom-right': 'bottom-4 right-4',
  };

  return (
    <div className={cn('fixed z-50 pointer-events-none', positions[position])}>
      <div className="flex flex-col gap-2">
        {toasts.map((toast) => (
          <Toast key={toast.id} toast={toast} onClose={() => removeToast(toast.id)} />
        ))}
      </div>
    </div>
  );
};

// Individual Toast Component
const Toast = ({ toast, onClose }) => {
  const { message, type, action } = toast;

  const types = {
    default: {
      bg: 'bg-white border-gray-200',
      icon: <FiInfo className="w-5 h-5 text-gray-600" />,
      text: 'text-gray-900',
    },
    success: {
      bg: 'bg-green-50 border-green-200',
      icon: <FiCheck className="w-5 h-5 text-green-600" />,
      text: 'text-green-900',
    },
    error: {
      bg: 'bg-red-50 border-red-200',
      icon: <FiAlertCircle className="w-5 h-5 text-red-600" />,
      text: 'text-red-900',
    },
    warning: {
      bg: 'bg-yellow-50 border-yellow-200',
      icon: <FiAlertTriangle className="w-5 h-5 text-yellow-600" />,
      text: 'text-yellow-900',
    },
    info: {
      bg: 'bg-blue-50 border-blue-200',
      icon: <FiInfo className="w-5 h-5 text-blue-600" />,
      text: 'text-blue-900',
    },
  };

  const style = types[type] || types.default;

  return (
    <div
      className={cn(
        'pointer-events-auto flex items-start gap-3 p-4 pr-12 rounded-lg border shadow-lg',
        'animate-slide-in-down transition-all duration-300',
        'min-w-[300px] max-w-[500px]',
        style.bg
      )}
    >
      {style.icon}
      <div className="flex-1">
        <p className={cn('text-sm', style.text)}>{message}</p>
        {action && (
          <button
            onClick={action.onClick}
            className={cn('mt-2 text-sm font-medium hover:underline', style.text)}
          >
            {action.label}
          </button>
        )}
      </div>
      <button
        onClick={onClose}
        className="absolute top-4 right-4 p-1 rounded-md hover:bg-gray-100/50 transition-colors"
      >
        <FiX className="w-4 h-4 text-gray-500" />
      </button>
    </div>
  );
};

export default Toast;