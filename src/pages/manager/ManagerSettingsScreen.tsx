import React, { useState, useEffect } from 'react';
import {
  SlidersHorizontal,
  FileDown,
  Lock,
  PauseCircle,
  RefreshCw,
  Save,
  Clock,
  Sunrise,
  Sun,
  Moon,
  AlertTriangle,
} from 'lucide-react';
import { formatServingWindow } from '../../utils/timeFormat';
import { getTodayDhaka } from '../../utils/dhakaDate';
import { clsx } from 'clsx';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../api/client';
import type {
  DiningConfigDto,
  ActiveCycleDto,
  CalculationPreviewDto,
  MealSession,
} from '../../types';
import {
  Card,
  Button,
  Badge,
  Input,
  Select,
  ToggleSwitch,
  Modal,
  Alert,
} from '../../components/common';

export const ManagerSettingsScreen: React.FC = () => {
  const { activeMembership, token } = useAuth();
  const [config, setConfig] = useState<DiningConfigDto | null>(null);
  const [activeCycle, setActiveCycle] = useState<ActiveCycleDto | null>(null);
  const [calculation, setCalculation] = useState<CalculationPreviewDto | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Editable config state
  const [carryForward, setCarryForward] = useState(true);
  const [sessionsConfig, setSessionsConfig] = useState<
    Array<{
      session: MealSession;
      unitValue: string;
      cutoffTime: string;
      isEnabled: boolean;
      servingStartTime: string;
      servingEndTime: string;
    }>
  >([]);
  const [isSavingConfig, setIsSavingConfig] = useState(false);

  // Pause a day modal state
  const [isPauseModalOpen, setIsPauseModalOpen] = useState(false);
  const [pauseDate, setPauseDate] = useState(getTodayDhaka());
  const [pauseReason, setPauseReason] = useState('');
  const [pauseSession, setPauseSession] = useState<string>('FULL_DAY');
  const [isPausing, setIsPausing] = useState(false);

  // Export state
  const [exportStartDate, setExportStartDate] = useState(getTodayDhaka());
  const [exportEndDate, setExportEndDate] = useState(getTodayDhaka());
  const [isExporting, setIsExporting] = useState(false);

  // Finalize Cycle Modal state
  const [isFinalizeModalOpen, setIsFinalizeModalOpen] = useState(false);
  const [isFinalizing, setIsFinalizing] = useState(false);
  const [confirmForfeitSurplus, setConfirmForfeitSurplus] = useState(false);

  const [feedback, setFeedback] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  useEffect(() => {
    fetchInitialData();
  }, [activeMembership?.messId]);

  const fetchInitialData = async () => {
    if (!activeMembership?.messId) return;
    setIsLoading(true);
    try {
      // 1. Dining Config
      const configData = await api.get<DiningConfigDto>(
        `/messes/${activeMembership.messId}/config`
      );
      setConfig(configData);
      setCarryForward(configData.defaultCarryForward);
      setSessionsConfig(
        configData.sessions.map((s) => ({
          session: s.session,
          unitValue: s.unitValue.toString(),
          cutoffTime: s.cutoffTime,
          isEnabled: s.isEnabled,
          servingStartTime:
            s.servingStartTime ||
            (s.session === 'BREAKFAST'
              ? '07:30'
              : s.session === 'LUNCH'
              ? '13:00'
              : '20:30'),
          servingEndTime:
            s.servingEndTime ||
            (s.session === 'BREAKFAST'
              ? '09:30'
              : s.session === 'LUNCH'
              ? '14:30'
              : '22:00'),
        }))
      );

      // 2. Active Cycle
      const cycleData = await api.get<ActiveCycleDto>(
        `/cycles/active?messId=${activeMembership.messId}`
      );
      setActiveCycle(cycleData);

      // 3. Calculation preview
      const calcData = await api.get<CalculationPreviewDto>(
        `/calculations/preview?messId=${activeMembership.messId}`
      );
      setCalculation(calcData);
    } catch (err: any) {
      console.error('Failed to load settings data:', err);
      setFeedback({
        type: 'error',
        message: err.message || 'Unable to load configuration settings',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (feedback) {
      const t = setTimeout(() => setFeedback(null), 5000);
      return () => clearTimeout(t);
    }
  }, [feedback]);

  const handleSaveDiningConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeMembership?.messId) return;

    setIsSavingConfig(true);
    setFeedback(null);
    try {
      const payload: DiningConfigDto = {
        defaultCarryForward: carryForward,
        defaultBreakfastOn:
          sessionsConfig.find((s) => s.session === 'BREAKFAST')?.isEnabled ?? true,
        defaultLunchOn:
          sessionsConfig.find((s) => s.session === 'LUNCH')?.isEnabled ?? true,
        defaultDinnerOn:
          sessionsConfig.find((s) => s.session === 'DINNER')?.isEnabled ?? true,
        currency: config?.currency ?? 'BDT',
        sessions: sessionsConfig.map((s) => ({
          session: s.session,
          unitValue: parseFloat(s.unitValue) || 1.0,
          cutoffTime: s.cutoffTime,
          isEnabled: s.isEnabled,
          servingStartTime: s.servingStartTime,
          servingEndTime: s.servingEndTime,
        })),
      };

      await api.put(`/messes/${activeMembership.messId}/config`, payload);

      setFeedback({
        type: 'success',
        message: 'Dining rules, session unit values, and cutoffs updated successfully!',
      });
      await fetchInitialData();
    } catch (err: any) {
      console.error('Failed to save dining config:', err);
      setFeedback({
        type: 'error',
        message: err.message || 'Failed to update dining configuration',
      });
    } finally {
      setIsSavingConfig(false);
    }
  };

  const handlePauseDay = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeMembership?.messId) return;

    if (!pauseReason.trim()) {
      setFeedback({ type: 'error', message: 'Please enter a reason for pausing' });
      return;
    }

    setIsPausing(true);
    setFeedback(null);
    try {
      await api.post('/cycles/pause-day', {
        messId: activeMembership.messId,
        pausedDate: pauseDate,
        date: pauseDate,
        session: pauseSession === 'FULL_DAY' ? null : pauseSession,
        reason: pauseReason.trim(),
      });

      setFeedback({
        type: 'success',
        message: `Successfully registered pause on ${pauseDate}. Cycle end date has been auto-extended!`,
      });

      setIsPauseModalOpen(false);
      setPauseReason('');
      await fetchInitialData();
    } catch (err: any) {
      console.error('Failed to pause day:', err);
      setFeedback({
        type: 'error',
        message: err.message || 'Failed to pause day',
      });
    } finally {
      setIsPausing(false);
    }
  };

  const handleDownloadNoticeBoardCsv = async () => {
    if (!activeMembership?.messId) return;

    if (exportStartDate > exportEndDate) {
      setFeedback({
        type: 'error',
        message: 'Export start date cannot be after end date.',
      });
      return;
    }

    setIsExporting(true);
    try {
      const url = `/api/meals/export?messId=${activeMembership.messId}&startDate=${exportStartDate}&endDate=${exportEndDate}&format=csv`;
      const res = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) throw new Error('Export failed');

      const blob = await res.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = `MessMate_NoticeBoard_${exportStartDate}_to_${exportEndDate}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();

      setFeedback({
        type: 'success',
        message: 'Notice board CSV roster generated and downloaded successfully.',
      });
    } catch (err: any) {
      console.error('Export error:', err);
      setFeedback({
        type: 'error',
        message: err.message || 'Failed to download notice board export',
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleFinalizeCycle = async () => {
    if (!activeMembership?.messId) return;
    setIsFinalizing(true);
    setFeedback(null);
    try {
      await api.post('/calculations/finalize', {
        messId: activeMembership.messId,
        confirmForfeitSurplus,
      });

      setFeedback({
        type: 'success',
        message: `Cycle #${activeCycle?.cycleNumber} finalized! Balance ledgers closed and Cycle #${(activeCycle?.cycleNumber || 1) + 1} initialized.`,
      });

      setIsFinalizeModalOpen(false);
      setConfirmForfeitSurplus(false);
      await fetchInitialData();
    } catch (err: any) {
      console.error('Finalization error:', err);
      setFeedback({
        type: 'error',
        message: err.message || 'Cycle finalization failed',
      });
    } finally {
      setIsFinalizing(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-card border border-slate-border shadow-subtle">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-terracotta">
            <SlidersHorizontal className="w-4 h-4" />
            <span>Operational Administration</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-display font-extrabold text-slate-deep mt-1">
            Dining Rules & Cycle Control
          </h1>
          <p className="text-xs sm:text-sm text-slate-muted mt-0.5">
            Configure meal session cutoffs, unit weightings, pause holidays, and manage 30-active-day cycle settlements.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={fetchInitialData}
          isLoading={isLoading}
        >
          <RefreshCw className="w-4 h-4 mr-1.5" />
          Refresh
        </Button>
      </div>

      {feedback && (
        <Alert
          type={feedback.type}
          title={feedback.type === 'success' ? 'Settings Updated' : 'Operation Error'}
          onDismiss={() => setFeedback(null)}
        >
          {feedback.message}
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Dining Rules & Cutoff Configuration */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="p-6 border border-slate-border shadow-subtle">
            <form onSubmit={handleSaveDiningConfig} className="space-y-6">
              <div className="pb-4 border-b border-slate-border flex items-center justify-between">
                <div>
                  <h3 className="font-display font-bold text-slate-deep text-lg">
                    Meal Session Rules & Cutoffs
                  </h3>
                  <p className="text-xs text-slate-muted mt-0.5">
                    Define unit pricing multiplier and booking deadlines for each dining session
                  </p>
                </div>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  isLoading={isSavingConfig}
                  className="shadow-level1"
                >
                  <Save className="w-4 h-4 mr-1.5" />
                  Save Changes
                </Button>
              </div>

              {/* Carry Forward Switch */}
              <div className="p-4 rounded-button bg-canvas-tint border border-slate-border flex items-center justify-between gap-4">
                <div>
                  <h4 className="text-sm font-bold text-slate-deep">
                    Default Status Carry-Forward
                  </h4>
                  <p className="text-xs text-slate-muted mt-0.5">
                    When enabled, if a student does not update their meal toggle before the cutoff time, their previous day's booking status (ON/OFF) automatically carries forward.
                  </p>
                </div>
                <ToggleSwitch
                  checked={carryForward}
                  onChange={setCarryForward}
                  aria-label="Carry forward previous status"
                />
              </div>

              {/* Session-by-Session Grid */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-muted">
                    Session Unit Values, Serving Windows & Daily Cutoffs
                  </h4>
                  <span className="text-[11px] text-slate-muted">
                    Timezone: Asia/Dhaka
                  </span>
                </div>

                {sessionsConfig.map((sc, idx) => {
                  const Icon =
                    sc.session === 'BREAKFAST'
                      ? Sunrise
                      : sc.session === 'LUNCH'
                      ? Sun
                      : Moon;

                  return (
                    <div
                      key={sc.session}
                      className={clsx(
                        'p-4 rounded-card border transition-all space-y-3.5',
                        sc.isEnabled
                          ? 'bg-white border-slate-border shadow-subtle'
                          : 'bg-slate-50/70 border-slate-border/50 opacity-75'
                      )}
                    >
                      {/* Session Header Bar */}
                      <div className="flex items-center justify-between pb-2.5 border-b border-slate-border/50">
                        <div className="flex items-center gap-2.5">
                          <div
                            className={clsx(
                              'w-8 h-8 rounded-full flex items-center justify-center',
                              sc.session === 'BREAKFAST'
                                ? 'bg-amber-100 text-amber-700'
                                : sc.session === 'LUNCH'
                                ? 'bg-orange-100 text-orange-700'
                                : 'bg-indigo-100 text-indigo-700'
                            )}
                          >
                            <Icon className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-display font-bold text-slate-deep text-base">
                                {sc.session}
                              </span>
                              <Badge
                                variant={sc.isEnabled ? 'success' : 'neutral'}
                                size="sm"
                              >
                                {sc.isEnabled ? 'Active' : 'Disabled'}
                              </Badge>
                            </div>
                            <span className="text-[11px] text-slate-muted flex items-center gap-1 mt-0.5">
                              <Clock className="w-3 h-3 text-slate-400" />
                              Serving:{' '}
                              <strong className="text-slate-deep">
                                {formatServingWindow(
                                  sc.servingStartTime,
                                  sc.servingEndTime
                                )}
                              </strong>
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="text-xs text-slate-muted font-medium">
                            {sc.isEnabled ? 'Offer Meal:' : 'Disabled:'}
                          </span>
                          <ToggleSwitch
                            checked={sc.isEnabled}
                            onChange={(checked) => {
                              const updated = [...sessionsConfig];
                              updated[idx].isEnabled = checked;
                              setSessionsConfig(updated);
                            }}
                          />
                        </div>
                      </div>

                      {/* 4 Editable Form Fields */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                        <div>
                          <label className="block text-[11px] font-bold text-slate-muted mb-1 flex items-center gap-1">
                            <Clock className="w-3 h-3 text-slate-400" />
                            Serving Start Time
                          </label>
                          <Input
                            type="time"
                            value={sc.servingStartTime}
                            disabled={!sc.isEnabled}
                            onChange={(e) => {
                              const updated = [...sessionsConfig];
                              updated[idx].servingStartTime = e.target.value;
                              setSessionsConfig(updated);
                            }}
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-slate-muted mb-1 flex items-center gap-1">
                            <Clock className="w-3 h-3 text-slate-400" />
                            Serving End Time
                          </label>
                          <Input
                            type="time"
                            value={sc.servingEndTime}
                            disabled={!sc.isEnabled}
                            onChange={(e) => {
                              const updated = [...sessionsConfig];
                              updated[idx].servingEndTime = e.target.value;
                              setSessionsConfig(updated);
                            }}
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-slate-muted mb-1">
                            Booking Cutoff Time
                          </label>
                          <Input
                            type="time"
                            value={sc.cutoffTime}
                            disabled={!sc.isEnabled}
                            onChange={(e) => {
                              const updated = [...sessionsConfig];
                              updated[idx].cutoffTime = e.target.value;
                              setSessionsConfig(updated);
                            }}
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-slate-muted mb-1">
                            Unit Multiplier
                          </label>
                          <Input
                            type="number"
                            step="0.1"
                            min="0.1"
                            max="3.0"
                            value={sc.unitValue}
                            disabled={!sc.isEnabled}
                            onChange={(e) => {
                              const updated = [...sessionsConfig];
                              updated[idx].unitValue = e.target.value;
                              setSessionsConfig(updated);
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </form>
          </Card>

          {/* Notice Board Print & CSV Export */}
          <Card className="p-6 border border-slate-border shadow-subtle space-y-4">
            <div className="pb-3 border-b border-slate-border">
              <div className="flex items-center gap-2">
                <FileDown className="w-5 h-5 text-terracotta" />
                <h3 className="font-display font-bold text-slate-deep text-lg">
                  Notice Board Meal Roster Export
                </h3>
              </div>
              <p className="text-xs text-slate-muted mt-0.5">
                Generate printable meal booking sheets and RFC 4180 CSV files for dorm dining halls
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
              <div>
                <label className="block text-xs font-bold text-slate-deep mb-1">
                  Start Date
                </label>
                <Input
                  type="date"
                  value={exportStartDate}
                  onChange={(e) => setExportStartDate(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-deep mb-1">
                  End Date
                </label>
                <Input
                  type="date"
                  value={exportEndDate}
                  onChange={(e) => setExportEndDate(e.target.value)}
                />
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="primary"
                  size="md"
                  onClick={handleDownloadNoticeBoardCsv}
                  isLoading={isExporting}
                  className="w-full"
                >
                  <FileDown className="w-4 h-4 mr-1.5" />
                  Download CSV
                </Button>
              </div>
            </div>
          </Card>
        </div>

        {/* Right Col: Cycle Control, Paused Holidays, Finalization */}
        <div className="space-y-6">
          {/* Active Cycle Status Card */}
          <Card className="p-6 border border-slate-border shadow-subtle space-y-4">
            <div className="pb-3 border-b border-slate-border flex items-center justify-between">
              <div>
                <h3 className="font-display font-bold text-slate-deep text-base">
                  Cycle #{activeCycle?.cycleNumber || 1} Status
                </h3>
                <p className="text-xs text-slate-muted mt-0.5">
                  Dynamic 30 Active Dining Days Engine
                </p>
              </div>
              <Badge variant="success" size="sm">
                {activeCycle?.status || 'ACTIVE'}
              </Badge>
            </div>

            <div className="space-y-2.5 text-xs text-slate-deep">
              <div className="flex justify-between py-1 border-b border-slate-border/50">
                <span className="text-slate-muted">Cycle Start Date:</span>
                <span className="font-bold">{activeCycle?.startDate || '—'}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-border/50">
                <span className="text-slate-muted">Counted Active Days:</span>
                <span className="font-bold">
                  {activeCycle?.countedActiveDays || 0} / {activeCycle?.targetActiveDays || 30}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-border/50">
                <span className="text-slate-muted">Paused Days (Holidays):</span>
                <span className="font-bold text-terracotta">
                  {activeCycle?.pausedDays?.length || 0} days
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-border/50">
                <span className="text-slate-muted">Auto-Adjusted End Date:</span>
                <span className="font-display font-extrabold text-sm text-terracotta">
                  {activeCycle?.scheduledEndDate || '—'}
                </span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-muted">Projected Meal Rate:</span>
                <span className="font-display font-extrabold text-sm text-slate-deep">
                  ৳{calculation?.mealRate.toFixed(2) || '0.00'} / unit
                </span>
              </div>
            </div>

            <div className="pt-2 flex flex-col gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsPauseModalOpen(true)}
                className="w-full"
              >
                <PauseCircle className="w-4 h-4 mr-1.5 text-terracotta" />
                Register Paused Day / Holiday
              </Button>

              <Button
                variant="primary"
                size="sm"
                onClick={() => setIsFinalizeModalOpen(true)}
                className="w-full shadow-level1"
              >
                <Lock className="w-4 h-4 mr-1.5" />
                Preview & Finalize Cycle
              </Button>
            </div>
          </Card>

          {/* Registered Paused Days List */}
          <Card className="p-6 border border-slate-border shadow-subtle space-y-3">
            <h4 className="font-display font-bold text-slate-deep text-sm">
              Registered Paused Days ({activeCycle?.pausedDays?.length || 0})
            </h4>

            {activeCycle?.pausedDays && activeCycle.pausedDays.length > 0 ? (
              <div className="space-y-2">
                {activeCycle.pausedDays.map((pd, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 rounded-button bg-canvas-tint/70 border border-slate-border/60 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-deep">{pd.date}</span>
                      <Badge variant="neutral" size="sm">
                        {pd.session || 'Full Day'}
                      </Badge>
                    </div>
                    <p className="text-[11px] text-slate-muted mt-1">{pd.reason}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-muted italic">
                No paused days registered. Cycle end date matches standard 30 calendar days.
              </p>
            )}
          </Card>
        </div>
      </div>

      {/* Pause a Day Modal */}
      <Modal
        isOpen={isPauseModalOpen}
        onClose={() => !isPausing && setIsPauseModalOpen(false)}
        title="Register Paused Dining Day"
        maxWidth="md"
      >
        <form onSubmit={handlePauseDay} className="space-y-4">
          <p className="text-xs text-slate-muted leading-relaxed">
            Paused days (such as national holidays, convocation, or kitchen sanitation) do not count
            towards the required 30 active dining days. The cycle end date will automatically shift forward.
          </p>

          <div>
            <label className="block text-xs font-bold text-slate-deep mb-1">
              Date to Pause <span className="text-terracotta">*</span>
            </label>
            <Input
              type="date"
              value={pauseDate}
              onChange={(e) => setPauseDate(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-deep mb-1">
              Pause Scope
            </label>
            <Select
              value={pauseSession}
              onChange={(e) => setPauseSession(e.target.value)}
              options={[
                { value: 'FULL_DAY', label: 'Entire Day (All Meals)' },
                { value: 'BREAKFAST', label: 'Breakfast Session Only' },
                { value: 'LUNCH', label: 'Lunch Session Only' },
                { value: 'DINNER', label: 'Dinner Session Only' },
              ]}
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-deep mb-1">
              Reason for Pausing <span className="text-terracotta">*</span>
            </label>
            <Input
              placeholder="e.g. University Convocation Day, Campus Electrical Maintenance"
              value={pauseReason}
              onChange={(e) => setPauseReason(e.target.value)}
              required
            />
          </div>

          <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-border">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsPauseModalOpen(false)}
              disabled={isPausing}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              isLoading={isPausing}
            >
              Confirm & Extend Cycle
            </Button>
          </div>
        </form>
      </Modal>

      {/* Finalize Cycle Modal */}
      <Modal
        isOpen={isFinalizeModalOpen}
        onClose={() => !isFinalizing && setIsFinalizeModalOpen(false)}
        title={`Finalize & Close Cycle #${activeCycle?.cycleNumber || 1}`}
        maxWidth="lg"
      >
        <div className="space-y-5">
          <Alert type="warning" title="Irreversible Financial Settlement">
            Closing this dining cycle locks all meal logs and expenses. Final meal rates will be permanently recorded in the student balance ledgers, and Cycle #{(activeCycle?.cycleNumber || 1) + 1} will be initialized.
          </Alert>

          {calculation && (
            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 bg-canvas-tint p-3.5 rounded-card border border-slate-border">
                <div>
                  <span className="text-slate-muted block text-[11px]">Total Expenses</span>
                  <span className="font-display font-extrabold text-sm text-slate-deep">
                    ৳{calculation.totalExpenses.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div>
                  <span className="text-slate-muted block text-[11px]">Total Meal Units</span>
                  <span className="font-display font-extrabold text-sm text-slate-deep">
                    {calculation.totalCountedUnits.toFixed(1)} units
                  </span>
                </div>
                <div>
                  <span className="text-slate-muted block text-[11px]">Final Meal Rate</span>
                  <span className="font-display font-extrabold text-sm text-terracotta">
                    ৳{calculation.mealRate.toFixed(4)}
                  </span>
                </div>
                <div>
                  <span className="text-slate-muted block text-[11px]">Members</span>
                  <span className="font-display font-extrabold text-sm text-slate-deep">
                    {calculation.memberSummaries.length} students
                  </span>
                </div>
              </div>

              {/* Members Breakdown Preview */}
              <div className="max-h-60 overflow-y-auto border border-slate-border rounded-button">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="sticky top-0 bg-white border-b border-slate-border">
                    <tr>
                      <th className="p-2.5 font-bold">Student</th>
                      <th className="p-2.5 font-bold">Units</th>
                      <th className="p-2.5 font-bold">Total Cost</th>
                      <th className="p-2.5 font-bold">Deposits</th>
                      <th className="p-2.5 font-bold text-right">Net Balance</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-border bg-white">
                    {calculation.memberSummaries.map((m) => (
                      <tr key={m.userId} className={m.hasNegativeBalance ? 'bg-red-50/50' : ''}>
                        <td className="p-2.5 font-bold">{m.fullName}</td>
                        <td className="p-2.5">
                          {m.totalMemberUnits.toFixed(1)}
                          {m.totalGuestUnits > 0 ? ` +${m.totalGuestUnits}` : ''}
                        </td>
                        <td className="p-2.5">৳{m.totalCost.toFixed(2)}</td>
                        <td className="p-2.5">৳{m.totalDeposits.toFixed(2)}</td>
                        <td className="p-2.5 text-right font-bold">
                          <span
                            className={
                              m.hasNegativeBalance
                                ? 'text-status-error font-extrabold'
                                : 'text-emerald-700'
                            }
                          >
                            ৳{m.netBalance.toFixed(2)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {(() => {
            const surplusMembers = calculation?.memberSummaries.filter((m) => m.netBalance > 0) || [];
            const totalSurplus = surplusMembers.reduce((sum, m) => sum + m.netBalance, 0);
            const hasUncarriedSurplus = !carryForward && surplusMembers.length > 0;

            return (
              <>
                {hasUncarriedSurplus && (
                  <div className="bg-amber-50 border-2 border-amber-300 rounded-card p-4 space-y-3">
                    <div className="flex items-center gap-2 text-amber-900 font-bold text-xs uppercase tracking-wider">
                      <AlertTriangle className="w-4 h-4 text-amber-700" />
                      <span>Refund Commitment Required (Carry-Forward Disabled)</span>
                    </div>
                    <p className="text-xs text-amber-900 font-medium leading-relaxed">
                      <strong>{surplusMembers.length} member{surplusMembers.length > 1 ? 's have' : ' has'}</strong> a positive balance totaling <strong>৳{totalSurplus.toFixed(2)}</strong> that will not carry forward to the new cycle.
                    </p>
                    <div className="text-[11px] text-amber-800 bg-white/70 p-2.5 rounded border border-amber-200 space-y-1">
                      <div className="font-semibold text-amber-900">Affected members to refund offline:</div>
                      <div className="max-h-24 overflow-y-auto space-y-1 divide-y divide-amber-100">
                        {surplusMembers.map((m) => (
                          <div key={m.userId} className="flex justify-between pt-1">
                            <span>{m.fullName}:</span>
                            <span className="font-bold text-amber-950">৳{m.netBalance.toFixed(2)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <label className="flex items-start gap-2.5 pt-1 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={confirmForfeitSurplus}
                        onChange={(e) => setConfirmForfeitSurplus(e.target.checked)}
                        className="mt-0.5 rounded border-amber-400 text-terracotta focus:ring-terracotta"
                      />
                      <span className="text-xs font-bold text-amber-950">
                        I confirm I will refund ৳{totalSurplus.toFixed(2)} separately (cash/bKash) before proceeding.
                      </span>
                    </label>
                  </div>
                )}

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-border">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setIsFinalizeModalOpen(false);
                      setConfirmForfeitSurplus(false);
                    }}
                    disabled={isFinalizing}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={handleFinalizeCycle}
                    isLoading={isFinalizing}
                    disabled={hasUncarriedSurplus && !confirmForfeitSurplus}
                    className="shadow-level1"
                  >
                    Execute Finalization & Settle
                  </Button>
                </div>
              </>
            );
          })()}
        </div>
      </Modal>
    </div>
  );
};
