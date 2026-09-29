import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  PlusCircle,
  History,
  Calendar,
  Users,
  Vote,
  RefreshCw,
  CheckCircle2,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../api/client';
import type {
  DailyMealStatusDto,
  CalculationPreviewDto,
  MenuItemDto,
  WeeklyMenuDto,
  ActiveCycleDto,
  DiningConfigDto,
} from '../../types';
import {
  MealToggleCard,
  Alert,
  Skeleton,
} from '../../components/common';
import { formatServingWindow, formatTime12h } from '../../utils/timeFormat';
import { getActiveSessionList, isSessionCutoffPassed } from '../../utils/sessionUtils';
import { getTodayDhaka, getDayOfWeekDhaka, getCurrentHourDhaka } from '../../utils/dhakaDate';

export interface StudentHomeScreenProps {
  onNavigateToCalendar: () => void;
  onNavigateToAccount: () => void;
  onOpenDepositModal: () => void;
}

export const StudentHomeScreen: React.FC<StudentHomeScreenProps> = ({
  onNavigateToCalendar,
  onNavigateToAccount,
  onOpenDepositModal,
}) => {
  const { user, activeMembership } = useAuth();

  const [isLoading, setIsLoading] = useState(true);
  const [diningConfig, setDiningConfig] = useState<DiningConfigDto | null>(null);
  const [activeCycle, setActiveCycle] = useState<ActiveCycleDto | null>(null);
  const [calculation, setCalculation] = useState<CalculationPreviewDto | null>(null);
  const [todayMeals, setTodayMeals] = useState<DailyMealStatusDto[]>([]);
  const [todayMenu, setTodayMenu] = useState<MenuItemDto[]>([]);
  const [guestCounts, setGuestCounts] = useState<{ [session: string]: number }>({
    BREAKFAST: 0,
    LUNCH: 0,
    DINNER: 0,
  });
  const [notes, setNotes] = useState<{ [session: string]: string }>({
    BREAKFAST: '',
    LUNCH: '',
    DINNER: '',
  });
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  // Always use Asia/Dhaka calendar date — toISOString() gives UTC which is one
  // day behind between midnight and 6 AM Dhaka time.
  const todayStr = getTodayDhaka();

  const fetchData = async () => {
    if (!activeMembership) return;
    setIsLoading(true);
    try {
      // 1. Fetch calculation preview for running meal rate and balance
      const calcData = await api.get<CalculationPreviewDto>(
        `/calculations/preview?messId=${activeMembership.messId}`
      );
      setCalculation(calcData);

      // 2. Fetch active cycle info
      try {
        const cycleData = await api.get<ActiveCycleDto>(
          `/cycles/active?messId=${activeMembership.messId}`
        );
        setActiveCycle(cycleData);
      } catch {
        // Optional
      }

      // 3. Fetch student's meal status for today
      const mealStatuses = await api.get<DailyMealStatusDto[]>(
        `/meals/my-status?startDate=${todayStr}&endDate=${todayStr}`
      );
      setTodayMeals(mealStatuses);

      // 4. Fetch weekly menu to get today's course details
      try {
        const menuData = await api.get<WeeklyMenuDto>(`/menus/weekly?messId=${activeMembership.messId}`);
        const todayDayOfWeek = getDayOfWeekDhaka(); // 0 = Sunday, Asia/Dhaka
        const itemsForToday = menuData.items.filter((i) => i.dayOfWeek === todayDayOfWeek);
        setTodayMenu(itemsForToday);
      } catch {
        // Optional if menu not created
      }

      // 5. Fetch dining config for active session settings and serving windows
      try {
        const configData = await api.get<DiningConfigDto>(
          `/messes/${activeMembership.messId}/config`
        );
        setDiningConfig(configData);
      } catch {
        // Optional fallback to default settings
      }
    } catch (err: any) {
      console.error('Error loading dashboard data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [activeMembership]);

  // Find student's personal calculation summary
  const mySummary = calculation?.memberSummaries.find((m) => m.userId === user?.id);
  const isRateVolatile = calculation?.isRateVolatile || (!calculation?.final && (calculation?.totalCountedUnits ?? 0) < 15);

  // Helper to check if a meal session is ON for today
  const isSessionOn = (session: 'BREAKFAST' | 'LUNCH' | 'DINNER'): boolean => {
    const found = todayMeals.find((m) => m.session === session);
    return found ? found.status === 'ON' : true; // default ON in mess system
  };

  const handleToggleMeal = async (session: 'BREAKFAST' | 'LUNCH' | 'DINNER', newStatus: boolean) => {
    setActionError(null);
    setActionSuccess(null);
    try {
      const updated = await api.post<DailyMealStatusDto>('/meals/toggle', {
        date: todayStr,
        session,
        status: newStatus ? 'ON' : 'OFF',
      });

      setTodayMeals((prev) => {
        const filtered = prev.filter((m) => m.session !== session);
        return [...filtered, updated];
      });

      setActionSuccess(`${session} meal turned ${newStatus ? 'ON' : 'OFF'} successfully.`);
      setTimeout(() => setActionSuccess(null), 3500);

      // Refresh calculation in background
      if (activeMembership) {
        api.get<CalculationPreviewDto>(`/calculations/preview?messId=${activeMembership.messId}`)
          .then(setCalculation)
          .catch(() => {});
      }
    } catch (err: any) {
      setActionError(err.message || `Failed to alter ${session} meal status.`);
    }
  };

  const getMenuItem = (session: 'BREAKFAST' | 'LUNCH' | 'DINNER') => {
    return todayMenu.find((i) => i.session === session);
  };

  // Auto-dismiss errors after 4s
  useEffect(() => {
    if (actionError) {
      const t = setTimeout(() => setActionError(null), 4000);
      return () => clearTimeout(t);
    }
  }, [actionError]);

  const activeSessions = getActiveSessionList(diningConfig);

  const mealsOnCount = activeSessions.filter((s) =>
    isSessionOn(s.session as 'BREAKFAST' | 'LUNCH' | 'DINNER')
  ).length;

  const greetingTime = (): string => {
    const h = getCurrentHourDhaka();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-8 pt-6 sm:pt-8 space-y-8">
      {/* 1. Hero & Welcome Section */}
      <section className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-sage-tint text-sage text-xs font-bold font-body">
              <Sparkles className="w-3 h-3" />
              {activeMembership?.messName || 'Mess'} Active
            </span>
            <span className="text-xs text-slate-muted font-medium">
              Today: {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
            </span>
            {activeSessions.length > 0 && mealsOnCount > 0 && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-terracotta-container text-terracotta text-xs font-bold">
                {mealsOnCount}/{activeSessions.length} Meals ON
              </span>
            )}
          </div>
          <h1 className="font-display font-extrabold text-2xl sm:text-3xl text-slate-deep tracking-tight">
            {greetingTime()}, {user?.fullName?.split(' ')[0] || 'Student'} 👋
          </h1>
          <p className="text-xs sm:text-sm text-slate-muted font-body mt-0.5">
            {user?.roomNumber ? `Room ${user.roomNumber} • ` : ''}Mess schedule running on standard daylight cycle. Cutoff in effect.
          </p>
        </div>

        {/* Live Mess Hall Capacity Gauge (From Stitch design) */}
        <div className="bg-white rounded-2xl p-4 border border-slate-border shadow-level1 flex items-center gap-4 self-start md:self-auto">
          <div className="flex flex-col">
            <span className="text-[11px] font-semibold text-slate-muted uppercase tracking-wider">
              Mess Hall Crowd
            </span>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="w-2.5 h-2.5 rounded-full bg-status-success animate-pulse" />
              <span className="text-sm font-bold text-slate-deep">34% Low Capacity</span>
            </div>
          </div>
          <div className="w-16 h-2 bg-slate-100 rounded-full overflow-hidden">
            <div className="bg-status-success h-full w-[34%] rounded-full" />
          </div>
        </div>
      </section>

      {/* Action alerts */}
      {actionSuccess && (
        <Alert type="success" onDismiss={() => setActionSuccess(null)}>
          {actionSuccess}
        </Alert>
      )}
      {actionError && (
        <Alert type="error" onDismiss={() => setActionError(null)}>
          {actionError}
        </Alert>
      )}

      {/* Cycle Status Banners */}
      {activeCycle?.status === 'EXPIRING' && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 shadow-subtle">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center text-amber-800 shrink-0">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-amber-950">
                Meal Cycle #{activeCycle.cycleNumber} is Ending Soon
              </h4>
              <p className="text-xs text-amber-800 mt-0.5">
                Active day {activeCycle.countedActiveDays} of {activeCycle.targetActiveDays} (Scheduled end: {activeCycle.scheduledEndDate}). Please ensure your balance is topped up.
              </p>
            </div>
          </div>
          <button
            onClick={onOpenDepositModal}
            className="w-full sm:w-auto px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold rounded-lg shrink-0 transition-colors shadow-subtle text-center min-h-[40px] flex items-center justify-center"
          >
            Add Deposit
          </button>
        </div>
      )}

      {activeCycle?.status === 'COMPLETED' && (
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 shadow-subtle">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center text-blue-700 shrink-0">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-blue-950">
                Meal Cycle #{activeCycle.cycleNumber} Concluded
              </h4>
              <p className="text-xs text-blue-800 mt-0.5">
                All {activeCycle.targetActiveDays} days completed. Final accounting calculations and settlements are being processed.
              </p>
            </div>
          </div>
          <button
            onClick={onNavigateToAccount}
            className="w-full sm:w-auto px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shrink-0 transition-colors shadow-subtle text-center min-h-[40px] flex items-center justify-center"
          >
            View Statement
          </button>
        </div>
      )}

      {/* Negative Balance Warning Banner if applicable */}
      {mySummary?.hasNegativeBalance && (
        isRateVolatile ? (
          <Alert type="info" title="Provisional Dining Balance">
            Your dining account balance currently shows a provisional deficit of{' '}
            <strong className="text-slate-deep font-mono">
              -৳{Math.abs(mySummary.netBalance).toFixed(2)}
            </strong>{' '}
            based on early-cycle meal rates ({calculation?.totalCountedUnits ?? 0} total mess meals logged so far).
            This estimate will stabilize as more meals are consumed across the mess.
          </Alert>
        ) : (
          <Alert type="warning" title="Negative Balance Notice">
            Your dining account balance is currently{' '}
            <strong className="text-status-error font-mono">
              -৳{Math.abs(mySummary.netBalance).toFixed(2)}
            </strong>
            . Please submit an advance deposit to avoid automated meal booking suspension.
          </Alert>
        )
      )}

      {/* Community Announcement Banner from Stitch */}
      <section className="bg-gradient-to-r from-sage/15 via-sage/10 to-canvas-tint border border-sage/30 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-subtle">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-sage text-white flex items-center justify-center shrink-0 shadow-subtle">
            <Vote className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-sage block">
              Governance & Dining Poll
            </span>
            <p className="text-xs sm:text-sm font-semibold text-slate-deep">
              Special Weekend Feast voting is open! Primary Manager transfer proposal under review.
            </p>
          </div>
        </div>
        <button
          onClick={onNavigateToCalendar}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-white hover:bg-slate-50 text-sage text-xs font-bold rounded-xl border border-sage/30 transition-all tactile-btn shrink-0 shadow-subtle"
        >
          <span>View Schedule</span>
          <Calendar className="w-3.5 h-3.5" />
        </button>
      </section>

      {/* 2. BENTO GRID: Balance Card (5 Cols) + Today's Meal Status (7 Cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Prepaid Meal Wallet Card */}
        <section className="lg:col-span-5 bg-gradient-to-br from-terracotta via-[#d04412] to-coral text-white rounded-card p-6 sm:p-7 shadow-level2 relative overflow-hidden flex flex-col justify-between min-h-[380px]">
          {/* Decorative backdrop glyph */}
          <div className="absolute -right-8 -bottom-8 text-white/10 pointer-events-none select-none">
            <Users className="w-48 h-48" />
          </div>

          <div>
            {/* Header */}
            <div className="flex justify-between items-start">
              <div>
                <span className="text-white/80 text-xs uppercase tracking-wider font-semibold block">
                  Prepaid Meal Wallet
                </span>
                <span className="font-display font-extrabold text-3xl sm:text-4xl text-white mt-1 block tracking-tight">
                  {isLoading ? (
                    '৳ ...'
                  ) : mySummary ? (
                    `৳ ${mySummary.netBalance.toFixed(2)}`
                  ) : (
                    '৳ 0.00'
                  )}
                </span>
              </div>
              <span
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold backdrop-blur-md border ${
                  mySummary?.hasNegativeBalance
                    ? (isRateVolatile ? 'bg-amber-500/30 text-white border-amber-300/40' : 'bg-red-500/30 text-white border-red-300/40')
                    : 'bg-white/20 text-white border-white/20'
                }`}
              >
                <span
                  className={`w-2 h-2 rounded-full ${
                    mySummary?.hasNegativeBalance
                      ? (isRateVolatile ? 'bg-amber-300' : 'bg-red-400')
                      : 'bg-emerald-400'
                  }`}
                />
                {mySummary?.hasNegativeBalance
                  ? (isRateVolatile ? 'Provisional Due' : 'Negative Due')
                  : 'Active Deposit'}
              </span>
            </div>

            {/* Metrics Breakdown Grid */}
            <div className="grid grid-cols-2 gap-3 mt-6 pt-4 border-t border-white/20">
              <div className="bg-black/15 backdrop-blur-sm rounded-xl p-3.5">
                <span className="text-white/70 text-xs block">Monthly Counted Units</span>
                <span className="font-display font-extrabold text-xl text-white block mt-1">
                  {mySummary?.totalMemberUnits.toFixed(1) || '0.0'}{' '}
                  <span className="text-xs font-normal text-white/70">units</span>
                </span>
                <div className="w-full bg-white/20 h-1.5 rounded-full mt-2 overflow-hidden">
                  <div
                    className="bg-sage-container h-full rounded-full"
                    style={{ width: `${Math.min(((mySummary?.activeDays || 1) / 30) * 100, 100)}%` }}
                  />
                </div>
              </div>

              <div className="bg-black/15 backdrop-blur-sm rounded-xl p-3.5">
                <div className="flex items-center justify-between">
                  <span className="text-white/70 text-xs block">Running Meal Rate</span>
                  {isRateVolatile && (
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-white/25 text-white uppercase tracking-wider">
                      Provisional
                    </span>
                  )}
                </div>
                <span className="font-display font-extrabold text-xl text-white block mt-1">
                  ৳ {calculation?.mealRate.toFixed(2) || '0.00'}
                </span>
                <span className="text-[11px] text-white/80 block mt-2">
                  {isRateVolatile
                    ? 'Early cycle — rate will stabilize as meals are logged'
                    : `Total Expenses: ৳${calculation?.totalExpenses.toFixed(0) || '0'}`}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="grid grid-cols-2 gap-3 mt-6 z-10">
            <button
              type="button"
              onClick={onOpenDepositModal}
              className="h-12 bg-white text-terracotta font-bold text-xs sm:text-sm rounded-button flex items-center justify-center gap-1.5 shadow-level1 hover:bg-slate-50 transition-all tactile-btn"
            >
              <PlusCircle className="w-4 h-4" />
              Top Up Deposit
            </button>
            <button
              type="button"
              onClick={onNavigateToAccount}
              className="h-12 bg-white/15 hover:bg-white/25 text-white border border-white/30 font-bold text-xs sm:text-sm rounded-button flex items-center justify-center gap-1.5 transition-all tactile-btn"
            >
              <History className="w-4 h-4" />
              Meal History
            </button>
          </div>
        </section>

        {/* Right: Today's Meal Status (7 Cols) */}
        <section className="lg:col-span-7 bg-white rounded-card p-6 border border-slate-border shadow-level1 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-slate-border/50">
              <div>
                <h2 className="font-display font-bold text-lg text-slate-deep">
                  Today's Dining Sessions
                </h2>
                <p className="text-xs text-slate-muted mt-0.5">
                  Toggle your bookings before the respective cutoff times
                </p>
              </div>
              <button
                type="button"
                onClick={fetchData}
                title="Refresh live status"
                className="p-2 text-slate-muted hover:text-slate-deep rounded-full hover:bg-canvas-tint transition-colors"
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              </button>
            </div>

            {/* Session Meal Cards */}
            {isLoading ? (
              <div className="space-y-4 mt-4">
                {[...Array(activeSessions.length || 3)].map((_, i) => (
                  <Skeleton key={i} variant="rectangular" height={110} />
                ))}
              </div>
            ) : activeSessions.length === 0 ? (
              <div className="p-8 text-center text-slate-muted bg-canvas-tint/40 rounded-card border border-dashed border-slate-border mt-4">
                <p className="font-semibold text-slate-deep">No dining sessions currently enabled.</p>
                <p className="text-xs mt-1">Please check with your mess manager or dining rules settings.</p>
              </div>
            ) : (
              <div className="space-y-4 mt-4">
                {activeSessions.map((sessionConfig) => {
                  const sessionKey = sessionConfig.session as 'BREAKFAST' | 'LUNCH' | 'DINNER';
                  const titleCaseName = (sessionConfig.session.charAt(0) +
                    sessionConfig.session.slice(1).toLowerCase()) as
                    | 'Breakfast'
                    | 'Lunch'
                    | 'Dinner';

                  const scheduledItem = getMenuItem(sessionKey);
                  const isCutoff = isSessionCutoffPassed(sessionConfig.cutoffTime, todayStr);

                  return (
                    <MealToggleCard
                      key={sessionConfig.session}
                      sessionName={titleCaseName}
                      unitValue={sessionConfig.unitValue}
                      timeRange={formatServingWindow(
                        sessionConfig.servingStartTime,
                        sessionConfig.servingEndTime,
                        sessionConfig.session
                      )}
                      cutoffTime={formatTime12h(sessionConfig.cutoffTime)}
                      isMealOn={isSessionOn(sessionKey)}
                      onToggleMeal={(isOn) => handleToggleMeal(sessionKey, isOn)}
                      guestCount={guestCounts[sessionKey] || 0}
                      onGuestCountChange={(c) =>
                        setGuestCounts((prev) => ({ ...prev, [sessionKey]: c }))
                      }
                      notes={notes[sessionKey] || ''}
                      onNotesChange={(n) =>
                        setNotes((prev) => ({ ...prev, [sessionKey]: n }))
                      }
                      menuItemName={scheduledItem ? scheduledItem.itemName : 'No dish scheduled yet'}
                      dietaryTags={scheduledItem?.dietaryTags || []}
                      disabled={isCutoff}
                    />
                  );
                })}
              </div>
            )}
          </div>

          <div className="mt-6 pt-4 border-t border-slate-border/50 flex items-center justify-between text-xs text-slate-muted">
            <span>Missed a cutoff? Contact hall manager.</span>
            <button
              type="button"
              onClick={onNavigateToCalendar}
              className="text-terracotta font-bold hover:underline"
            >
              Multi-Day Calendar →
            </button>
          </div>
        </section>
      </div>
    </div>
  );
};
