import React from 'react';
import { Loader2 } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  icon,
  iconPosition = 'left',
  fullWidth = false,
  className,
  disabled,
  ...props
}) => {
  const baseStyles = 'inline-flex items-center justify-center font-medium font-body transition-all duration-150 tactile-btn focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none disabled:cursor-not-allowed';

  const sizeStyles = {
    sm: 'h-9 px-3 text-xs rounded-input gap-1.5 min-h-[36px]',
    md: 'h-12 px-5 text-sm font-semibold rounded-button gap-2 min-h-[48px]',
    lg: 'h-14 px-7 text-base font-semibold rounded-button gap-2.5 min-h-[56px]',
  };

  const variantStyles = {
    primary: 'bg-terracotta hover:bg-terracotta-hover text-white shadow-level1 focus:ring-terracotta active:bg-terracotta-dark',
    secondary: 'border-2 border-sage text-sage hover:bg-sage-tint focus:ring-sage active:bg-sage-tint/80',
    outline: 'border border-slate-border bg-white text-slate-deep hover:bg-canvas-tint focus:ring-slate-deep/20',
    ghost: 'text-slate-muted hover:text-slate-deep hover:bg-canvas-tint focus:ring-slate-muted/20',
    danger: 'bg-status-error text-white hover:bg-red-600 focus:ring-status-error shadow-level1',
  };

  return (
    <button
      className={twMerge(
        clsx(
          baseStyles,
          sizeStyles[size],
          variantStyles[variant],
          fullWidth && 'w-full',
          className
        )
      )}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin text-current" />
          <span>{children}</span>
        </>
      ) : (
        <>
          {icon && iconPosition === 'left' && <span className="shrink-0">{icon}</span>}
          <span>{children}</span>
          {icon && iconPosition === 'right' && <span className="shrink-0">{icon}</span>}
        </>
      )}
    </button>
  );
};
