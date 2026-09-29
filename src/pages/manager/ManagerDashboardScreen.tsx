import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  DollarSign,
  TrendingUp,
  Calendar,
  AlertCircle,
  CreditCard,
  PlusCircle,
  Receipt,
  Users,
  Utensils,
  ChevronRight,
  Sparkles,
  RefreshCw,
  Clock,
  CheckCircle2,
  Copy,
  Check,
  ChefHat,
  Sunrise,
  SunMedium,
  Moon,
  ExternalLink,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../api/client';
import type {
  ActiveCycleDto,
  CalculationPreviewDto,
  DepositDto,
  ExpenseDto,
  DiningConfigDto,
  ChefDailyHeadcountResponse,
  MealSession,
} from '../../types';
import { Card, StatCard, Button, Alert, Skeleton, Badge } from '../../components/common';
import type { ManagerTab } from '../../components/layout/ManagerLayout';
import { getTodayDhaka, getTomorrowDhaka } from '../../utils/dhakaDate';
import { getActiveSessionList, isSessionCutoffPassed } from '../../utils/sessionUtils';

interface ManagerDashboardScreenProps {
  onNavigateTab: (tab: ManagerTab) => void;
  onOpenAddExpenseModal?: () => void;
  onSwitchToChefView?: () => void;
}

export const ManagerDashboardScreen: React.FC<ManagerDashboardScreenProps> = ({
  onNavigateTab,
  onOpenAddExpenseModal,
  onSwitchToChefView,
}) => {
  const { activeMembership } = useAuth();
  const [activeCycle, setActiveCycle] = useState<ActiveCycleDto | null>(null);
  const [calculation, setCalculation] = useState<CalculationPreviewDto | null>(null);
  const [pendingDeposits, setPendingDeposits] = useState<DepositDto[]>([]);
  const [recentExpenses, setRecentExpenses] = useState<ExpenseDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);

  // Meals to Prepare state (synchronized with Chef Kitchen Prep Terminal)
  const [headcountDate, setHeadcountDate] = useState<string>(getTodayDhaka());
  const [headcountData, setHeadcountData] = useState<ChefDailyHeadcountResponse | null>(null);
  const [diningConfig, setDiningConfig] = useState<DiningConfigDto | null>(null);
  const [headcountLoading, setHeadcountLoading] = useState<boolean>(true);
  const [headcountError, setHeadcountError] = useState<string | null>(null);

  useEffect(() => {
    fetchDashboardData();
  }, [activeMembership?.messId]);

  const fetchHeadcountData = useCallback(async (dateToFetch: string) => {
    if (!activeMembership?.messId) return;
    setHeadcountLoading(true);
    setHeadcountError(null);
    try {
      const res = await api.get<ChefDailyHeadcountResponse>(
        `/chef/headcount?messId=${activeMembership.messId}&date=${dateToFetch}`
      );
      setHeadcountData(res);
    } catch (err: any) {
      console.error('Failed to load meals to prepare headcount:', err);
      setHeadcountError(err.message || 'Unable to retrieve kitchen prep headcount.');
    } finally {
      setHeadcountLoading(false);
    }
  }, [activeMembership?.messId]);

  // Initial fetch and 60-second auto-refresh for Meals to Prepare
  useEffect(() => {
    fetchHeadcountData(headcountDate);
    const interval = setInterval(() => {
      fetchHeadcountData(headcountDate);
    }, 60 * 1000);
    return () => clearInterval(interval);
  }, [headcountDate, fetchHeadcountData]);

  const fetchDashboardData = async () => {
    if (!activeMembership?.messId) return;
    setIsLoading(true);
    setError(null);
    try {
      // 1. Active Cycle
      const cycleData = await api.get<ActiveCycleDto>(
        `/cycles/active?messId=${activeMembership.messId}`
      );
      setActiveCycle(cycleData);

      // 2. Calculation preview
      const calcData = await api.get<CalculationPreviewDto>(
        `/calculations/preview?messId=${activeMembership.messId}`
      );
      setCalculation(calcData);

      // 3. Deposits list
      const depositsData = await api.get<DepositDto[]>(
        `/deposits?messId=${activeMembership.messId}`
      );
      setPendingDeposits(depositsData.filter((d) => d.status === 'PENDING'));

      // 4. Expenses list
      const expensesData = await api.get<ExpenseDto[]>(
        `/expenses?messId=${activeMembership.messId}`
      );
      setRecentExpenses(expensesData.slice(0, 5));

      // 5. Dining Configuration for active meal session definitions
      try {
        const configData = await api.get<DiningConfigDto>(
          `/messes/${activeMembership.messId}/config`
        );
        setDiningConfig(configData);
      } catch {
        // Fallback to default sessions
      }
    } catch (err: any) {
      console.error('Failed to load manager dashboard:', err);
      setError(err.message || 'Unable to load dashboard data');
    } finally {
      setIsLoading(false);
    }
  };

  // Active dining sessions from mess configuration (hides disabled sessions like Breakfast off)
  const activeSessions = useMemo(() => {
    return getActiveSessionList(diningConfig);
  }, [diningConfig]);

  const todayStr = getTodayDhaka();
  const tomorrowStr = getTomorrowDhaka();
  const isToday = headcountDate === todayStr;

  // Compute delinquent members
  const delinquentMembers = React.useMemo(() => {
    if (!calculation?.memberSummaries) return [];
    return calculation.memberSummaries.filter((m) => m.hasNegativeBalance);
  }, [calculation]);

  // Total deposits collected across members
  const totalDepositsCollected = React.useMemo(() => {
    if (!calculation?.memberSummaries) return 0;
    return calculation.memberSummaries.reduce((sum, m) => sum + m.totalDeposits, 0);
  }, [calculation]);

  // Net treasury balance
  const netTreasury = totalDepositsCollected - (calculation?.totalExpenses || 0);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-terracotta via-coral to-terracotta-dark rounded-card p-6 sm:p-8 text-white shadow-level2 relative overflow-hidden">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-48 h-48 bg-white/10 rounded-full blur-2xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 text-white text-xs font-bold tracking-wide backdrop-blur-sm mb-3">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Mess Management Operations</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-display font-extrabold tracking-tight">
              {activeMembership?.messName || 'Dining Management Console'}
            </h1>
            <p className="text-white/90 text-sm mt-1 max-w-2xl leading-relaxed">
              Real-time oversight of dining cycles, active culinary expenses, student deposits, and
              automated meal-rate calculations.
            </p>
            {activeMembership?.mealCode && (
              <div className="mt-3.5 flex items-center gap-2.5 flex-wrap">
                <span className="text-xs font-semibold text-white/90 uppercase tracking-wider">Join Code:</span>
                <span className="font-mono font-black text-sm tracking-widest bg-white/20 backdrop-blur-sm px-3 py-1 rounded-lg text-white border border-white/40 shadow-sm select-all">
                  {activeMembership.mealCode}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(activeMembership.mealCode || '');
                    setCopiedCode(true);
                    setTimeout(() => setCopiedCode(false), 2000);
                  }}
                  className="inline-flex items-center gap-1.5 text-xs bg-white text-terracotta-dark font-bold px-3 py-1 rounded-lg hover:bg-white/95 transition-all shadow-subtle cursor-pointer active:scale-95"
                >
                  {copiedCode ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="text-emerald-700">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy Code</span>
                    </>
                  )}
                </button>
                <span className="text-[11px] text-white/75 hidden sm:inline ml-1">
                  (Share this code with students to let them join)
                </span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <Button
              variant="outline"
              size="sm"
              onClick={fetchDashboardData}
              isLoading={isLoading}
              className="bg-white/10 border-white/30 text-white hover:bg-white/20 hover:text-white"
            >
              <RefreshCw className="w-4 h-4 mr-1.5" />
              Refresh
            </Button>
            {onOpenAddExpenseModal ? (
              <Button
                variant="secondary"
                size="sm"
                onClick={onOpenAddExpenseModal}
                className="bg-white text-terracotta-dark hover:bg-white/95 shadow-subtle"
              >
                <PlusCircle className="w-4 h-4 mr-1.5" />
                Add Expense
              </Button>
            ) : (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => onNavigateTab('expenses')}
                className="bg-white text-terracotta-dark hover:bg-white/95 shadow-subtle"
              >
                <PlusCircle className="w-4 h-4 mr-1.5" />
                Add Expense
              </Button>
            )}
          </div>
        </div>
      </div>

      {error && (
        <Alert type="error" title="Dashboard Error" onDismiss={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Urgent Operational Alerts */}
      <div className="space-y-3">
        {activeCycle?.status === 'EXPIRING' && (
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-card p-4 flex items-center justify-between gap-4 shadow-subtle">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-button bg-amber-500/20 flex items-center justify-center text-amber-700 shrink-0">
                <Calendar className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-amber-900">
                  Meal Cycle #{activeCycle.cycleNumber} is Ending Soon (Scheduled: {activeCycle.scheduledEndDate})
                </h4>
                <p className="text-xs text-amber-700 mt-0.5">
                  Day {activeCycle.countedActiveDays} of {activeCycle.targetActiveDays}. Review expenses and member balances before settlement.
                </p>
              </div>
            </div>
            <Button
              variant="primary"
              size="sm"
              onClick={() => onNavigateTab('settings')}
              className="shrink-0 bg-amber-600 hover:bg-amber-700 text-white"
            >
              Manage Cycle
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        )}

        {activeCycle?.status === 'COMPLETED' && (
          <div className="bg-blue-50 border border-blue-200 rounded-card p-4 flex items-center justify-between gap-4 shadow-subtle">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-button bg-blue-100 flex items-center justify-center text-blue-700 shrink-0">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-blue-900">
                  Meal Cycle #{activeCycle.cycleNumber} Completed
                </h4>
                <p className="text-xs text-blue-700 mt-0.5">
                  Target active days reached ({activeCycle.countedActiveDays}/{activeCycle.targetActiveDays} days). Start a new cycle in Settings when ready.
                </p>
              </div>
            </div>
            <Button
              variant="primary"
              size="sm"
              onClick={() => onNavigateTab('settings')}
              className="shrink-0"
            >
              Cycle Settings
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        )}
        {pendingDeposits.length > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-card p-4 flex items-center justify-between gap-4 shadow-subtle">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-button bg-amber-100 flex items-center justify-center text-amber-800 shrink-0">
                <CreditCard className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-amber-900">
                  {pendingDeposits.length} Student Deposit{pendingDeposits.length > 1 ? 's' : ''} Awaiting Review
                </h4>
                <p className="text-xs text-amber-700 mt-0.5">
                  Verify transaction slips and credit member balances before cycle settlement.
                </p>
              </div>
            </div>
            <Button
              variant="primary"
              size="sm"
              onClick={() => onNavigateTab('deposits')}
              className="shrink-0"
            >
              Review Now
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        )}

        {delinquentMembers.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-card p-4 flex items-center justify-between gap-4 shadow-subtle">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-button bg-red-100 flex items-center justify-center text-red-700 shrink-0">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-red-900">
                  {delinquentMembers.length} Member{delinquentMembers.length > 1 ? 's' : ''} with Negative Balance
                </h4>
                <p className="text-xs text-red-700 mt-0.5">
                  Meal consumption has exceeded advance deposits for these members.
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onNavigateTab('members')}
              className="shrink-0 border-red-300 text-red-700 hover:bg-red-100"
            >
              View Delinquent Members
            </Button>
          </div>
        )}
      </div>

      {/* Meals to Prepare Overview Card (Synchronized with Chef Terminal) */}
      <div className="bg-white rounded-card border border-slate-border shadow-level1 p-5 sm:p-6 space-y-4">
        {/* Card Header & Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-700 shrink-0">
              <ChefHat className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-display font-extrabold text-lg text-slate-deep">
                  Meals to Prepare
                </h3>
                <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-canvas-tint text-slate-muted border border-slate-border">
                  <Clock className="w-3 h-3 text-terracotta" />
                  Synced with Kitchen Terminal
                </span>
              </div>
              <p className="text-xs text-slate-muted font-medium mt-0.5">
                Live portion requirements for active meal sessions based on member bookings and mess defaults
              </p>
            </div>
          </div>

          {/* Controls: Date toggle, Manual Refresh, and Link to Chef Terminal */}
          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap justify-between sm:justify-end">
            {/* Today / Tomorrow Toggle (using dhakaDate.ts) */}
            <div className="inline-flex items-center bg-canvas-tint p-1 rounded-input border border-slate-border/80">
              <button
                type="button"
                onClick={() => setHeadcountDate(todayStr)}
                className={`px-3 py-1 text-xs font-bold rounded transition-all ${
                  isToday
                    ? 'bg-white text-slate-deep shadow-subtle'
                    : 'text-slate-muted hover:text-slate-deep'
                }`}
              >
                Today
              </button>
              <button
                type="button"
                onClick={() => setHeadcountDate(tomorrowStr)}
                className={`px-3 py-1 text-xs font-bold rounded transition-all ${
                  !isToday
                    ? 'bg-white text-slate-deep shadow-subtle'
                    : 'text-slate-muted hover:text-slate-deep'
                }`}
              >
                Tomorrow
              </button>
            </div>

            {/* Manual Refresh Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchHeadcountData(headcountDate)}
              disabled={headcountLoading}
              icon={<RefreshCw className={`w-3.5 h-3.5 ${headcountLoading ? 'animate-spin' : ''}`} />}
              title="Refresh kitchen prep counts"
            />

            {/* Open Kitchen Terminal Link */}
            {onSwitchToChefView && (
              <Button
                variant="outline"
                size="sm"
                onClick={onSwitchToChefView}
                icon={<ExternalLink className="w-3.5 h-3.5 text-slate-muted" />}
                className="border-slate-border text-slate-deep hover:bg-canvas-tint"
              >
                Open Kitchen Terminal
              </Button>
            )}
          </div>
        </div>

        {/* Content Area: Error vs Loading vs Active Sessions */}
        {headcountError ? (
          <Alert type="error" onDismiss={() => setHeadcountError(null)}>
            {headcountError}
          </Alert>
        ) : headcountLoading && !headcountData ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2].map((i) => (
              <div key={i} className="p-4 rounded-card border border-slate-border bg-canvas-tint/30 space-y-3">
                <Skeleton className="h-5 w-1/3" />
                <Skeleton className="h-8 w-1/2" />
                <Skeleton className="h-4 w-2/3" />
              </div>
            ))}
          </div>
        ) : activeSessions.length === 0 ? (
          <div className="py-6 text-center text-xs text-slate-muted">
            No active meal sessions enabled in dining configuration.
          </div>
        ) : (
          <div className={`grid gap-4 ${
            activeSessions.length === 1
              ? 'grid-cols-1'
              : activeSessions.length === 2
              ? 'grid-cols-1 sm:grid-cols-2'
              : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
          }`}>
            {activeSessions.map((sessionMeta) => {
              const sessionData = headcountData?.sessions.find((s) => s.session === sessionMeta.session);
              const totalPortions = sessionData?.totalHeadcount ?? 0;
              const regularCount = sessionData?.studentOnCount ?? 0;
              const guestCount = sessionData?.guestMealCount ?? 0;
              const isFinal = isSessionCutoffPassed(sessionMeta.cutoffTime, headcountDate);

              const getSessionIcon = (session: MealSession) => {
                switch (session) {
                  case 'BREAKFAST':
                    return <Sunrise className="w-4 h-4 text-amber-500" />;
                  case 'LUNCH':
                    return <SunMedium className="w-4 h-4 text-orange-500" />;
                  case 'DINNER':
                    return <Moon className="w-4 h-4 text-indigo-500" />;
                }
              };

              return (
                <div
                  key={sessionMeta.session}
                  className="p-4 rounded-card border border-slate-border bg-canvas-tint/20 hover:border-slate-border/80 transition-all flex flex-col justify-between"
                >
                  {/* Top: Session Title & Cutoff Status Badge */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-white border border-slate-border flex items-center justify-center shadow-subtle shrink-0">
                        {getSessionIcon(sessionMeta.session)}
                      </div>
                      <div>
                        <span className="font-display font-extrabold text-sm text-slate-deep block leading-tight">
                          {sessionMeta.label}
                        </span>
                        <span className="text-[11px] text-slate-muted block leading-none mt-0.5">
                          {sessionMeta.timeRange}
                        </span>
                      </div>
                    </div>

                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                        isFinal
                          ? 'bg-slate-100 text-slate-700 border-slate-200'
                          : 'bg-amber-50 text-amber-800 border-amber-200'
                      }`}
                      title={
                        isFinal
                          ? `Cutoff passed (${sessionMeta.cutoffTime})`
                          : `Cutoff pending (${sessionMeta.cutoffTime})`
                      }
                    >
                      {isFinal ? 'Final' : 'So far'}
                    </span>
                  </div>

                  {/* Middle: Portion count (plain 0 if 0 portions) */}
                  <div className="my-1">
                    <div className="flex items-baseline gap-1.5">
                      <span className="font-display font-black text-3xl text-slate-deep tracking-tight">
                        {totalPortions}
                      </span>
                      <span className="text-xs font-semibold text-slate-muted">
                        {totalPortions === 1 ? 'portion' : 'portions'}
                      </span>
                    </div>

                    <p className="text-xs text-slate-muted mt-1 font-medium">
                      {regularCount} regular + {guestCount} guest
                    </p>
                  </div>

                  {/* Bottom: Scheduled Dish */}
                  <div className="mt-3 pt-2.5 border-t border-slate-border/50 text-[11px] text-slate-muted flex items-center justify-between gap-2">
                    <span className="truncate">
                      {sessionData?.menuItemName ? (
                        <span className="font-semibold text-slate-deep">
                          🍲 {sessionData.menuItemName}
                        </span>
                      ) : (
                        <span className="italic">No specific dish scheduled</span>
                      )}
                    </span>
                    <span className="text-[10px] text-slate-muted shrink-0">
                      Cutoff: {sessionMeta.cutoffTime}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Top Financial & Cycle Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <StatCard
          label="Cycle Progression"
          value={
            activeCycle
              ? `Day ${activeCycle.countedActiveDays} of ${activeCycle.targetActiveDays}`
              : 'Day —'
          }
          subtitle={
            activeCycle?.scheduledEndDate
              ? `Scheduled End: ${activeCycle.scheduledEndDate}`
              : 'Active Cycle'
          }
          icon={<Calendar className="w-5 h-5 text-terracotta" />}
          iconBg="terracotta"
          capacityPercentage={
            activeCycle && activeCycle.targetActiveDays > 0
              ? Math.round(((activeCycle.countedActiveDays / activeCycle.targetActiveDays) * 100) * 10) / 10
              : 0
          }
          capacityLabel="Cycle Progress"
        />

        <StatCard
          label="Total Cycle Expenses"
          value={
            calculation?.totalExpenses !== undefined
              ? `৳${calculation.totalExpenses.toLocaleString('en-US', { minimumFractionDigits: 2 })}`
              : '৳0.00'
          }
          subtitle={`${recentExpenses.length} recorded purchases`}
          icon={<Receipt className="w-5 h-5 text-coral" />}
          iconBg="coral"
        />

        <StatCard
          label={calculation?.isRateVolatile ? "Current Meal Rate (Provisional)" : "Current Meal Rate"}
          value={
            calculation?.mealRate !== undefined
              ? `৳${calculation.mealRate.toFixed(2)}`
              : '৳0.00'
          }
          subtitle={
            calculation?.isRateVolatile
              ? `Provisional (${calculation?.totalCountedUnits || 0} meals logged — early cycle)`
              : `Across ${calculation?.totalCountedUnits || 0} meal units`
          }
          icon={<TrendingUp className="w-5 h-5 text-sage" />}
          iconBg="sage"
        />

        <StatCard
          label="Treasury Balance"
          value={`৳${netTreasury.toLocaleString('en-US', { minimumFractionDigits: 2 })}`}
          subtitle={
            netTreasury >= 0
              ? `৳${totalDepositsCollected.toLocaleString()} in deposits`
              : 'Deficit Alert'
          }
          icon={<DollarSign className="w-5 h-5 text-terracotta" />}
          iconBg="terracotta"
        />
      </div>

      {/* Cycle Status & Paused Days Summary */}
      {activeCycle && (
        <Card className="p-6 border border-slate-border shadow-subtle">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-border">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-display font-bold text-lg text-slate-deep">
                  Active Dining Cycle #{activeCycle.cycleNumber}
                </h3>
                <Badge variant="success" size="sm">
                  {activeCycle.status}
                </Badge>
              </div>
              <p className="text-xs text-slate-muted mt-0.5">
                Started on {activeCycle.startDate} • Target 30 active dining days
              </p>
            </div>

            <div className="flex items-center gap-2.5">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onNavigateTab('settings')}
              >
                Pause a Day / Holiday
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => onNavigateTab('settings')}
              >
                Cycle Calculation & Close
              </Button>
            </div>
          </div>

          <div className="pt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-3.5 rounded-button bg-canvas-tint/70 border border-slate-border/70">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-deep">
                <CheckCircle2 className="w-4 h-4 text-sage" />
                <span>Counted Active Days</span>
              </div>
              <p className="text-xl font-display font-extrabold text-slate-deep mt-1">
                {activeCycle.countedActiveDays}{' '}
                <span className="text-xs font-medium text-slate-muted">/ 30 days</span>
              </p>
            </div>

            <div className="p-3.5 rounded-button bg-canvas-tint/70 border border-slate-border/70">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-deep">
                <Clock className="w-4 h-4 text-terracotta" />
                <span>Paused Holidays</span>
              </div>
              <p className="text-xl font-display font-extrabold text-slate-deep mt-1">
                {activeCycle.pausedDays?.length || 0}{' '}
                <span className="text-xs font-medium text-slate-muted">
                  days auto-extended
                </span>
              </p>
            </div>

            <div className="p-3.5 rounded-button bg-canvas-tint/70 border border-slate-border/70">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-deep">
                <Calendar className="w-4 h-4 text-coral" />
                <span>Adjusted End Date</span>
              </div>
              <p className="text-xl font-display font-extrabold text-slate-deep mt-1">
                {activeCycle.scheduledEndDate}
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Quick Launchpad Action Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <button
          onClick={() => onNavigateTab('expenses')}
          className="p-5 rounded-card bg-white border border-slate-border hover:border-terracotta shadow-subtle hover:shadow-card transition-all text-left group tactile-btn"
        >
          <div className="w-10 h-10 rounded-button bg-terracotta-container/60 text-terracotta flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
            <Receipt className="w-5 h-5" />
          </div>
          <h4 className="font-display font-bold text-slate-deep text-base group-hover:text-terracotta transition-colors">
            Manage Expenses
          </h4>
          <p className="text-xs text-slate-muted mt-1 leading-relaxed">
            Record groceries, kitchen utilities, chef compensation, and category breakdowns.
          </p>
        </button>

        <button
          onClick={() => onNavigateTab('deposits')}
          className="p-5 rounded-card bg-white border border-slate-border hover:border-terracotta shadow-subtle hover:shadow-card transition-all text-left group tactile-btn"
        >
          <div className="w-10 h-10 rounded-button bg-sage-container/60 text-sage-dark flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
            <CreditCard className="w-5 h-5" />
          </div>
          <h4 className="font-display font-bold text-slate-deep text-base group-hover:text-terracotta transition-colors">
            Approve Deposits
          </h4>
          <p className="text-xs text-slate-muted mt-1 leading-relaxed">
            Verify student bKash/Nagad transactions and credit balance ledgers instantly.
          </p>
        </button>

        <button
          onClick={() => onNavigateTab('members')}
          className="p-5 rounded-card bg-white border border-slate-border hover:border-terracotta shadow-subtle hover:shadow-card transition-all text-left group tactile-btn"
        >
          <div className="w-10 h-10 rounded-button bg-amber-100 text-amber-800 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
            <Users className="w-5 h-5" />
          </div>
          <h4 className="font-display font-bold text-slate-deep text-base group-hover:text-terracotta transition-colors">
            Member Roster & Roles
          </h4>
          <p className="text-xs text-slate-muted mt-1 leading-relaxed">
            Promote co-managers, audit running balances, and manage mid-cycle memberships.
          </p>
        </button>

        <button
          onClick={() => onNavigateTab('menu-planner')}
          className="p-5 rounded-card bg-white border border-slate-border hover:border-terracotta shadow-subtle hover:shadow-card transition-all text-left group tactile-btn"
        >
          <div className="w-10 h-10 rounded-button bg-indigo-100 text-indigo-800 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
            <Utensils className="w-5 h-5" />
          </div>
          <h4 className="font-display font-bold text-slate-deep text-base group-hover:text-terracotta transition-colors">
            Weekly Menu Planner
          </h4>
          <p className="text-xs text-slate-muted mt-1 leading-relaxed">
            Curate daily dishes for Breakfast, Lunch, and Dinner with culinary dietary tags.
          </p>
        </button>
      </div>

      {/* Recent Expenses List Preview */}
      <Card className="p-6 border border-slate-border shadow-subtle">
        <div className="flex items-center justify-between pb-4 border-b border-slate-border">
          <div>
            <h3 className="font-display font-bold text-slate-deep text-lg">
              Recent Recorded Expenses
            </h3>
            <p className="text-xs text-slate-muted mt-0.5">
              Latest procurement and kitchen operational costs
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onNavigateTab('expenses')}
            className="text-terracotta hover:text-terracotta-dark"
          >
            View All
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </div>

        <div className="divide-y divide-slate-border">
          {isLoading ? (
            <div className="py-8 space-y-3">
              <Skeleton className="h-6 w-full" />
              <Skeleton className="h-6 w-3/4" />
            </div>
          ) : recentExpenses.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-muted">
              No expenses recorded for this cycle yet.
            </div>
          ) : (
            recentExpenses.map((exp) => (
              <div
                key={exp.id}
                className="py-3.5 flex items-center justify-between gap-4 text-xs"
              >
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-deep text-sm">{exp.title}</span>
                    <Badge variant="neutral" size="sm">
                      {exp.category}
                    </Badge>
                  </div>
                  <p className="text-[11px] text-slate-muted">
                    {exp.expenseDate} • Recorded by {exp.recordedByName}
                    {exp.notes ? ` • ${exp.notes}` : ''}
                  </p>
                </div>
                <div className="font-display font-extrabold text-sm sm:text-base text-slate-deep shrink-0">
                  ৳{exp.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </div>
              </div>
            ))
          )}
        </div>
      </Card>
    </div>
  );
};
