import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export interface ToggleSwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  sublabel?: string;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const ToggleSwitch: React.FC<ToggleSwitchProps> = ({
  checked,
  onChange,
  label,
  sublabel,
  disabled = false,
  size = 'md',
  className,
}) => {
  const switchSizes = {
    sm: 'w-9 h-5',
    md: 'w-12 h-7',
    lg: 'w-14 h-8',
  };

  const knobSizes = {
    sm: 'w-3.5 h-3.5 translate-x-0.5',
    md: 'w-5 h-5 translate-x-1',
    lg: 'w-6 h-6 translate-x-1',
  };

  const knobTranslateChecked = {
    sm: 'translate-x-4',
    md: 'translate-x-6',
    lg: 'translate-x-7',
  };

  return (
    <label
      className={twMerge(
        clsx(
          'inline-flex items-center gap-3 select-none cursor-pointer',
          disabled && 'opacity-50 cursor-not-allowed pointer-events-none',
          className
        )
      )}
    >
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => !disabled && onChange(!checked)}
        className={clsx(
          'relative inline-flex shrink-0 items-center rounded-full transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-terracotta/30',
          switchSizes[size],
          checked ? 'bg-terracotta' : 'bg-slate-200'
        )}
      >
        <span
          className={clsx(
            'pointer-events-none inline-block rounded-full bg-white shadow-sm transform transition duration-200 ease-in-out',
            knobSizes[size],
            checked ? knobTranslateChecked[size] : ''
          )}
        />
      </button>
      {(label || sublabel) && (
        <div className="flex flex-col">
          {label && <span className="text-sm font-semibold text-slate-deep">{label}</span>}
          {sublabel && <span className="text-xs text-slate-muted">{sublabel}</span>}
        </div>
      )}
    </label>
  );
};
