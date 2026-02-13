import { useEffect, type FC, type ReactNode } from 'react';
import clsx from 'clsx';
import { twMerge } from 'tailwind-merge';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
}

const Modal: FC<ModalProps> = ({ 
  isOpen, 
  onClose, 
  title, 
  children, 
  footer, 
  className 
}) => {
  // Close on Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      // Prevent scrolling when modal is open
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-gray-900/50 backdrop-blur-sm animate-in fade-in duration-300"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Content */}
      <div 
        className={twMerge(
          clsx(
            "relative bg-white w-full max-w-md p-6 rounded-2xl shadow-2xl border border-indigo-50",
            "animate-in zoom-in-95 slide-in-from-bottom-4 duration-300",
            className
          )
        )}
        role="dialog"
        aria-modal="true"
      >
        {title && (
          <div className="mb-4">
            <h2 className="text-xl font-bold text-gray-900">{title}</h2>
          </div>
        )}
        
        <div className="mb-6 text-gray-600">
          {children}
        </div>

        {footer && (
          <div className="flex justify-end gap-3 mt-6">
            {footer}
          </div>
        )}

        {/* Close button (X) */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
          aria-label="Cerrar modal"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default Modal;
