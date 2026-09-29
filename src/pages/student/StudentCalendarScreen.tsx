import React, { useState, useEffect } from 'react';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Layers,
  Info,
  Check,
  X,
  Clock,
  ShieldAlert,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../api/client';
import type {
  DailyMealStatusDto,
  ActiveCycleDto,
  MealSession,
  DiningConfigDto,
} from '../../types';
import { Button, Modal, Select, Alert, Skeleton } from '../../components/common';
import { getActiveSessionList, isSessionCutoffPassed } from '../../utils/sessionUtils';
import { getTodayDhaka, addDays } from '../../utils/dhakaDate';

export const StudentCalendarScreen: React.FC = () => {
  const { activeMembership } = useAuth();

  const [activeCycle, setActiveCycle] = useState<ActiveCycleDto | null>(null);
  const [diningConfig, setDiningConfig] = useState<DiningConfigDto | null>(null);
  const [mealStatuses, setMealStatuses] = useState<DailyMealStatusDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [startDateOffset, setStartDateOffset] = useState(0); // 0 = current week window
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [actionAlert, setActionAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Bulk modal states
  const [bulkDaysCount, setBulkDaysCount] = useState('7');
  const [bulkSession, setBulkSession] = useState<'ALL' | MealSession>('ALL');
  const [bulkStatus, setBulkStatus] = useState<'ON' | 'OFF'>('OFF');
  const [bulkLoading, setBulkLoading] = useState(false);

  // Calculate 7-day display window starting from Asia/Dhaka today.
  // MUST NOT use new Date().toISOString() — that gives UTC, one day behind pre-6 AM Dhaka.
  const todayDhaka = getTodayDhaka();
  const windowStartStr = addDays(todayDhaka, startDateOffset * 7);

  const days: string[] = [];
  for (let i = 0; i < 7; i++) {
    days.push(addDays(windowStartStr, i));
  }

  const startStr = days[0];
  const endStr = days[days.length - 1];

  const fetchCalendarData = async () => {
    if (!activeMembership) return;
    setIsLoading(true);
    try {
      // 1. Fetch active cycle to know paused days & cycle date range
      const cycleData = await api.get<ActiveCycleDto>(`/cycles/active?messId=${activeMembership.messId}`);
      setActiveCycle(cycleData);

      // 2. Fetch student's meal status records for the 7-day window
      const statuses = await api.get<DailyMealStatusDto[]>(
        `/meals/my-status?startDate=${startStr}&endDate=${endStr}`
      );
      setMealStatuses(statuses);

      // 3. Fetch dining config to know active enabled sessions
      try {
        const configData = await api.get<DiningConfigDto>(`/messes/${activeMembership.messId}/config`);
        setDiningConfig(configData);
      } catch {
        // Fallback to defaults
      }
    } catch (err: any) {
      console.error('Error fetching calendar data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCalendarData();
  }, [startDateOffset, activeMembership]);



  const isPausedDay = (dateStr: string) => {
    return activeCycle?.pausedDays.find((p) => p.date === dateStr);
  };

  const getMealStatus = (dateStr: string, session: MealSession): boolean => {
    const found = mealStatuses.find((m) => m.date === dateStr && m.session === session);
    return found ? found.status === 'ON' : true; // default ON
  };

  const isDateInPast = (dateStr: string) => dateStr < getTodayDhaka();

  const handleToggle = async (dateStr: string, session: MealSession, currOn: boolean) => {
    const newStatus = currOn ? 'OFF' : 'ON';
    setActionAlert(null);
    try {
      const updated = await api.post<DailyMealStatusDto>('/meals/toggle', {
        date: dateStr,
        session,
        status: newStatus,
      });

      setMealStatuses((prev) => {
        const filtered = prev.filter((m) => !(m.date === dateStr && m.session === session));
        return [...filtered, updated];
      });

      setActionAlert({
        type: 'success',
        message: `${dateStr} ${session} updated to ${newStatus}.`,
      });
      setTimeout(() => setActionAlert(null), 3000);
    } catch (err: any) {
      setActionAlert({
        type: 'error',
        message: err.message || 'Failed to toggle meal booking.',
      });
    }
  };

  const activeSessions = getActiveSessionList(diningConfig);

  const handleBulkToggle = async () => {
    setBulkLoading(true);
    setActionAlert(null);

    try {
      const daysToUpdate = parseInt(bulkDaysCount, 10) || 3;
      const sessionsToUpdate: MealSession[] =
        bulkSession === 'ALL'
          ? (activeSessions.map((s) => s.session as MealSession))
          : [bulkSession];

      let updatedCount = 0;
      for (let i = 1; i <= daysToUpdate; i++) {
        const dateStr = addDays(getTodayDhaka(), i);

        // Skip paused days
        if (isPausedDay(dateStr)) continue;

        for (const sess of sessionsToUpdate) {
          try {
            await api.post('/meals/toggle', {
              date: dateStr,
              session: sess,
              status: bulkStatus,
            });
            updatedCount++;
          } catch {
            // ignore individual past cutoffs
          }
        }
      }

      setIsBulkModalOpen(false);
      setActionAlert({
        type: 'success',
        message: `Bulk plan updated: ${updatedCount} meal sessions set to ${bulkStatus}.`,
      });
      fetchCalendarData();
    } catch (err: any) {
      setActionAlert({ type: 'error', message: err.message || 'Bulk planning failed.' });
    } finally {
      setBulkLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-8 pt-6 sm:pt-8 space-y-8">
      {/* Header & Controls */}
      <section className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs uppercase font-bold tracking-wider text-terracotta flex items-center gap-1">
              <CalendarIcon className="w-3.5 h-3.5" />
              Meal Booking Roster
            </span>
          </div>
          <h1 className="font-display font-extrabold text-2xl sm:text-3xl text-slate-deep tracking-tight">
            Student Meal Calendar
          </h1>
          <p className="text-xs sm:text-sm text-slate-muted font-body mt-0.5">
            Plan your daily attendance ahead of time or bulk-toggle meals for weekend trips
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Button
            variant="outline"
            size="md"
            onClick={() => setIsBulkModalOpen(true)}
            icon={<Layers className="w-4 h-4" />}
          >
            Bulk Planning
          </Button>

          {/* Week window pagination */}
          <div className="flex items-center bg-white rounded-button border border-slate-border shadow-subtle p-1">
            <button
              onClick={() => setStartDateOffset((prev) => prev - 1)}
              className="p-2 hover:bg-canvas-tint rounded-input text-slate-muted hover:text-slate-deep transition-colors"
              title="Previous 7 days"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setStartDateOffset(0)}
              className="px-3 py-1.5 text-xs font-bold text-slate-deep hover:bg-canvas-tint rounded-input transition-colors"
            >
              Current Week
            </button>
            <button
              onClick={() => setStartDateOffset((prev) => prev + 1)}
              className="p-2 hover:bg-canvas-tint rounded-input text-slate-muted hover:text-slate-deep transition-colors"
              title="Next 7 days"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>

      {/* Alert banner */}
      {actionAlert && (
        <Alert type={actionAlert.type} onDismiss={() => setActionAlert(null)}>
          {actionAlert.message}
        </Alert>
      )}

      {/* Cycle Paused Days Notice */}
      {activeCycle && activeCycle.pausedDays.length > 0 && (
        <section className="bg-canvas-tint/70 rounded-2xl p-4 border border-slate-border/60 flex items-start gap-3">
          <Info className="w-5 h-5 text-terracotta shrink-0 mt-0.5" />
          <div className="text-xs font-body text-slate-muted space-y-1">
            <span className="font-bold text-slate-deep block">
              Active Cycle Paused Days Schedule ({activeCycle.pausedDays.length} days shifted)
            </span>
            <div className="flex flex-wrap gap-2 pt-1">
              {activeCycle.pausedDays.map((p) => (
                <span
                  key={p.date}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white border border-slate-border text-slate-deep font-semibold"
                >
                  <ShieldAlert className="w-3 h-3 text-status-warning" />
                  <span>{p.date}: {p.reason}</span>
                </span>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 7-Day Interactive Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-4">
          {[...Array(7)].map((_, i) => (
            <Skeleton key={i} variant="rectangular" height={280} />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-4">
          {days.map((dateStr) => {
            const isToday = dateStr === getTodayDhaka();
            const inPast = isDateInPast(dateStr);
            const paused = isPausedDay(dateStr);
            // Parse as local midnight for display-only formatting (weekday name, day number)
            const displayDate = new Date(dateStr + 'T00:00:00');

            return (
              <div
                key={dateStr}
                className={`bg-white rounded-card border transition-all p-4 shadow-level1 flex flex-col justify-between ${
                  isToday
                    ? 'ring-2 ring-terracotta border-terracotta/40'
                    : 'border-slate-border'
                } ${paused ? 'bg-slate-50/70 border-dashed' : ''}`}
              >
                {/* Day Header */}
                <div className="pb-3 border-b border-slate-border/50">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-muted uppercase tracking-wider font-body">
                      {displayDate.toLocaleDateString('en-US', { weekday: 'short' })}
                    </span>
                    {isToday && (
                      <span className="px-2 py-0.5 rounded-full bg-terracotta text-white text-[10px] font-bold">
                        Today
                      </span>
                    )}
                  </div>
                  <div className="font-display font-extrabold text-xl text-slate-deep mt-0.5">
                    {displayDate.getDate()} {displayDate.toLocaleDateString('en-US', { month: 'short' })}
                  </div>
                </div>

                {/* Paused Day Message if any */}
                {paused ? (
                  <div className="my-6 p-3 bg-amber-50 rounded-input border border-amber-200/60 text-center">
                    <ShieldAlert className="w-5 h-5 text-status-warning mx-auto mb-1" />
                    <span className="text-[11px] font-bold text-amber-900 block">
                      Hall Paused
                    </span>
                    <span className="text-[10px] text-amber-700 block mt-0.5 leading-snug">
                      {paused.reason}
                    </span>
                  </div>
                ) : (
                  /* Active Sessions */
                  <div className="space-y-2.5 my-4">
                    {activeSessions.length === 0 ? (
                      <div className="p-3 text-center text-slate-muted text-xs bg-canvas-tint/40 rounded-input border border-dashed border-slate-border">
                        No sessions active
                      </div>
                    ) : (
                      activeSessions.map((sessionConfig) => {
                        const session = sessionConfig.session as MealSession;
                        const isOn = getMealStatus(dateStr, session);
                        const isCutoff = isSessionCutoffPassed(sessionConfig.cutoffTime, dateStr);
                        const isLocked = inPast || isCutoff;

                        return (
                          <div
                            key={session}
                            className={`p-2.5 rounded-input border flex items-center justify-between transition-all ${
                              isOn
                                ? 'bg-terracotta-container/30 border-terracotta/30'
                                : 'bg-canvas-tint/40 border-slate-border/60'
                            } ${isLocked ? 'opacity-60 cursor-not-allowed' : ''}`}
                          >
                            <div>
                              <div className="flex items-center gap-1.5">
                                <span className="text-xs font-bold text-slate-deep block font-body">
                                  {session.charAt(0) + session.slice(1).toLowerCase()}
                                </span>
                                {isLocked && (
                                  <span className="text-[9px] font-bold text-amber-700 bg-amber-50 border border-amber-200/80 px-1 py-0.2 rounded">
                                    {inPast ? 'Passed' : 'Cutoff'}
                                  </span>
                                )}
                              </div>
                              <span className="text-[10px] text-slate-muted block">
                                {sessionConfig.unitValue.toFixed(1)} unit
                              </span>
                            </div>

                            <button
                              type="button"
                              disabled={isLocked}
                              onClick={() => !isLocked && handleToggle(dateStr, session, isOn)}
                              className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs transition-all tactile-btn ${
                                isOn
                                  ? 'bg-terracotta text-white shadow-subtle'
                                  : 'bg-slate-200 text-slate-muted hover:bg-slate-300'
                              } ${isLocked ? 'pointer-events-none' : ''}`}
                            >
                              {isOn ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}
                            </button>
                          </div>
                        );
                      })
                    )}
                  </div>
                )}

                {/* Day Footer note */}
                <div className="pt-2 border-t border-slate-border/40 text-[10px] text-slate-muted flex items-center justify-between">
                  {inPast ? (
                    <span className="flex items-center gap-1 text-slate-muted">
                      <Clock className="w-3 h-3" /> Past
                    </span>
                  ) : paused ? (
                    <span className="text-status-warning font-semibold">No charge</span>
                  ) : (
                    <span className="text-sage font-bold">Editable</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Bulk Planning Modal */}
      <Modal
        isOpen={isBulkModalOpen}
        onClose={() => setIsBulkModalOpen(false)}
        title="Bulk Meal Booking Planner"
        description="Schedule upcoming days (e.g. turning meals OFF for a weekend trip)"
      >
        <div className="space-y-4">
          <Select
            label="Apply for Next"
            value={bulkDaysCount}
            onChange={(e) => setBulkDaysCount(e.target.value)}
            options={[
              { value: '2', label: 'Next 2 Days (Upcoming Weekend)' },
              { value: '3', label: 'Next 3 Days (Long Weekend)' },
              { value: '5', label: 'Next 5 Days (Midterm Week)' },
              { value: '7', label: 'Next 7 Days (Full Week)' },
            ]}
          />

          <Select
            label="Target Session"
            value={bulkSession}
            onChange={(e) => setBulkSession(e.target.value as any)}
            options={[
              {
                value: 'ALL',
                label: `All Active Sessions (${activeSessions.map((s) => s.session.charAt(0) + s.session.slice(1).toLowerCase()).join(', ') || 'None'})`,
              },
              ...activeSessions.map((s) => ({
                value: s.session,
                label: `${s.session.charAt(0) + s.session.slice(1).toLowerCase()} Only`,
              })),
            ]}
          />

          <Select
            label="Desired Meal Status"
            value={bulkStatus}
            onChange={(e) => setBulkStatus(e.target.value as any)}
            options={[
              { value: 'OFF', label: 'Turn OFF (Skip Dining)' },
              { value: 'ON', label: 'Turn ON (Active Booking)' },
            ]}
          />

          <div className="pt-2 flex justify-end gap-2">
            <Button
              variant="outline"
              size="md"
              onClick={() => setIsBulkModalOpen(false)}
              disabled={bulkLoading}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="md"
              onClick={handleBulkToggle}
              isLoading={bulkLoading}
            >
              Apply Bulk Changes
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
