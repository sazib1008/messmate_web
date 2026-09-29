import React from 'react';
import { Utensils, Users, Plus, Minus } from 'lucide-react';
import { ToggleSwitch } from './ToggleSwitch';
import { Badge } from './Badge';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export interface MealToggleCardProps {
  sessionName: 'Breakfast' | 'Lunch' | 'Dinner';
  unitValue: number;
  timeRange: string;
  cutoffTime: string;
  isMealOn: boolean;
  onToggleMeal: (isOn: boolean) => void;
  guestCount: number;
  onGuestCountChange: (count: number) => void;
  notes?: string;
  onNotesChange?: (notes: string) => void;
  menuItemName?: string;
  dietaryTags?: string[];
  disabled?: boolean;
  className?: string;
}

export const MealToggleCard: React.FC<MealToggleCardProps> = ({
  sessionName,
  unitValue,
  timeRange,
  cutoffTime,
  isMealOn,
  onToggleMeal,
  guestCount,
  onGuestCountChange,
  notes,
  onNotesChange,
  menuItemName,
  dietaryTags = [],
  disabled = false,
  className,
}) => {
  return (
    <div
      className={twMerge(
        clsx(
          'bg-white rounded-card border transition-all duration-200 p-5 shadow-level1 overflow-hidden',
          isMealOn
            ? 'border-l-4 border-l-terracotta border-slate-border/80'
            : 'border-l-4 border-l-slate-200 border-slate-border/50 bg-slate-50/30',
          disabled && 'opacity-60 pointer-events-none',
          className
        )
      )}
    >
      {/* Session Title & Master Toggle */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className={clsx(
              'w-11 h-11 rounded-button flex items-center justify-center shrink-0 transition-colors',
              isMealOn
                ? 'bg-terracotta-container text-terracotta-dark'
                : 'bg-slate-100 text-slate-muted'
            )}
          >
            <Utensils className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="font-display font-bold text-base text-slate-deep">
                {sessionName}
              </h4>
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-canvas-tint text-slate-muted border border-slate-border/40">
                {unitValue.toFixed(1)} unit
              </span>
            </div>
            <p className="text-xs text-slate-muted mt-0.5 font-body">
              {timeRange} • Cutoff: {cutoffTime}
            </p>
          </div>
        </div>

        {/* Master ON/OFF Switch */}
        <div className="flex items-center gap-2">
          {disabled && (
            <span className="text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200/80 px-2 py-0.5 rounded-full">
              Cutoff Passed
            </span>
          )}
          <span
            className={clsx(
              'text-xs font-bold uppercase tracking-wider',
              isMealOn ? 'text-terracotta' : 'text-slate-muted'
            )}
          >
            {isMealOn ? 'ON' : 'OFF'}
          </span>
          <ToggleSwitch
            checked={isMealOn}
            onChange={onToggleMeal}
            disabled={disabled}
            size="md"
          />
        </div>
      </div>

      {/* Menu & Dietary tags if provided */}
      {menuItemName && (
        <div className="mt-4 p-3 bg-canvas-tint/70 rounded-input border border-slate-border/30 flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <span
              className={clsx(
                'text-xs font-body',
                menuItemName === 'No dish scheduled yet'
                  ? 'text-slate-muted italic'
                  : 'font-semibold text-slate-deep'
              )}
            >
              {menuItemName}
            </span>
          </div>
          {dietaryTags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-0.5">
              {dietaryTags.map((tag) => (
                <Badge key={tag} variant="dietary" size="sm">
                  {tag}
                </Badge>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Guest Meals Stepper */}
      <div className="mt-4 pt-3 border-t border-slate-border/50 flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-deep">
          <Users className="w-4 h-4 text-sage" />
          <span>Guest Meals (+{unitValue.toFixed(1)} rate each)</span>
        </div>

        <div className="inline-flex items-center gap-2 bg-canvas-tint px-2 py-1 rounded-full border border-slate-border/50">
          <button
            type="button"
            onClick={() => onGuestCountChange(Math.max(0, guestCount - 1))}
            disabled={disabled || guestCount <= 0}
            className="w-7 h-7 rounded-full bg-white text-slate-deep flex items-center justify-center hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed shadow-subtle tactile-btn"
          >
            <Minus className="w-3.5 h-3.5" />
          </button>
          <span className="font-display font-bold text-sm w-5 text-center text-slate-deep">
            {guestCount}
          </span>
          <button
            type="button"
            onClick={() => onGuestCountChange(guestCount + 1)}
            disabled={disabled}
            className="w-7 h-7 rounded-full bg-white text-slate-deep flex items-center justify-center hover:bg-slate-100 disabled:opacity-40 shadow-subtle tactile-btn"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Notes / Special Requests */}
      {onNotesChange && (
        <div className="mt-3">
          <input
            type="text"
            value={notes || ''}
            onChange={(e) => onNotesChange(e.target.value)}
            disabled={disabled}
            placeholder="Special instructions or guest dietary note..."
            className="w-full h-10 px-3 text-xs bg-canvas-tint rounded-input border border-transparent focus:bg-white focus:border-terracotta focus:outline-none placeholder:text-slate-light"
          />
        </div>
      )}
    </div>
  );
};
