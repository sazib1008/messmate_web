import React, { forwardRef } from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, leftIcon, rightIcon, className, id, ...props }, ref) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-xs font-semibold text-slate-deep font-body mb-1.5"
          >
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          {leftIcon && (
            <div className="absolute left-3.5 text-slate-muted pointer-events-none flex items-center">
              {leftIcon}
            </div>
          )}
          <input
            id={inputId}
            ref={ref}
            className={twMerge(
              clsx(
                'w-full h-12 px-4 rounded-input bg-canvas-tint text-slate-deep text-sm font-body',
                'border border-transparent transition-all duration-150',
                'placeholder:text-slate-light',
                'focus:bg-white focus:border-terracotta focus:ring-2 focus:ring-terracotta/20 focus:outline-none',
                'disabled:opacity-50 disabled:cursor-not-allowed',
                leftIcon && 'pl-10',
                rightIcon && 'pr-10',
                error && 'border-status-error focus:border-status-error focus:ring-status-error/20 bg-red-50/40',
                className
              )
            )}
            {...props}
          />
          {rightIcon && (
            <div className="absolute right-3.5 text-slate-muted pointer-events-none flex items-center">
              {rightIcon}
            </div>
          )}
        </div>
        {error && <p className="text-xs text-status-error mt-1.5 font-medium">{error}</p>}
        {!error && helperText && (
          <p className="text-xs text-slate-muted mt-1.5">{helperText}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
