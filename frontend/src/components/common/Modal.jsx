import React, { useEffect } from 'react';
import { X } from 'lucide-react';

export const Modal = ({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  maxWidth = 'max-w-lg',
  showClose = true,
}) => {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div className="flex min-h-full items-center justify-center p-4 text-center sm:p-0">
        <div
          className={`relative transform overflow-hidden rounded-2xl bg-slate-900 border border-slate-800 text-left shadow-2xl transition-all sm:my-8 w-full ${maxWidth} glass-panel`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-800/80 px-6 py-4">
            <div>
              <h3 className="text-base font-semibold text-white">{title}</h3>
              {subtitle && <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>}
            </div>
            {showClose && (
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors focus:outline-none"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* Body */}
          <div className="px-6 py-5">{children}</div>
        </div>
      </div>
    </div>
  );
};
