import { useEffect, useRef } from 'react';
import React from 'react';
import { createPortal } from 'react-dom';
import { cn } from '../../utils/cn';
import Button from './Button';
import { FiX } from 'react-icons/fi';

const Modal = ({
  isOpen,
  onClose,
  title,
  description,
  children,
  footer,
  size = 'md',
  closeOnBackdrop = true,
  closeOnEscape = true,
  showCloseButton = true,
  className,
  ...props
}) => {
  const modalRef = useRef(null);

  const sizes = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
    full: 'max-w-[95vw]',
  };

  useEffect(() => {
    const handleEscape = (e) => {
      if (closeOnEscape && e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose, closeOnEscape]);

  if (!isOpen) return null;

  const modalContent = (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 transition-opacity duration-300 animate-fade-in"
        onClick={closeOnBackdrop ? onClose : undefined}
        aria-hidden="true"
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
        <div
          ref={modalRef}
          className={cn(
            'bg-white rounded-2xl shadow-2xl w-full animate-scale-in',
            'transform transition-all duration-300',
            'relative max-h-[90vh] flex flex-col',
            sizes[size],
            className
          )}
          onClick={(e) => e.stopPropagation()}
          role="dialog"
          aria-modal="true"
          aria-labelledby={title ? 'modal-title' : undefined}
          aria-describedby={description ? 'modal-description' : undefined}
          {...props}
        >
          {/* Header */}
          {(title || showCloseButton) && (
            <div className="flex items-start justify-between p-6 border-b border-gray-200">
              <div>
                {title && (
                  <h2 id="modal-title" className="text-xl font-semibold text-gray-900">
                    {title}
                  </h2>
                )}
                {description && (
                  <p id="modal-description" className="mt-1 text-sm text-gray-600">
                    {description}
                  </p>
                )}
              </div>
              {showCloseButton && (
                <button
                  onClick={onClose}
                  className="ml-4 p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                  aria-label="Close modal"
                >
                  <FiX className="w-5 h-5" />
                </button>
              )}
            </div>
          )}

          {/* Content */}
          <div className="flex-1 p-6 overflow-y-auto">
            {children}
          </div>

          {/* Footer */}
          {footer && (
            <div className="p-6 border-t border-gray-200 bg-gray-50 rounded-b-2xl">
              {footer}
            </div>
          )}
        </div>
      </div>
    </>
  );

  return createPortal(modalContent, document.body);
};

// Preset modal types
Modal.Confirm = ({ isOpen, onClose, onConfirm, title, message, confirmText = 'Confirm', cancelText = 'Cancel', variant = 'danger' }) => (
  <Modal
    isOpen={isOpen}
    onClose={onClose}
    title={title}
    size="sm"
    footer={
      <div className="flex gap-3 justify-end">
        <Button variant="outline" onClick={onClose}>
          {cancelText}
        </Button>
        <Button variant={variant} onClick={onConfirm}>
          {confirmText}
        </Button>
      </div>
    }
  >
    <p className="text-gray-600">{message}</p>
  </Modal>
);

export default Modal;