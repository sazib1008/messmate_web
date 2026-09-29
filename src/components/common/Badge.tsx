import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?:
    | 'student'
    | 'chef'
    | 'manager'
    | 'success'
    | 'warning'
    | 'error'
    | 'info'
    | 'neutral'
    | 'dietary';
  size?: 'sm' | 'md';
  icon?: React.ReactNode;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'neutral',
  size = 'md',
  icon,
  className,
  ...props
}) => {
  const variantStyles = {
    // Role Badges from Stitch
    student: 'bg-[#E6F4F1] text-[#2A9D8F] border border-[#2A9D8F]/20',
    chef: 'bg-[#FEF3C7] text-[#B45309] border border-[#B45309]/20',
    manager: 'bg-[#F1F5F9] text-[#1E293B] border border-[#1E293B]/20',

    // Status Badges
    success: 'bg-[#ECFDF5] text-[#047857] border border-[#10B981]/20',
    warning: 'bg-[#FFFBEB] text-[#B45309] border border-[#F59E0B]/20',
    error: 'bg-[#FEF2F2] text-[#B91C1C] border border-[#EF4444]/20',
    info: 'bg-[#EFF6FF] text-[#1D4ED8] border border-[#3B82F6]/20',
    neutral: 'bg-[#F4F0E8] text-[#475569] border border-slate-border',
    dietary: 'bg-[#F4F0E8] text-[#2A9D8F] font-semibold border border-[#2A9D8F]/30',
  };

  const sizeStyles = {
    sm: 'h-5 px-2 text-[11px] font-semibold gap-1',
    md: 'h-7 px-3 text-xs font-semibold gap-1.5',
  };

  return (
    <span
      className={twMerge(
        clsx(
          'inline-flex items-center justify-center rounded-full font-body tracking-tight shrink-0 transition-colors',
          sizeStyles[size],
          variantStyles[variant],
          className
        )
      )}
      {...props}
    >
      {icon && <span className="shrink-0">{icon}</span>}
      <span>{children}</span>
    </span>
  );
};
