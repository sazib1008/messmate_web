import React, { useState, useEffect, useCallback } from 'react';
import {
  UtensilsCrossed,
  Sunrise,
  SunMedium,
  Moon,
  Printer,
  RefreshCw,
  Clock,
  Calendar,
  AlertCircle,
  Users,
  UserCheck,
  ChefHat,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Sparkles,
  Layers,
  PauseCircle
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../api/client';
import {
  Button,
  Card,
  CardContent,
  Badge,
  Alert,
  Skeleton
} from '../../components/common';
import type { ChefDailyHeadcountResponse, ChefSessionHeadcount, MealSession } from '../../types';
import { getTodayDhaka, getTomorrowDhaka, addDays } from '../../utils/dhakaDate';

export interface ChefScreenProps {
  onSwitchToManagerView?: () => void;
  onSwitchToStudentView?: () => void;
  onOpenShowcase?: () => void;
}

export const ChefScreen: React.FC<ChefScreenProps> = ({
  onSwitchToManagerView,
  onSwitchToStudentView,
  onOpenShowcase,
}) => {
  const { user, activeMembership, logout } = useAuth();

  // Date management: always use Asia/Dhaka calendar date (NOT UTC via toISOString)
  // Between 12:00 AM and 6:00 AM Dhaka time, UTC is still the previous calendar day.
  const getTodayIso = () => getTodayDhaka();
  const getTomorrowIso = () => getTomorrowDhaka();

  const [selectedDate, setSelectedDate] = useState<string>(getTodayIso());
  const [headcountData, setHeadcountData] = useState<ChefDailyHeadcountResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState<string>('');
  const [lastRefreshed, setLastRefreshed] = useState<string>('');

  const todayIso = getTodayIso();
  const tomorrowIso = getTomorrowIso();
  const isToday = selectedDate === todayIso;
  const isTomorrow = selectedDate === tomorrowIso;

  // Live digital kitchen clock
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: true,
        })
      );
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch headcount for selected date
  const fetchHeadcount = useCallback(async (dateToFetch: string) => {
    if (!activeMembership?.messId) return;
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const res = await api.get<ChefDailyHeadcountResponse>(
        `/chef/headcount?messId=${activeMembership.messId}&date=${dateToFetch}`
      );
      setHeadcountData(res);
      const now = new Date();
      setLastRefreshed(
        now.toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: true,
        })
      );
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to retrieve kitchen headcount data.');
    } finally {
      setIsLoading(false);
    }
  }, [activeMembership?.messId]);

  useEffect(() => {
    fetchHeadcount(selectedDate);
    // Auto-refresh every 5 minutes for unattended kitchen tablet displays
    const interval = setInterval(() => {
      fetchHeadcount(selectedDate);
    }, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [selectedDate, fetchHeadcount]);

  const handlePrint = () => {
    window.print();
  };

  const handlePrevDay = () => {
    // Use addDays() — avoids new Date('YYYY-MM-DD') UTC-midnight parse shifting the date
    setSelectedDate(addDays(selectedDate, -1));
  };

  const handleNextDay = () => {
    setSelectedDate(addDays(selectedDate, 1));
  };

  // Session details helper
  const getSessionMeta = (session: MealSession) => {
    switch (session) {
      case 'BREAKFAST':
        return {
          title: 'Breakfast Service',
          timing: '07:30 AM – 09:30 AM',
          icon: <Sunrise className="w-6 h-6 text-amber-500" />,
          accentBg: 'bg-amber-500/10 border-amber-500/30 text-amber-700',
          bannerBg: 'from-amber-500/10 to-transparent',
        };
      case 'LUNCH':
        return {
          title: 'Lunch Service',
          timing: '01:00 PM – 03:00 PM',
          icon: <SunMedium className="w-6 h-6 text-orange-500" />,
          accentBg: 'bg-orange-500/10 border-orange-500/30 text-orange-700',
          bannerBg: 'from-orange-500/10 to-transparent',
        };
      case 'DINNER':
        return {
          title: 'Dinner Service',
          timing: '08:00 PM – 10:00 PM',
          icon: <Moon className="w-6 h-6 text-indigo-500" />,
          accentBg: 'bg-indigo-500/10 border-indigo-500/30 text-indigo-700',
          bannerBg: 'from-indigo-500/10 to-transparent',
        };
    }
  };

  const formatServingTime = (start?: string | null, end?: string | null, fallback = '') => {
    if (!start && !end) return fallback;
    const to12h = (t: string) => {
      const parts = t.split(':');
      const h = parseInt(parts[0], 10);
      const m = parseInt(parts[1] || '0', 10);
      if (isNaN(h)) return t;
      const period = h >= 12 ? 'PM' : 'AM';
      const hour = h % 12 || 12;
      return `${hour}:${String(m).padStart(2, '0')} ${period}`;
    };
    if (start && end) return `${to12h(start)} – ${to12h(end)}`;
    if (start) return `Starts at ${to12h(start)}`;
    return `Ends at ${to12h(end!)}`;
  };

  // Format date readable
  const formattedDateTitle = new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  // Filter active enabled sessions
  const activeSessions = (headcountData?.sessions || []).filter(
    (s: ChefSessionHeadcount) => s.isEnabled !== false
  );

  // Calculate totals across active sessions
  const totalMeals = activeSessions.reduce((acc: number, s: ChefSessionHeadcount) => acc + s.totalHeadcount, 0);
  const totalRegular = activeSessions.reduce((acc: number, s: ChefSessionHeadcount) => acc + s.studentOnCount, 0);
  const totalGuests = activeSessions.reduce((acc: number, s: ChefSessionHeadcount) => acc + s.guestMealCount, 0);
  const totalDietaryNotes = activeSessions.reduce((acc: number, s: ChefSessionHeadcount) => acc + s.notes.length, 0);

  return (
    <div className="min-h-screen bg-[#FAF9F5] text-slate-deep font-body selection:bg-terracotta/20 flex flex-col">
      {/* Kitchen Header (Optimized for Large Displays & Thermal Prep Prints) */}
      <header className="bg-white border-b border-slate-border sticky top-0 z-30 shadow-subtle print:hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Brand & Mess Indicator */}
          <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-start">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-terracotta flex items-center justify-center text-white shadow-level1">
                <ChefHat className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="font-display font-extrabold text-lg sm:text-xl text-slate-deep tracking-tight">
                    Kitchen Prep Station
                  </h1>
                  <Badge variant="chef" size="sm">
                    Head Chef
                  </Badge>
                </div>
                <p className="text-xs text-slate-muted font-medium">
                  {headcountData?.messName || activeMembership?.messName || 'Mess Hall Kitchen'}
                </p>
              </div>
            </div>

            {/* Mobile Clock */}
            <div className="sm:hidden font-mono text-xs font-bold text-slate-muted bg-canvas-tint px-2.5 py-1 rounded-lg border border-slate-border">
              {currentTime}
            </div>
          </div>

          {/* Center Digital Clock & Refresh (Desktop) */}
          <div className="hidden sm:flex items-center gap-4 bg-canvas-tint px-4 py-1.5 rounded-card border border-slate-border">
            <div className="flex items-center gap-2 text-slate-deep">
              <Clock className="w-4 h-4 text-terracotta animate-pulse" />
              <span className="font-mono text-sm font-extrabold tracking-wider">{currentTime}</span>
            </div>
            <div className="h-4 w-px bg-slate-border" />
            <div className="text-[11px] text-slate-muted">
              Updated: <span className="font-semibold text-slate-deep">{lastRefreshed || 'Just now'}</span>
            </div>
          </div>

          {/* Right Action Controls */}
          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchHeadcount(selectedDate)}
              icon={<RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />}
              disabled={isLoading}
            >
              Refresh
            </Button>

            <Button
              variant="secondary"
              size="sm"
              onClick={handlePrint}
              icon={<Printer className="w-3.5 h-3.5" />}
              className="bg-slate-deep text-white hover:bg-slate-800"
            >
              Print Prep Sheet
            </Button>

            {onSwitchToManagerView && (
              <Button
                variant="outline"
                size="sm"
                onClick={onSwitchToManagerView}
                icon={<Layers className="w-3.5 h-3.5" />}
                title="Return to Manager Console"
              >
                Manager View
              </Button>
            )}

            {onSwitchToStudentView && (
              <Button
                variant="outline"
                size="sm"
                onClick={onSwitchToStudentView}
                icon={<Users className="w-3.5 h-3.5" />}
                title="View Student Portal"
              >
                Student View
              </Button>
            )}

            <Button
              variant="ghost"
              size="sm"
              onClick={logout}
              icon={<LogOut className="w-3.5 h-3.5 text-slate-muted" />}
              title="Sign Out"
            >
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Printable Header (Visible only when printing) */}
        <div className="hidden print:block mb-6 border-b-2 border-slate-900 pb-4">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-bold font-display uppercase tracking-wider">
                Kitchen Daily Prep Sheet
              </h1>
              <p className="text-sm font-semibold text-slate-700">
                {headcountData?.messName || 'Mess Hall Kitchen'} • Date: {formattedDateTitle}
              </p>
            </div>
            <div className="text-right text-xs text-slate-600">
              <p>Printed: {new Date().toLocaleString()}</p>
              <p>Prepared by: {user?.fullName || 'Head Chef'}</p>
            </div>
          </div>
          <div className={`mt-3 grid gap-2 bg-slate-100 p-2 rounded text-center text-xs font-bold ${
            activeSessions.length === 3 ? 'grid-cols-3' : activeSessions.length === 2 ? 'grid-cols-2' : 'grid-cols-1'
          }`}>
            <div>TOTAL HEADCOUNT: {totalMeals} Meals</div>
            <div>REGULAR: {totalRegular}</div>
            <div>GUESTS: {totalGuests}</div>
          </div>
        </div>

        {/* Date Selector & Kitchen Fast Switcher (Screen only) */}
        <div className="bg-white rounded-card p-3 sm:p-4 border border-slate-border shadow-subtle flex flex-col md:flex-row items-center justify-between gap-4 print:hidden">
          {/* Fast Toggle: Today vs Tomorrow */}
          <div className="flex items-center gap-1.5 w-full md:w-auto bg-canvas-tint p-1 rounded-button border border-slate-border/70">
            <button
              type="button"
              onClick={() => setSelectedDate(todayIso)}
              className={`flex-1 md:flex-none px-4 py-2 rounded-input text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                isToday
                  ? 'bg-terracotta text-white shadow-level1'
                  : 'text-slate-muted hover:text-slate-deep'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              Today's Kitchen Plan
            </button>

            <button
              type="button"
              onClick={() => setSelectedDate(tomorrowIso)}
              className={`flex-1 md:flex-none px-4 py-2 rounded-input text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                isTomorrow
                  ? 'bg-terracotta text-white shadow-level1'
                  : 'text-slate-muted hover:text-slate-deep'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              Tomorrow's Kitchen Plan
            </button>
          </div>

          {/* Stepper Date Picker */}
          <div className="flex items-center gap-2 w-full md:w-auto justify-between md:justify-end">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrevDay}
              icon={<ChevronLeft className="w-4 h-4" />}
            >
              Prev Day
            </Button>

            <div className="flex items-center gap-2 bg-canvas-tint px-3 py-1.5 rounded-input border border-slate-border">
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => {
                  if (e.target.value) setSelectedDate(e.target.value);
                }}
                className="bg-transparent text-xs font-bold text-slate-deep focus:outline-none cursor-pointer"
              />
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={handleNextDay}
              icon={<ChevronRight className="w-4 h-4" />}
              iconPosition="right"
            >
              Next Day
            </Button>
          </div>
        </div>

        {/* Date Display Banner */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-border/70 pb-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-terracotta">
                {isToday ? "Today's Schedule" : isTomorrow ? "Tomorrow's Advance Schedule" : 'Scheduled Kitchen Plan'}
              </span>
              {isToday && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-green-100 text-green-800 animate-pulse">
                  LIVE SHIFT
                </span>
              )}
            </div>
            <h2 className="font-display font-extrabold text-2xl sm:text-3xl text-slate-deep tracking-tight mt-0.5">
              {formattedDateTitle}
            </h2>
          </div>

          {/* Summary Metric Pills for Quick Kitchen Portion Planning */}
          <div className="flex items-center gap-2 flex-wrap print:hidden">
            <div className="bg-white border border-slate-border px-3 py-1.5 rounded-input shadow-subtle">
              <span className="text-[10px] text-slate-muted uppercase font-bold block">Total Servings</span>
              <span className="font-display font-black text-lg text-slate-deep">
                {headcountData?.isPaused ? '0 (Paused)' : totalMeals}
              </span>
            </div>
            <div className="bg-white border border-slate-border px-3 py-1.5 rounded-input shadow-subtle">
              <span className="text-[10px] text-slate-muted uppercase font-bold block">Regular Students</span>
              <span className="font-display font-black text-lg text-terracotta">
                {headcountData?.isPaused ? '0 (Paused)' : totalRegular}
              </span>
            </div>
            <div className="bg-white border border-slate-border px-3 py-1.5 rounded-input shadow-subtle">
              <span className="text-[10px] text-slate-muted uppercase font-bold block">Guest Servings</span>
              <span className="font-display font-black text-lg text-sage">
                {headcountData?.isPaused ? 0 : totalGuests}
              </span>
            </div>
            {totalDietaryNotes > 0 && !headcountData?.isPaused && (
              <div className="bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-input shadow-subtle">
                <span className="text-[10px] text-amber-800 uppercase font-bold block">Special Notes</span>
                <span className="font-display font-black text-lg text-amber-900">{totalDietaryNotes}</span>
              </div>
            )}
          </div>
        </div>

        {errorMsg && (
          <Alert type="error" onDismiss={() => setErrorMsg(null)}>
            {errorMsg}
          </Alert>
        )}

        {/* Mess Paused / Holiday Banner */}
        {headcountData?.isPaused && (
          <div className="bg-amber-50 border-2 border-amber-300 rounded-card p-5 flex items-start gap-4 shadow-subtle">
            <div className="p-3 bg-amber-100 rounded-xl text-amber-800 flex-shrink-0">
              <PauseCircle className="w-8 h-8" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h3 className="font-display font-extrabold text-lg text-amber-900">
                  Mess Paused / Holiday — No Service
                </h3>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-200 text-amber-900">
                  PLANNED CLOSURE
                </span>
              </div>
              <p className="text-xs sm:text-sm text-amber-800 mt-1 font-medium">
                {headcountData.pauseReason
                  ? `Reason: ${headcountData.pauseReason}. Dining operations and meal preps are officially suspended for this date.`
                  : 'A mess holiday or operation pause has been registered by management. No kitchen meal preparation is required.'}
              </p>
            </div>
          </div>
        )}

        {/* Headcount Sessions Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="p-6 space-y-4">
                <Skeleton className="h-8 w-1/3" />
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-16 w-full" />
              </Card>
            ))}
          </div>
        ) : activeSessions.length === 0 ? (
          <Card className="p-12 text-center border border-dashed border-slate-border max-w-xl mx-auto">
            <UtensilsCrossed className="w-12 h-12 text-slate-400 mx-auto mb-3" />
            <h3 className="font-display font-bold text-lg text-slate-deep">No Active Dining Sessions</h3>
            <p className="text-xs sm:text-sm text-slate-muted mt-1">
              All dining sessions are currently disabled for this mess hall. You can configure active sessions in Cycle & Settings.
            </p>
          </Card>
        ) : (
          <div
            className={`grid gap-6 print:grid-cols-1 print:gap-4 ${
              activeSessions.length === 3
                ? 'grid-cols-1 lg:grid-cols-3'
                : activeSessions.length === 2
                ? 'grid-cols-1 lg:grid-cols-2 max-w-5xl mx-auto'
                : 'grid-cols-1 max-w-xl mx-auto'
            }`}
          >
            {activeSessions.map((sessionItem: ChefSessionHeadcount) => {
              const meta = getSessionMeta(sessionItem.session);
              const timingDisplay = formatServingTime(sessionItem.servingStartTime, sessionItem.servingEndTime, meta.timing);
              const hasSpecialNotes = sessionItem.notes && sessionItem.notes.length > 0;

              return (
                <Card
                  key={sessionItem.session}
                  className="overflow-hidden border-2 border-slate-border shadow-subtle hover:shadow-level2 transition-all flex flex-col justify-between print:border-slate-800 print:shadow-none"
                >
                  <div>
                    {/* Session Header */}
                    <div className={`p-4 sm:p-5 border-b border-slate-border flex items-center justify-between bg-gradient-to-r ${meta.bannerBg} print:bg-none print:border-slate-800`}>
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-xl bg-white border border-slate-border/80 shadow-subtle print:border-slate-800">
                          {meta.icon}
                        </div>
                        <div>
                          <h3 className="font-display font-extrabold text-lg text-slate-deep">
                            {meta.title}
                          </h3>
                          <p className="text-xs font-semibold text-slate-muted">
                            {timingDisplay}
                          </p>
                        </div>
                      </div>
                      <Badge variant="neutral" size="sm" className="font-bold uppercase tracking-wider">
                        {sessionItem.session}
                      </Badge>
                    </div>

                    <CardContent className="p-5 sm:p-6 space-y-6">
                      {/* High-Contrast Headcount Hero */}
                      <div className="bg-canvas-tint/70 p-4 sm:p-5 rounded-card border border-slate-border/80 flex items-center justify-between print:bg-slate-50 print:border-slate-800">
                        <div>
                          <span className="text-xs font-bold uppercase tracking-wider text-slate-muted block">
                            Portions to Cook
                          </span>
                          <div className="flex items-baseline gap-2 mt-1">
                            {headcountData?.isPaused || sessionItem.isEnabled === false ? (
                              <div className="flex items-center gap-2">
                                <span className="font-display font-black text-4xl sm:text-5xl text-slate-400 tracking-tight">
                                  0
                                </span>
                                <span className="text-[11px] font-extrabold text-amber-800 bg-amber-100 border border-amber-300 px-2 py-0.5 rounded-full uppercase">
                                  Closed / Paused
                                </span>
                              </div>
                            ) : (
                              <>
                                <span className="font-display font-black text-5xl sm:text-6xl text-slate-deep tracking-tight">
                                  {sessionItem.totalHeadcount}
                                </span>
                                <span className="text-sm font-extrabold text-slate-muted uppercase">
                                  Meals
                                </span>
                              </>
                            )}
                          </div>
                        </div>

                        {/* Breakdown Pills */}
                        <div className="space-y-1.5 text-right">
                          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-white border border-slate-border text-slate-deep shadow-subtle print:border-slate-800">
                            <UserCheck className="w-3.5 h-3.5 text-terracotta" />
                            <span>{headcountData?.isPaused ? 0 : sessionItem.studentOnCount} Regular</span>
                          </div>
                          <br />
                          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-white border border-slate-border text-slate-deep shadow-subtle print:border-slate-800">
                            <Users className="w-3.5 h-3.5 text-sage" />
                            <span>{headcountData?.isPaused ? 0 : sessionItem.guestMealCount} Guests</span>
                          </div>
                        </div>
                      </div>

                      {/* Scheduled Dish to Prepare */}
                      <div className="space-y-2">
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-muted flex items-center gap-1.5">
                          <UtensilsCrossed className="w-3.5 h-3.5 text-terracotta" />
                          <span>Scheduled Dish</span>
                        </span>
                        <div className="p-3.5 rounded-card bg-white border border-slate-border shadow-subtle print:border-slate-800">
                          <h4 className="font-display font-extrabold text-base sm:text-lg text-slate-deep leading-snug">
                            {sessionItem.menuItemName || 'No specific dish entered for this session'}
                          </h4>

                          {/* Dietary Tags */}
                          {sessionItem.dietaryTags && sessionItem.dietaryTags.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 mt-2.5">
                              {sessionItem.dietaryTags.map((tag: string, idx: number) => (
                                <Badge key={idx} variant="dietary" size="sm">
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Aggregated Dietary & Special Prep Notes (No student names) */}
                      <div className="space-y-2">
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-muted flex items-center gap-1.5">
                          <AlertCircle className={`w-3.5 h-3.5 ${hasSpecialNotes ? 'text-amber-600' : 'text-slate-400'}`} />
                          <span>Special Dietary & Prep Requirements</span>
                        </span>

                        {hasSpecialNotes ? (
                          <div className="p-3.5 rounded-card bg-amber-50/80 border border-amber-200/90 space-y-2 print:border-slate-800 print:bg-slate-50">
                            <div className="flex items-center gap-1.5 text-xs font-extrabold text-amber-900">
                              <span>⚠️ {sessionItem.notes.length} Aggregate Kitchen Request{sessionItem.notes.length > 1 ? 's' : ''}:</span>
                            </div>
                            <ul className="space-y-1.5 pl-1">
                              {sessionItem.notes.map((note: string, noteIdx: number) => (
                                <li
                                  key={noteIdx}
                                  className="text-xs font-medium text-amber-950 bg-white/80 px-2.5 py-1.5 rounded-lg border border-amber-200/50 flex items-start gap-1.5"
                                >
                                  <span className="text-amber-600 font-bold">•</span>
                                  <span>{note}</span>
                                </li>
                              ))}
                            </ul>
                            <p className="text-[10px] text-amber-700 italic pt-1">
                              * Notes are aggregated anonymously for kitchen safety.
                            </p>
                          </div>
                        ) : (
                          <div className="p-3 rounded-card bg-canvas-tint/40 border border-slate-border/60 text-xs text-slate-muted italic print:border-slate-800">
                            No special dietary or spice instructions submitted.
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </div>

                  {/* Card Footer with Kitchen Status Checklist */}
                  <div className="p-4 bg-canvas-tint/40 border-t border-slate-border flex items-center justify-between text-xs text-slate-muted print:bg-none print:border-slate-800">
                    <span className="font-semibold">
                      {sessionItem.totalHeadcount === 0 ? 'Kitchen Off / No Orders' : 'Portions Locked for Prep'}
                    </span>
                    <span className="font-mono text-[11px] font-bold">
                      {sessionItem.studentOnCount + sessionItem.guestMealCount} Pax
                    </span>
                  </div>
                </Card>
              );
            })}
          </div>
        )}

        {/* Bottom Operational Guidelines Note */}
        <div className="p-4 rounded-card bg-canvas-tint border border-slate-border text-xs text-slate-muted flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 print:hidden">
          <div className="flex items-center gap-2">
            <ChefHat className="w-4 h-4 text-terracotta shrink-0" />
            <span>
              <strong>Kitchen Policy:</strong> Headcounts update automatically as cutoff times close. No financial records or student identities are revealed on this terminal.
            </span>
          </div>
          {onOpenShowcase && (
            <button
              type="button"
              onClick={onOpenShowcase}
              className="inline-flex items-center gap-1 text-terracotta font-bold text-xs hover:underline shrink-0"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Design System Showcase
            </button>
          )}
        </div>
      </main>
    </div>
  );
};
