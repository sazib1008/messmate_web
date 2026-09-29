import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export interface StatCardProps {
  label: string;
  value: string | number;
  subtitle?: string;
  icon?: React.ReactNode;
  iconBg?: 'terracotta' | 'sage' | 'coral' | 'neutral';
  trend?: {
    value: string;
    isPositive?: boolean;
  };
  capacityPercentage?: number; // 0 - 100 for dining rush gauge
  capacityLabel?: string;
  className?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  subtitle,
  icon,
  iconBg = 'neutral',
  trend,
  capacityPercentage,
  capacityLabel = 'Cycle Progress',
  className,
}) => {
  const iconBgStyles = {
    terracotta: 'bg-terracotta-container text-terracotta-dark',
    sage: 'bg-sage-container text-sage-dark',
    coral: 'bg-orange-100 text-coral-dark',
    neutral: 'bg-canvas-tint text-slate-deep',
  };

  const getCapacityColor = (pct: number) => {
    if (pct < 50) return 'text-status-success bg-status-success/10 border-status-success/30';
    if (pct <= 85) return 'text-status-warning bg-status-warning/10 border-status-warning/30';
    return 'text-status-error bg-status-error/10 border-status-error/30';
  };

  return (
    <div
      className={twMerge(
        'bg-white rounded-card border border-slate-border shadow-level1 p-5 transition-all duration-200 hover:shadow-level2',
        className
      )}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold text-slate-muted font-body uppercase tracking-wider">
            {label}
          </p>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="font-display font-extrabold text-2xl sm:text-3xl text-slate-deep tracking-tight">
              {value}
            </span>
            {trend && (
              <span
                className={clsx(
                  'text-xs font-semibold px-1.5 py-0.5 rounded-full',
                  trend.isPositive
                    ? 'text-status-success bg-green-50'
                    : 'text-status-error bg-red-50'
                )}
              >
                {trend.value}
              </span>
            )}
          </div>
          {subtitle && (
            <p className="text-xs text-slate-muted mt-1 font-body">{subtitle}</p>
          )}
        </div>

        {icon && (
          <div className={clsx('w-12 h-12 rounded-button flex items-center justify-center shrink-0', iconBgStyles[iconBg])}>
            {icon}
          </div>
        )}
      </div>

      {capacityPercentage !== undefined && (
        <div className="mt-4 pt-3 border-t border-slate-border/50">
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="text-slate-muted font-medium">{capacityLabel}</span>
            <span
              className={clsx(
                'px-2 py-0.5 rounded-full text-[11px] font-bold border',
                getCapacityColor(capacityPercentage)
              )}
            >
              {Number.isInteger(capacityPercentage)
                ? capacityPercentage
                : Number(capacityPercentage.toFixed(1))}% Capacity
            </span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
            <div
              className={clsx(
                'h-full rounded-full transition-all duration-300',
                capacityPercentage < 50
                  ? 'bg-status-success'
                  : capacityPercentage <= 85
                  ? 'bg-status-warning'
                  : 'bg-status-error'
              )}
              style={{ width: `${Math.min(capacityPercentage, 100)}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
};
