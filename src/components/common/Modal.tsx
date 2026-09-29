import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  description,
  children,
  maxWidth = 'md',
  className,
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose();
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

  const maxWidthStyles = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
  };

  const modalContent = (
    <div
      className="fixed inset-0 z-50 overflow-y-auto"
      role="dialog"
      aria-modal="true"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-deep/50 backdrop-blur-sm transition-opacity duration-200"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Centering / Bottom-sheet Wrapper: slides from bottom on mobile, centers on tablet/desktop */}
      <div className="flex min-h-full items-end sm:items-center justify-center p-0 sm:p-6 text-center">
        {/* Modal Dialog Card */}
        <div
          className={twMerge(
            clsx(
              'relative w-full bg-white rounded-t-2xl sm:rounded-card border-t sm:border border-slate-border shadow-level2 text-left z-10 flex flex-col max-h-[90dvh] sm:max-h-[calc(100vh-3rem)] pb-safe sm:pb-0 overflow-hidden transition-all transform duration-200',
              maxWidthStyles[maxWidth],
              className
            )
          )}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-slate-border/50 shrink-0 bg-white">
            <div className="pr-4">
              {title && (
                <h3 className="font-display font-bold text-base sm:text-lg text-slate-deep leading-snug">
                  {title}
                </h3>
              )}
              {description && (
                <p className="text-xs text-slate-muted mt-0.5">{description}</p>
              )}
            </div>
            <button
              type="button"
              onClick={onClose}
              className="min-w-[44px] min-h-[44px] flex items-center justify-center text-slate-muted hover:text-slate-deep rounded-full hover:bg-canvas-tint transition-colors"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="p-5 sm:p-6 overflow-y-auto flex-1">{children}</div>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};
