import React from 'react';
import { UtensilsCrossed } from 'lucide-react';
import { Button } from './Button';

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon = <UtensilsCrossed className="w-10 h-10 text-terracotta" />,
  title,
  description,
  actionLabel,
  onAction,
  className = '',
}) => {
  return (
    <div
      className={`flex flex-col items-center justify-center p-8 text-center bg-white rounded-card border border-slate-border shadow-level1 ${className}`}
    >
      <div className="w-16 h-16 rounded-full bg-terracotta-container/60 flex items-center justify-center mb-4">
        {icon}
      </div>
      <h4 className="font-display font-bold text-lg text-slate-deep mb-1">{title}</h4>
      <p className="text-xs text-slate-muted max-w-sm mb-6 leading-relaxed">
        {description}
      </p>
      {actionLabel && onAction && (
        <Button onClick={onAction} size="md" variant="primary">
          {actionLabel}
        </Button>
      )}
    </div>
  );
};
