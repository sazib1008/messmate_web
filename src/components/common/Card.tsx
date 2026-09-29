import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  activeAccent?: 'terracotta' | 'sage' | 'coral' | 'none';
  interactive?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  activeAccent = 'none',
  interactive = false,
  className,
  ...props
}) => {
  const accentStyles = {
    none: '',
    terracotta: 'border-l-4 border-l-terracotta',
    sage: 'border-l-4 border-l-sage',
    coral: 'border-l-4 border-l-coral',
  };

  return (
    <div
      className={twMerge(
        clsx(
          'bg-white rounded-card border border-slate-border shadow-level1 overflow-hidden transition-all duration-200',
          accentStyles[activeAccent],
          interactive && 'hover:shadow-level2 hover:border-slate-border/80 cursor-pointer',
          className
        )
      )}
      {...props}
    >
      {children}
    </div>
  );
};

export const CardHeader: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  children,
  className,
  ...props
}) => (
  <div className={twMerge('px-6 py-5 border-b border-slate-border/60', className)} {...props}>
    {children}
  </div>
);

export const CardTitle: React.FC<React.HTMLAttributes<HTMLHeadingElement>> = ({
  children,
  className,
  ...props
}) => (
  <h3
    className={twMerge('font-display font-bold text-lg text-slate-deep tracking-tight', className)}
    {...props}
  >
    {children}
  </h3>
);

export const CardDescription: React.FC<React.HTMLAttributes<HTMLParagraphElement>> = ({
  children,
  className,
  ...props
}) => (
  <p className={twMerge('text-xs text-slate-muted font-body mt-1', className)} {...props}>
    {children}
  </p>
);

export const CardContent: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  children,
  className,
  ...props
}) => (
  <div className={twMerge('p-6', className)} {...props}>
    {children}
  </div>
);

export const CardFooter: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  children,
  className,
  ...props
}) => (
  <div
    className={twMerge('px-6 py-4 bg-canvas-tint/40 border-t border-slate-border/40 flex items-center justify-between', className)}
    {...props}
  >
    {children}
  </div>
);
