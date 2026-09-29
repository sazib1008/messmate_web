import React from 'react';
import { AlertCircle, CheckCircle2, AlertTriangle, Info, X } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export interface AlertProps {
  type?: 'info' | 'success' | 'warning' | 'error';
  title?: string;
  children: React.ReactNode;
  onDismiss?: () => void;
  className?: string;
}

export const Alert: React.FC<AlertProps> = ({
  type = 'info',
  title,
  children,
  onDismiss,
  className,
}) => {
  const typeStyles = {
    info: 'bg-[#EFF6FF] border-[#3B82F6]/30 text-[#1E3A8A]',
    success: 'bg-[#ECFDF5] border-[#10B981]/30 text-[#065F46]',
    warning: 'bg-[#FFFBEB] border-[#F59E0B]/30 text-[#92400E]',
    error: 'bg-[#FEF2F2] border-[#EF4444]/30 text-[#991B1B]',
  };

  const icons = {
    info: <Info className="w-5 h-5 text-[#3B82F6] shrink-0 mt-0.5" />,
    success: <CheckCircle2 className="w-5 h-5 text-[#10B981] shrink-0 mt-0.5" />,
    warning: <AlertTriangle className="w-5 h-5 text-[#F59E0B] shrink-0 mt-0.5" />,
    error: <AlertCircle className="w-5 h-5 text-[#EF4444] shrink-0 mt-0.5" />,
  };

  return (
    <div
      className={twMerge(
        clsx(
          'p-4 rounded-card border flex items-start gap-3 transition-all',
          typeStyles[type],
          className
        )
      )}
    >
      {icons[type]}
      <div className="flex-1 text-xs sm:text-sm font-body">
        {title && <h5 className="font-bold font-display text-sm mb-0.5">{title}</h5>}
        <div className="opacity-95 leading-relaxed">{children}</div>
      </div>
      {onDismiss && (
        <button
          onClick={onDismiss}
          className="p-1 -mr-1 text-current opacity-60 hover:opacity-100 transition-opacity"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};
