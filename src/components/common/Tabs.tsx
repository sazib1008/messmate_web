import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export interface TabItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  count?: number;
}

export interface TabsProps {
  items: TabItem[];
  activeId: string;
  onChange: (id: string) => void;
  variant?: 'pill' | 'line';
  className?: string;
}

export const Tabs: React.FC<TabsProps> = ({
  items,
  activeId,
  onChange,
  variant = 'pill',
  className,
}) => {
  if (variant === 'line') {
    return (
      <div className={twMerge('flex border-b border-slate-border gap-6', className)}>
        {items.map((tab) => {
          const isActive = tab.id === activeId;
          return (
            <button
              key={tab.id}
              onClick={() => onChange(tab.id)}
              className={clsx(
                'pb-3 pt-1 text-sm font-semibold flex items-center gap-2 border-b-2 transition-all',
                isActive
                  ? 'border-terracotta text-terracotta'
                  : 'border-transparent text-slate-muted hover:text-slate-deep'
              )}
            >
              {tab.icon && <span>{tab.icon}</span>}
              <span>{tab.label}</span>
              {tab.count !== undefined && (
                <span
                  className={clsx(
                    'text-[10px] px-1.5 py-0.5 rounded-full font-bold',
                    isActive ? 'bg-terracotta/10 text-terracotta' : 'bg-slate-100 text-slate-muted'
                  )}
                >
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>
    );
  }

  // Pill variant
  return (
    <div
      className={twMerge(
        'inline-flex p-1.5 bg-canvas-tint rounded-button gap-1 border border-slate-border/40',
        className
      )}
    >
      {items.map((tab) => {
        const isActive = tab.id === activeId;
        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={clsx(
              'h-10 px-4 rounded-input text-xs font-semibold flex items-center gap-2 transition-all duration-150 tactile-btn',
              isActive
                ? 'bg-white text-slate-deep shadow-subtle'
                : 'text-slate-muted hover:text-slate-deep hover:bg-white/50'
            )}
          >
            {tab.icon && <span>{tab.icon}</span>}
            <span>{tab.label}</span>
            {tab.count !== undefined && (
              <span
                className={clsx(
                  'text-[10px] px-1.5 py-0.2 rounded-full font-bold',
                  isActive ? 'bg-terracotta text-white' : 'bg-slate-200 text-slate-muted'
                )}
              >
                {tab.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};
