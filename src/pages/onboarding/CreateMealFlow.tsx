import React, { useState } from 'react';
import {
  ArrowLeft, Utensils, Hash, MapPin, Clock, Calculator,
  ChevronRight, CheckCircle2, Copy, Check, Sunrise, Sun, Moon
} from 'lucide-react';
import { api } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import type { MealDto } from '../../types';

interface Props {
  onBack: () => void;
  onCreated: () => void;
}

type Step = 'info' | 'sessions' | 'success';

const DEFAULT_STATE = {
  // Step 1
  name: '',
  address: '',
  // Step 2
  breakfastEnabled: false,
  lunchEnabled: true,
  dinnerEnabled: true,
  breakfastMultiplier: 0.5,
  lunchMultiplier: 1.0,
  dinnerMultiplier: 1.0,
  breakfastCutoff: '07:00',
  lunchCutoff: '11:30',
  dinnerCutoff: '20:00',
  breakfastServingStartTime: '07:30',
  breakfastServingEndTime: '09:30',
  lunchServingStartTime: '13:00',
  lunchServingEndTime: '14:30',
  dinnerServingStartTime: '20:30',
  dinnerServingEndTime: '22:00',
  combinedSessionRule: 'INDEPENDENT',
  defaultCarryForward: true,
  currency: 'BDT',
  targetActiveDays: 30,
};

export const CreateMealFlow: React.FC<Props> = ({ onBack, onCreated }) => {
  const { refreshUser } = useAuth();
  const [step, setStep] = useState<Step>('info');
  const [form, setForm] = useState(DEFAULT_STATE);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdMeal, setCreatedMeal] = useState<MealDto | null>(null);
  const [codeCopied, setCodeCopied] = useState(false);

  const update = (field: keyof typeof DEFAULT_STATE, value: any) =>
    setForm(f => ({ ...f, [field]: value }));

  const activeCount = [form.breakfastEnabled, form.lunchEnabled, form.dinnerEnabled].filter(Boolean).length;

  const format12h = (t: string) => {
    if (!t) return '--:--';
    const [h, m] = t.split(':').map(Number);
    if (isNaN(h)) return t;
    const period = h >= 12 ? 'PM' : 'AM';
    const hour = h % 12 || 12;
    return `${hour}:${String(m || 0).padStart(2, '0')} ${period}`;
  };

  const handleStep1Next = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) { setError('Meal group name is required.'); return; }
    setError(null);
    setStep('sessions');
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.lunchEnabled && !form.dinnerEnabled && !form.breakfastEnabled) {
      setError('At least one meal session must be enabled.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const meal = await api.post<MealDto>('/meals', {
        name: form.name.trim(),
        address: form.address.trim() || null,
        breakfastEnabled: form.breakfastEnabled,
        lunchEnabled: form.lunchEnabled,
        dinnerEnabled: form.dinnerEnabled,
        breakfastMultiplier: form.breakfastMultiplier,
        lunchMultiplier: form.lunchMultiplier,
        dinnerMultiplier: form.dinnerMultiplier,
        breakfastCutoff: form.breakfastCutoff,
        lunchCutoff: form.lunchCutoff,
        dinnerCutoff: form.dinnerCutoff,
        breakfastServingStartTime: form.breakfastServingStartTime,
        breakfastServingEndTime: form.breakfastServingEndTime,
        lunchServingStartTime: form.lunchServingStartTime,
        lunchServingEndTime: form.lunchServingEndTime,
        dinnerServingStartTime: form.dinnerServingStartTime,
        dinnerServingEndTime: form.dinnerServingEndTime,
        combinedSessionRule: form.combinedSessionRule,
        defaultCarryForward: form.defaultCarryForward,
        currency: form.currency,
        targetActiveDays: form.targetActiveDays,
      });
      setCreatedMeal(meal);
      setStep('success');
      await refreshUser();
    } catch (err: any) {
      setError(err?.message || 'Failed to create meal group. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const copyCode = () => {
    if (createdMeal?.code) {
      navigator.clipboard.writeText(createdMeal.code);
      setCodeCopied(true);
      setTimeout(() => setCodeCopied(false), 2000);
    }
  };

  const SessionToggle: React.FC<{
    icon: React.ReactNode;
    label: string;
    description: string;
    enabled: boolean;
    onToggle: () => void;
    multiplier: number;
    onMultiplierChange: (v: number) => void;
    cutoff: string;
    onCutoffChange: (v: string) => void;
    servingStartTime: string;
    onServingStartTimeChange: (v: string) => void;
    servingEndTime: string;
    onServingEndTimeChange: (v: string) => void;
    colorClass: string;
    activeBorderClass: string;
    activeBgClass: string;
  }> = ({
    icon,
    label,
    description,
    enabled,
    onToggle,
    multiplier,
    onMultiplierChange,
    cutoff,
    onCutoffChange,
    servingStartTime,
    onServingStartTimeChange,
    servingEndTime,
    onServingEndTimeChange,
    colorClass,
    activeBorderClass,
    activeBgClass,
  }) => (
    <div
      className={`border rounded-2xl p-4 sm:p-5 transition-all duration-200 ${
        enabled
          ? `${activeBorderClass} ${activeBgClass} shadow-subtle`
          : 'border-slate-border bg-slate-50/60 opacity-80 hover:opacity-100'
      }`}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-subtle ${colorClass}`}>
            {icon}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-display font-bold text-base text-slate-deep">{label}</span>
              <span
                className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full ${
                  enabled
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-slate-200 text-slate-600'
                }`}
              >
                {enabled ? 'Active Session' : 'Disabled'}
              </span>
            </div>
            <p className="text-xs text-slate-muted">{description}</p>
          </div>
        </div>

        {/* Toggle Switch */}
        <button
          type="button"
          onClick={onToggle}
          role="switch"
          aria-checked={enabled}
          aria-label={`Toggle ${label} meal session`}
          className={`relative inline-flex h-7 w-12 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-terracotta/50 ${
            enabled ? 'bg-terracotta' : 'bg-slate-300'
          }`}
        >
          <span
            className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
              enabled ? 'translate-x-5' : 'translate-x-0'
            }`}
          />
        </button>
      </div>

      {enabled ? (
        <div className="mt-4 pt-3.5 border-t border-slate-border/70 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Multiplier */}
            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-muted mb-1 block">
                Multiplier (Weight)
              </label>
              <input
                type="number"
                step="0.1"
                min="0.1"
                max="3"
                value={multiplier}
                onChange={(e) => onMultiplierChange(parseFloat(e.target.value) || 1)}
                className="w-full h-9 px-3 rounded-input border border-slate-border bg-white text-sm font-semibold text-slate-deep focus:outline-none focus:ring-2 focus:ring-terracotta/40"
              />
              <span className="text-[10px] text-slate-muted mt-0.5 block">e.g. 0.5 = 1/2 meal</span>
            </div>

            {/* Booking Cutoff */}
            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-muted mb-1 block flex items-center gap-1">
                <Clock className="w-3 h-3 text-terracotta" /> Cutoff Time
              </label>
              <input
                type="time"
                value={cutoff}
                onChange={(e) => onCutoffChange(e.target.value)}
                className="w-full h-9 px-3 rounded-input border border-slate-border bg-white text-sm font-semibold text-slate-deep focus:outline-none focus:ring-2 focus:ring-terracotta/40"
              />
              <span className="text-[10px] text-slate-muted mt-0.5 block">Booking deadline</span>
            </div>

            {/* Serving Start */}
            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-muted mb-1 block">
                Serving Start
              </label>
              <input
                type="time"
                value={servingStartTime}
                onChange={(e) => onServingStartTimeChange(e.target.value)}
                className="w-full h-9 px-3 rounded-input border border-slate-border bg-white text-sm font-semibold text-slate-deep focus:outline-none focus:ring-2 focus:ring-terracotta/40"
              />
              <span className="text-[10px] text-slate-muted mt-0.5 block">Service opens</span>
            </div>

            {/* Serving End */}
            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-muted mb-1 block">
                Serving End
              </label>
              <input
                type="time"
                value={servingEndTime}
                onChange={(e) => onServingEndTimeChange(e.target.value)}
                className="w-full h-9 px-3 rounded-input border border-slate-border bg-white text-sm font-semibold text-slate-deep focus:outline-none focus:ring-2 focus:ring-terracotta/40"
              />
              <span className="text-[10px] text-slate-muted mt-0.5 block">Service closes</span>
            </div>
          </div>

          {/* Real-time Summary Badge */}
          <div className="flex items-center gap-2 bg-white/90 border border-slate-border/80 px-3.5 py-1.5 rounded-xl text-xs text-slate-deep flex-wrap">
            <span className="font-bold text-terracotta">Schedule:</span>
            <span>Serving {format12h(servingStartTime)} – {format12h(servingEndTime)}</span>
            <span className="text-slate-300">•</span>
            <span className="text-slate-muted">Cutoff: {format12h(cutoff)}</span>
            <span className="text-slate-300">•</span>
            <span className="text-slate-muted">Weight: {multiplier}x</span>
          </div>
        </div>
      ) : (
        <div className="mt-3 bg-slate-100/80 border border-slate-200/80 rounded-xl px-3.5 py-2 text-xs text-slate-500 flex items-center justify-between flex-wrap gap-2">
          <span>Disabled • Hidden from Menu Planner, Student Bookings, and Kitchen Terminal.</span>
          <button
            type="button"
            onClick={onToggle}
            className="text-xs font-bold text-terracotta hover:underline whitespace-nowrap"
          >
            Enable Session
          </button>
        </div>
      )}
    </div>
  );

  // ─── Success Screen ───
  if (step === 'success' && createdMeal) {
    return (
      <div className="min-h-screen bg-canvas flex items-center justify-center p-6 font-body">
        <div className="w-full max-w-sm text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-[22px] bg-green-100 text-green-600 mb-5 shadow-level1">
            <CheckCircle2 className="w-10 h-10" />
          </div>
          <h1 className="font-display font-extrabold text-2xl text-slate-deep">Meal Group Created!</h1>
          <p className="text-sm text-slate-muted mt-2 mb-6">
            Share this code with your roommates so they can join <strong>{createdMeal.name}</strong>.
          </p>

          {/* Code Card */}
          <div className="bg-white rounded-card shadow-level2 border border-slate-border p-6 mb-6">
            <p className="text-xs font-semibold text-slate-muted uppercase tracking-wider mb-3">Your Meal Code</p>
            <div className="flex items-center justify-between bg-slate-50 border border-slate-border rounded-xl px-4 py-3">
              <span className="font-display font-extrabold text-3xl text-terracotta tracking-widest">
                {createdMeal.code}
              </span>
              <button
                onClick={copyCode}
                className="flex items-center gap-1.5 text-xs font-semibold text-terracotta bg-terracotta-container hover:bg-terracotta hover:text-white px-3 py-1.5 rounded-button transition-all"
              >
                {codeCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                {codeCopied ? 'Copied!' : 'Copy'}
              </button>
            </div>
            <div className="mt-3 grid grid-cols-3 gap-2 text-center">
              <div className="bg-slate-50 rounded-lg p-2">
                <p className="text-xs text-slate-muted">Cycle</p>
                <p className="text-sm font-bold text-slate-deep">#{createdMeal.currentCycleNumber}</p>
              </div>
              <div className="bg-slate-50 rounded-lg p-2">
                <p className="text-xs text-slate-muted">Status</p>
                <p className="text-sm font-bold text-green-600">Active</p>
              </div>
              <div className="bg-slate-50 rounded-lg p-2">
                <p className="text-xs text-slate-muted">Members</p>
                <p className="text-sm font-bold text-slate-deep">{createdMeal.memberCount}</p>
              </div>
            </div>
          </div>

          <button
            onClick={onCreated}
            className="w-full h-12 bg-terracotta hover:bg-terracotta-hover text-white rounded-button font-bold text-sm shadow-level1 transition-all active:scale-98"
          >
            Go to My Dashboard →
          </button>
        </div>
      </div>
    );
  }

  // ─── Step 1: Basic Info ───
  if (step === 'info') {
    return (
      <div className="min-h-screen bg-canvas flex items-center justify-center p-6 font-body">
        <div className="w-full max-w-md">
          <div className="flex items-center gap-3 mb-8">
            <button onClick={onBack} className="p-2 rounded-xl hover:bg-slate-100 transition-colors">
              <ArrowLeft className="w-5 h-5 text-slate-muted" />
            </button>
            <div>
              <p className="text-xs text-slate-muted font-medium">Step 1 of 2</p>
              <h1 className="font-display font-extrabold text-xl text-slate-deep">Create a Meal Group</h1>
            </div>
          </div>

          <div className="bg-white rounded-card shadow-level2 border border-slate-border p-6">
            <form onSubmit={handleStep1Next} className="space-y-4">
              {/* Icon */}
              <div className="flex justify-center mb-4">
                <div className="w-14 h-14 rounded-2xl bg-terracotta-container flex items-center justify-center">
                  <Utensils className="w-7 h-7 text-terracotta" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-muted uppercase tracking-wide mb-1.5">
                  Meal Group Name <span className="text-terracotta">*</span>
                </label>
                <input
                  type="text"
                  id="create-meal-name"
                  value={form.name}
                  onChange={e => update('name', e.target.value)}
                  placeholder="e.g. Block B Mess, Tech Hall Meal"
                  required
                  maxLength={60}
                  className="w-full h-11 px-4 rounded-input border border-slate-border bg-slate-50 text-sm text-slate-deep placeholder-slate-muted focus:outline-none focus:ring-2 focus:ring-terracotta/40 focus:border-terracotta/60 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-muted uppercase tracking-wide mb-1.5">
                  <MapPin className="w-3 h-3 inline mr-1" />Address / Location (optional)
                </label>
                <input
                  type="text"
                  id="create-meal-address"
                  value={form.address}
                  onChange={e => update('address', e.target.value)}
                  placeholder="e.g. 123 University Road, Mirpur"
                  className="w-full h-11 px-4 rounded-input border border-slate-border bg-slate-50 text-sm text-slate-deep placeholder-slate-muted focus:outline-none focus:ring-2 focus:ring-terracotta/40 focus:border-terracotta/60 transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-muted uppercase tracking-wide mb-1.5">
                    <Calculator className="w-3 h-3 inline mr-1" />Target Cycle Days
                  </label>
                  <input
                    type="number"
                    min={7}
                    max={60}
                    value={form.targetActiveDays}
                    onChange={e => update('targetActiveDays', parseInt(e.target.value) || 30)}
                    className="w-full h-11 px-4 rounded-input border border-slate-border bg-slate-50 text-sm text-slate-deep focus:outline-none focus:ring-2 focus:ring-terracotta/40 focus:border-terracotta/60 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-muted uppercase tracking-wide mb-1.5">
                    <Hash className="w-3 h-3 inline mr-1" />Currency
                  </label>
                  <select
                    value={form.currency}
                    onChange={e => update('currency', e.target.value)}
                    className="w-full h-11 px-4 rounded-input border border-slate-border bg-slate-50 text-sm text-slate-deep focus:outline-none focus:ring-2 focus:ring-terracotta/40 transition-all"
                  >
                    <option value="BDT">BDT (৳)</option>
                    <option value="USD">USD ($)</option>
                    <option value="EUR">EUR (€)</option>
                  </select>
                </div>
              </div>

              {/* Carry Forward Toggle */}
              <label className="flex items-center gap-3 cursor-pointer p-3 rounded-xl border border-slate-border hover:bg-slate-50 transition-colors">
                <input
                  type="checkbox"
                  checked={form.defaultCarryForward}
                  onChange={e => update('defaultCarryForward', e.target.checked)}
                  className="w-4 h-4 accent-terracotta rounded"
                />
                <div>
                  <p className="text-sm font-semibold text-slate-deep">Enable balance carry forward</p>
                  <p className="text-xs text-slate-muted">Member net balances roll over to the next cycle</p>
                </div>
              </label>

              {error && (
                <div className="text-xs text-status-error bg-red-50 border border-red-200 rounded-input px-3 py-2">
                  {error}
                </div>
              )}

              <button
                type="submit"
                id="create-meal-step1-next"
                className="w-full h-12 bg-terracotta hover:bg-terracotta-hover text-white rounded-button text-sm font-bold shadow-level1 flex items-center justify-center gap-2 transition-all active:scale-98 mt-2"
              >
                Next: Configure Sessions
                <ChevronRight className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  // ─── Step 2: Sessions ───
  return (
    <div className="min-h-screen bg-canvas flex items-center justify-center p-4 sm:p-6 font-body">
      <div className="w-full max-w-2xl">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => { setStep('info'); setError(null); }} className="p-2 rounded-xl hover:bg-slate-100 transition-colors">
            <ArrowLeft className="w-5 h-5 text-slate-muted" />
          </button>
          <div>
            <p className="text-xs text-slate-muted font-medium">Step 2 of 2 — {form.name}</p>
            <h1 className="font-display font-extrabold text-xl sm:text-2xl text-slate-deep">Configure Active Dining Sessions</h1>
          </div>
        </div>

        <div className="bg-white rounded-card shadow-level2 border border-slate-border p-5 sm:p-7">
          <form onSubmit={handleCreate} className="space-y-4">
            <p className="text-xs sm:text-sm text-slate-muted">
              Choose which dining sessions your mess will track. Disabled sessions are automatically excluded from the menu planner, student bookings, and kitchen terminals.
            </p>

            {/* Presets and Status Pill */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-canvas-tint p-3 sm:p-3.5 rounded-xl border border-slate-border">
              <div className="text-xs">
                <span className="font-bold text-slate-deep">Active Sessions: </span>
                <span className="font-bold text-terracotta">{activeCount} of 3 enabled</span>
                <span className="text-slate-muted ml-1 hidden sm:inline">
                  ({[
                    form.breakfastEnabled ? 'Breakfast' : null,
                    form.lunchEnabled ? 'Lunch' : null,
                    form.dinnerEnabled ? 'Dinner' : null,
                  ].filter(Boolean).join(', ') || 'None'})
                </span>
              </div>
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[11px] text-slate-muted font-medium mr-1">Presets:</span>
                <button
                  type="button"
                  onClick={() => setForm(f => ({ ...f, breakfastEnabled: false, lunchEnabled: true, dinnerEnabled: true }))}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all ${
                    !form.breakfastEnabled && form.lunchEnabled && form.dinnerEnabled
                      ? 'bg-terracotta text-white border-terracotta shadow-subtle'
                      : 'bg-white text-slate-deep border-slate-border hover:bg-slate-50'
                  }`}
                >
                  Lunch & Dinner
                </button>
                <button
                  type="button"
                  onClick={() => setForm(f => ({ ...f, breakfastEnabled: true, lunchEnabled: true, dinnerEnabled: true }))}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all ${
                    form.breakfastEnabled && form.lunchEnabled && form.dinnerEnabled
                      ? 'bg-terracotta text-white border-terracotta shadow-subtle'
                      : 'bg-white text-slate-deep border-slate-border hover:bg-slate-50'
                  }`}
                >
                  All 3 Sessions
                </button>
                <button
                  type="button"
                  onClick={() => setForm(f => ({ ...f, breakfastEnabled: false, lunchEnabled: false, dinnerEnabled: true }))}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all ${
                    !form.breakfastEnabled && !form.lunchEnabled && form.dinnerEnabled
                      ? 'bg-terracotta text-white border-terracotta shadow-subtle'
                      : 'bg-white text-slate-deep border-slate-border hover:bg-slate-50'
                  }`}
                >
                  Dinner Only
                </button>
              </div>
            </div>

            {/* Session Toggles */}
            <div className="space-y-3.5">
              <SessionToggle
                icon={<Sunrise className="w-5 h-5 text-amber-600" />}
                label="Breakfast"
                description="Morning meal & light breakfast options"
                enabled={form.breakfastEnabled}
                onToggle={() => update('breakfastEnabled', !form.breakfastEnabled)}
                multiplier={form.breakfastMultiplier}
                onMultiplierChange={v => update('breakfastMultiplier', v)}
                cutoff={form.breakfastCutoff}
                onCutoffChange={v => update('breakfastCutoff', v)}
                servingStartTime={form.breakfastServingStartTime}
                onServingStartTimeChange={v => update('breakfastServingStartTime', v)}
                servingEndTime={form.breakfastServingEndTime}
                onServingEndTimeChange={v => update('breakfastServingEndTime', v)}
                colorClass="bg-amber-100 text-amber-600 border border-amber-200"
                activeBorderClass="border-amber-400/60"
                activeBgClass="bg-amber-50/20"
              />

              <SessionToggle
                icon={<Sun className="w-5 h-5 text-orange-600" />}
                label="Lunch"
                description="Midday main campus meal"
                enabled={form.lunchEnabled}
                onToggle={() => update('lunchEnabled', !form.lunchEnabled)}
                multiplier={form.lunchMultiplier}
                onMultiplierChange={v => update('lunchMultiplier', v)}
                cutoff={form.lunchCutoff}
                onCutoffChange={v => update('lunchCutoff', v)}
                servingStartTime={form.lunchServingStartTime}
                onServingStartTimeChange={v => update('lunchServingStartTime', v)}
                servingEndTime={form.lunchServingEndTime}
                onServingEndTimeChange={v => update('lunchServingEndTime', v)}
                colorClass="bg-orange-100 text-orange-600 border border-orange-200"
                activeBorderClass="border-orange-400/60"
                activeBgClass="bg-orange-50/20"
              />

              <SessionToggle
                icon={<Moon className="w-5 h-5 text-indigo-600" />}
                label="Dinner"
                description="Evening night meal service"
                enabled={form.dinnerEnabled}
                onToggle={() => update('dinnerEnabled', !form.dinnerEnabled)}
                multiplier={form.dinnerMultiplier}
                onMultiplierChange={v => update('dinnerMultiplier', v)}
                cutoff={form.dinnerCutoff}
                onCutoffChange={v => update('dinnerCutoff', v)}
                servingStartTime={form.dinnerServingStartTime}
                onServingStartTimeChange={v => update('dinnerServingStartTime', v)}
                servingEndTime={form.dinnerServingEndTime}
                onServingEndTimeChange={v => update('dinnerServingEndTime', v)}
                colorClass="bg-indigo-100 text-indigo-600 border border-indigo-200"
                activeBorderClass="border-indigo-400/60"
                activeBgClass="bg-indigo-50/20"
              />
            </div>

            {error && (
              <div className="text-xs text-status-error bg-red-50 border border-red-200 rounded-input px-3.5 py-2.5">
                {error}
              </div>
            )}

            <button
              type="submit"
              id="create-meal-submit-btn"
              disabled={loading || activeCount === 0}
              className="w-full h-12 bg-terracotta hover:bg-terracotta-hover text-white rounded-button text-sm font-bold shadow-level1 flex items-center justify-center gap-2 transition-all disabled:opacity-50 active:scale-98 mt-2"
            >
              {loading ? (
                <span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  Create Meal Group ({activeCount} active session{activeCount !== 1 ? 's' : ''})
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
