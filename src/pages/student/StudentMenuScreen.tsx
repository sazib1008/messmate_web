import React, { useState, useEffect } from 'react';
import {
  Calendar as CalendarIcon,
  Sparkles,
  Flame,
  Clock,
  ChevronRight,
  Filter,
  CheckCircle2,
  RefreshCw,
  Info,
  UtensilsCrossed,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../api/client';
import { MealSession } from '../../types';
import type { WeeklyMenuDto, DiningConfigDto } from '../../types';
import { getActiveSessionList } from '../../utils/sessionUtils';
import { getDayOfWeekDhaka, getTodayDhaka } from '../../utils/dhakaDate';
import { Card, Badge, Button, Skeleton, Alert } from '../../components/common';
import { clsx } from 'clsx';

const DAYS = [
  { id: 0, label: 'Sunday', short: 'Sun' },
  { id: 1, label: 'Monday', short: 'Mon' },
  { id: 2, label: 'Tuesday', short: 'Tue' },
  { id: 3, label: 'Wednesday', short: 'Wed' },
  { id: 4, label: 'Thursday', short: 'Thu' },
  { id: 5, label: 'Friday', short: 'Fri' },
  { id: 6, label: 'Saturday', short: 'Sat' },
];

interface StudentMenuScreenProps {
  onNavigateToCalendar?: () => void;
}

export const StudentMenuScreen: React.FC<StudentMenuScreenProps> = ({
  onNavigateToCalendar,
}) => {
  const { activeMembership } = useAuth();
  const [weeklyMenu, setWeeklyMenu] = useState<WeeklyMenuDto | null>(null);
  const [diningConfig, setDiningConfig] = useState<DiningConfigDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Default to today's day of week in Asia/Dhaka (0=Sun…6=Sat)
  const todayDay = getDayOfWeekDhaka();
  const [selectedDay, setSelectedDay] = useState<number>(todayDay);
  const [selectedTagFilter, setSelectedTagFilter] = useState<string>('ALL');
  const [viewMode, setViewMode] = useState<'daily' | 'weekly'>('daily');

  const messId = activeMembership?.messId;

  // Stable ref so the refresh button can call the latest fetch without stale closure
  const fetchWeeklyMenu = React.useCallback(async () => {
    if (!messId) return;
    setLoading(true);
    setError(null);
    try {
      const [menuData, configData] = await Promise.all([
        api.get<WeeklyMenuDto>(`/menus/weekly?messId=${messId}`),
        api.get<DiningConfigDto>(`/messes/${messId}/config`).catch(() => null),
      ]);
      setWeeklyMenu(menuData);
      if (configData) {
        setDiningConfig(configData);
      }
    } catch (err: any) {
      const msg = err?.message || 'Unable to fetch menu schedule';
      console.error('Failed to load menu schedule:', msg);
      if (err?.status === 404 || msg.toLowerCase().includes('no active menu')) {
        setError(null);
      } else {
        setError(msg);
      }
      setWeeklyMenu({
        id: `default-${messId}`,
        title: 'Weekly Culinary Schedule',
        effectiveFrom: getTodayDhaka(),
        items: [],
      });
    } finally {
      setLoading(false);
    }
  }, [messId]);

  const isMenuEmpty = !weeklyMenu || weeklyMenu.items.length === 0;

  // Compute enabled sessions with dynamic serving window times
  const activeSessions = React.useMemo(() => {
    return getActiveSessionList(diningConfig, weeklyMenu?.activeSessions).map((s) => ({
      id: s.id,
      label: s.label,
      timeRange: s.timeRange,
      iconBg:
        s.id === 'BREAKFAST'
          ? 'bg-amber-100 text-amber-800'
          : s.id === 'LUNCH'
          ? 'bg-terracotta-container text-terracotta-dark'
          : 'bg-indigo-100 text-indigo-800',
      iconText: s.iconText,
    }));
  }, [diningConfig, weeklyMenu?.activeSessions]);

  useEffect(() => {
    fetchWeeklyMenu();
  }, [fetchWeeklyMenu]);

  // Extract all unique dietary tags from items
  const allDietaryTags = React.useMemo(() => {
    if (!weeklyMenu?.items) return [];
    const tags = new Set<string>();
    weeklyMenu.items.forEach((item) => {
      item.dietaryTags?.forEach((t) => tags.add(t));
    });
    return Array.from(tags);
  }, [weeklyMenu]);

  // Filter items based on day and selected tag
  const filteredItemsForDay = React.useMemo(() => {
    if (!weeklyMenu?.items) return [];
    return weeklyMenu.items.filter((item) => {
      const matchDay = item.dayOfWeek === selectedDay;
      const matchTag =
        selectedTagFilter === 'ALL' || item.dietaryTags?.includes(selectedTagFilter);
      return matchDay && matchTag;
    });
  }, [weeklyMenu, selectedDay, selectedTagFilter]);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Top Header Card */}
      <div className="bg-gradient-to-r from-terracotta via-coral to-terracotta-dark rounded-card p-6 sm:p-8 text-white shadow-level2 relative overflow-hidden">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-48 h-48 bg-white/10 rounded-full blur-2xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 text-white text-xs font-bold tracking-wide backdrop-blur-sm mb-3">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Campus Dining Board</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-display font-extrabold tracking-tight">
              {weeklyMenu?.title || 'Weekly Culinary Schedule'}
            </h1>
            <p className="text-white/90 text-sm mt-1 max-w-xl leading-relaxed">
              Explore freshly curated meal schedules crafted by our mess chef. Review daily items,
              dietary labels, and planning notes.
            </p>
            {weeklyMenu?.effectiveFrom && (
              <div className="flex items-center gap-2 text-xs text-white/80 font-medium mt-3">
                <CalendarIcon className="w-3.5 h-3.5" />
                <span>Effective from {weeklyMenu.effectiveFrom}</span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={fetchWeeklyMenu}
              isLoading={loading}
              className="bg-white/10 border-white/30 text-white hover:bg-white/20 hover:text-white"
            >
              <RefreshCw className="w-4 h-4 mr-1.5" />
              Refresh
            </Button>
            {onNavigateToCalendar && (
              <Button
                variant="secondary"
                size="sm"
                onClick={onNavigateToCalendar}
                className="bg-white text-terracotta-dark hover:bg-white/95 shadow-subtle"
              >
                Plan Meals
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            )}
          </div>
        </div>
      </div>

      {error && (
        <Alert type="error" title="Menu Schedule Unavailable" onDismiss={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Informative Empty State when no menu items published */}
      {!loading && isMenuEmpty && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-card p-6 sm:p-8 text-center space-y-3 shadow-subtle">
          <div className="w-12 h-12 rounded-full bg-amber-500/20 text-amber-800 flex items-center justify-center mx-auto">
            <UtensilsCrossed className="w-6 h-6" />
          </div>
          <div className="max-w-md mx-auto space-y-1">
            <h3 className="font-display font-bold text-base text-amber-950">
              No Weekly Menu Published Yet
            </h3>
            <p className="text-xs text-amber-900/80 leading-relaxed">
              Your mess manager or chef hasn't finalized the menu schedule for this cycle yet.
              Standard daily meal bookings and meal status toggles are still fully active.
            </p>
          </div>
        </div>
      )}

      {/* Control Strip: View Mode & Dietary Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-3 sm:p-4 rounded-card border border-slate-border shadow-subtle">
        {/* View Switcher: Day-by-Day vs Full Week */}
        <div className="flex items-center gap-1 bg-canvas-tint p-1 rounded-input border border-slate-border/60 shrink-0">
          <button
            onClick={() => setViewMode('daily')}
            className={clsx(
              'px-3.5 py-1.5 rounded-button text-xs font-bold transition-all tactile-btn',
              viewMode === 'daily'
                ? 'bg-white text-slate-deep shadow-subtle'
                : 'text-slate-muted hover:text-slate-deep'
            )}
          >
            Day View
          </button>
          <button
            onClick={() => setViewMode('weekly')}
            className={clsx(
              'px-3.5 py-1.5 rounded-button text-xs font-bold transition-all tactile-btn',
              viewMode === 'weekly'
                ? 'bg-white text-slate-deep shadow-subtle'
                : 'text-slate-muted hover:text-slate-deep'
            )}
          >
            Full Week Table
          </button>
        </div>

        {/* Dietary Tag Filter Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          <span className="text-xs font-bold text-slate-muted flex items-center gap-1 mr-1 shrink-0">
            <Filter className="w-3 h-3" />
            Filter:
          </span>
          <button
            onClick={() => setSelectedTagFilter('ALL')}
            className={clsx(
              'px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-all tactile-btn',
              selectedTagFilter === 'ALL'
                ? 'bg-slate-deep text-white shadow-subtle'
                : 'bg-slate-100 text-slate-muted hover:bg-slate-200'
            )}
          >
            All Items
          </button>
          {allDietaryTags.map((tag) => (
            <button
              key={tag}
              onClick={() => setSelectedTagFilter(tag)}
              className={clsx(
                'px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-all tactile-btn',
                selectedTagFilter === tag
                  ? 'bg-terracotta text-white shadow-subtle'
                  : 'bg-terracotta-container/50 text-terracotta-dark hover:bg-terracotta-container'
              )}
            >
              {tag}
            </button>
          ))}
        </div>
      </div>

      {/* Loading Skeletons */}
      {loading && !weeklyMenu && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="p-6 space-y-4">
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-4 w-48" />
            </Card>
          ))}
        </div>
      )}

      {/* Daily View Mode */}
      {viewMode === 'daily' && !loading && (
        <div className="space-y-6">
          {/* Day of Week Selector Pills */}
          <div className="grid grid-cols-7 gap-2 overflow-x-auto">
            {DAYS.map((day) => {
              const isSelected = selectedDay === day.id;
              const isToday = todayDay === day.id;
              return (
                <button
                  key={day.id}
                  onClick={() => setSelectedDay(day.id)}
                  className={clsx(
                    'flex flex-col items-center py-3 px-2 rounded-card border transition-all duration-150 tactile-btn',
                    isSelected
                      ? 'bg-terracotta text-white border-terracotta shadow-level1 ring-2 ring-terracotta/30'
                      : 'bg-white text-slate-deep border-slate-border hover:border-terracotta/40 hover:bg-canvas-tint'
                  )}
                >
                  <span
                    className={clsx(
                      'text-[10px] uppercase font-bold tracking-wider',
                      isSelected ? 'text-white/80' : 'text-slate-muted'
                    )}
                  >
                    {day.short}
                  </span>
                  <span className="font-display font-extrabold text-sm sm:text-base mt-0.5">
                    {day.label.slice(0, 3)}
                  </span>
                  {isToday && (
                    <span
                      className={clsx(
                        'text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded-full mt-1.5',
                        isSelected
                          ? 'bg-white/20 text-white'
                          : 'bg-sage-container text-sage-dark'
                      )}
                    >
                      Today
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Session Dishes Grid for the Selected Day */}
          {activeSessions.length === 0 ? (
            <Card className="p-8 text-center border border-dashed border-slate-border">
              <p className="text-sm font-semibold text-slate-deep">All dining sessions are currently disabled.</p>
              <p className="text-xs text-slate-muted mt-1">Please contact your mess manager to enable dining sessions.</p>
            </Card>
          ) : (
            <div
              className={clsx(
                'grid gap-6',
                activeSessions.length === 3
                  ? 'grid-cols-1 md:grid-cols-3'
                  : activeSessions.length === 2
                  ? 'grid-cols-1 md:grid-cols-2'
                  : 'grid-cols-1 max-w-xl mx-auto'
              )}
            >
              {activeSessions.map((session) => {
                const sessionItems = filteredItemsForDay.filter(
                  (item) => item.session === session.id
                );

                return (
                  <Card
                    key={session.id}
                    className="p-6 border border-slate-border shadow-subtle hover:shadow-card transition-shadow flex flex-col justify-between"
                  >
                  <div>
                    {/* Session Header */}
                    <div className="flex items-center justify-between pb-4 border-b border-slate-border">
                      <div className="flex items-center gap-2.5">
                        <span className="text-xl" role="img" aria-label={session.label}>
                          {session.iconText}
                        </span>
                        <div>
                          <h3 className="font-display font-bold text-slate-deep text-lg leading-tight">
                            {session.label}
                          </h3>
                          <div className="flex items-center gap-1 text-[11px] text-slate-muted mt-0.5">
                            <Clock className="w-3 h-3 text-slate-muted" />
                            <span>{session.timeRange}</span>
                          </div>
                        </div>
                      </div>
                      <Badge variant="neutral" size="sm">
                        {sessionItems.length} {sessionItems.length === 1 ? 'item' : 'items'}
                      </Badge>
                    </div>

                    {/* Dish Items List */}
                    <div className="py-4 space-y-3.5">
                      {sessionItems.length > 0 ? (
                        sessionItems.map((item) => {
                          const isSpecial =
                            item.dietaryTags?.includes('Chef Special') ||
                            item.category?.toLowerCase() === 'special';

                          return (
                            <div
                              key={item.id}
                              className={clsx(
                                'p-3.5 rounded-button border transition-all',
                                isSpecial
                                  ? 'bg-terracotta-container/30 border-terracotta/40'
                                  : 'bg-canvas-tint/40 border-slate-border/60 hover:bg-canvas-tint/80'
                              )}
                            >
                              <div className="flex items-start justify-between gap-2">
                                <div className="space-y-1">
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <h4 className="font-display font-bold text-sm text-slate-deep">
                                      {item.itemName}
                                    </h4>
                                    {isSpecial && (
                                      <span className="inline-flex items-center gap-0.5 text-[10px] font-extrabold px-1.5 py-0.2 rounded-full bg-terracotta text-white">
                                        <Flame className="w-2.5 h-2.5" />
                                        Special
                                      </span>
                                    )}
                                  </div>
                                  {item.description && (
                                    <p className="text-xs text-slate-muted leading-relaxed">
                                      {item.description}
                                    </p>
                                  )}
                                </div>
                              </div>

                              {/* Tags */}
                              {item.dietaryTags && item.dietaryTags.length > 0 && (
                                <div className="flex items-center gap-1.5 flex-wrap mt-2.5 pt-2 border-t border-slate-border/40">
                                  {item.dietaryTags.map((tag, idx) => (
                                    <span
                                      key={idx}
                                      className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-white text-slate-deep border border-slate-border/80"
                                    >
                                      {tag}
                                    </span>
                                  ))}
                                  {item.category && (
                                    <span className="text-[10px] font-medium text-slate-muted ml-auto">
                                      {item.category}
                                    </span>
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        })
                      ) : (
                        <div className="py-8 text-center bg-canvas-tint/30 rounded-button border border-dashed border-slate-border">
                          <p className="text-xs text-slate-muted font-medium">
                            No menu items scheduled for this session.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Dietary Note */}
                  <div className="pt-3 border-t border-slate-border/50 flex items-center gap-1.5 text-[11px] text-slate-muted">
                    <CheckCircle2 className="w-3.5 h-3.5 text-sage" />
                    <span>Prepared under campus dining hygiene standards</span>
                  </div>
                </Card>
              );
            })}
          </div>
          )}
        </div>
      )}

      {/* Weekly Matrix Table Mode */}
      {viewMode === 'weekly' && !loading && (
        <Card className="overflow-hidden border border-slate-border shadow-subtle">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-canvas-tint/90 border-b border-slate-border text-slate-deep">
                  <th className="p-3 font-display font-bold w-24">Day</th>
                  {activeSessions.map((s) => (
                    <th key={s.id} className="p-3 font-display font-bold">
                      {s.label} ({s.timeRange})
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-border">
                {DAYS.map((day) => {
                  const isToday = todayDay === day.id;
                  const dayItems = weeklyMenu?.items.filter(
                    (i) => i.dayOfWeek === day.id
                  ) || [];

                  const getSessionItemText = (session: MealSession) => {
                    const matched = dayItems.filter((i) => i.session === session);
                    if (matched.length === 0) return '—';
                    return matched.map((i) => i.itemName).join(', ');
                  };

                  return (
                    <tr
                      key={day.id}
                      className={clsx(
                        'transition-colors',
                        isToday ? 'bg-terracotta-container/20 font-medium' : 'hover:bg-canvas-tint/30'
                      )}
                    >
                      <td className="p-3 font-bold text-slate-deep">
                        <div className="flex items-center gap-1.5">
                          <span>{day.label}</span>
                          {isToday && (
                            <span className="text-[9px] uppercase px-1.5 py-0.2 rounded-full bg-terracotta text-white font-extrabold">
                              Today
                            </span>
                          )}
                        </div>
                      </td>
                      {activeSessions.map((s) => (
                        <td key={s.id} className="p-3 text-slate-deep">
                          {getSessionItemText(s.id)}
                        </td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Helpful Policy Callout */}
      <div className="bg-canvas-tint/80 border border-slate-border/80 rounded-card p-4 sm:p-5 flex items-start gap-3.5">
        <Info className="w-5 h-5 text-terracotta shrink-0 mt-0.5" />
        <div className="text-xs text-slate-deep space-y-1">
          <p className="font-bold">Meal Cutoff Notice</p>
          <p className="text-slate-muted leading-relaxed">
            Special culinary items (such as Friday Biryani or Roasts) require ingredient procurement
            several hours in advance. Please ensure your meal toggles and guest meal counts are saved
            prior to daily session cutoffs.
          </p>
        </div>
      </div>
    </div>
  );
};
