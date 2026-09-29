import React, { useState, useEffect } from 'react';
import {
  UtensilsCrossed,
  PlusCircle,
  Trash2,
  Clock,
  Sparkles,
  Sunrise,
  Sun,
  Moon,
  Check,
  Layers,
  Utensils,
  ChevronDown,
  RefreshCw,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../api/client';
import type {
  WeeklyMenuDto,
  MenuItemDto,
  CreateMenuItemRequest,
  DiningConfigDto,
} from '../../types';
import { MealSession } from '../../types';
import { getActiveSessionList } from '../../utils/sessionUtils';
import { getDayOfWeekDhaka } from '../../utils/dhakaDate';
import {
  Card,
  Button,
  Input,
  Modal,
  Alert,
  Skeleton,
} from '../../components/common';
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

const POPULAR_DISH_SUGGESTIONS = [
  { name: 'Egg Khichuri with Chutney', category: 'Main' },
  { name: 'Pabda Fish Curry & Rice', category: 'Main' },
  { name: 'Beef Bhuna with Green Salad', category: 'Main' },
  { name: 'Chicken Roast & Polao', category: 'Main' },
  { name: 'Moong Daal Tadka', category: 'Daal & Lentil' },
  { name: 'Mixed Seasonal Vegetables', category: 'Vegetables & Sides' },
  { name: 'Egg Omelette & Paratha', category: 'Main' },
  { name: 'Shahi Firni', category: 'Dessert' },
];

const PRESET_CATEGORIES = [
  'Main',
  'Rice & Roti',
  'Daal & Lentil',
  'Vegetables & Sides',
  'Dessert',
  'Beverage',
];

const PRESET_DIETARY_TAGS = [
  { label: 'Halal', icon: '🟢' },
  { label: 'Vegetarian', icon: '🥬' },
  { label: 'Spicy', icon: '🌶️' },
  { label: 'Chef Special', icon: '⭐' },
  { label: 'Local Catch', icon: '🐟' },
  { label: 'High Protein', icon: '💪' },
];

const getSessionIcon = (session: MealSession) => {
  switch (session) {
    case MealSession.BREAKFAST:
      return <Sunrise className="w-4 h-4 text-amber-500" />;
    case MealSession.LUNCH:
      return <Sun className="w-4 h-4 text-orange-500" />;
    case MealSession.DINNER:
      return <Moon className="w-4 h-4 text-indigo-500" />;
  }
};

export const ManagerMenuPlannerScreen: React.FC = () => {
  const { activeMembership } = useAuth();
  const [weeklyMenu, setWeeklyMenu] = useState<WeeklyMenuDto | null>(null);
  const [diningConfig, setDiningConfig] = useState<DiningConfigDto | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState<number>(getDayOfWeekDhaka());

  // Modal states for adding dish (Bug 3: Minimal default view with progressive disclosure)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalDay, setModalDay] = useState<number>(selectedDay);
  const [modalSession, setModalSession] = useState<MealSession>(MealSession.LUNCH);
  const [showDaySessionPicker, setShowDaySessionPicker] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [itemName, setItemName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Main');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  useEffect(() => {
    fetchWeeklyMenu();
  }, [activeMembership?.messId]);

  const fetchWeeklyMenu = async () => {
    if (!activeMembership?.messId) return;
    setIsLoading(true);
    try {
      const [menuData, configData] = await Promise.all([
        api.get<WeeklyMenuDto>(`/menus/weekly?messId=${activeMembership.messId}`),
        api.get<DiningConfigDto>(`/messes/${activeMembership.messId}/config`).catch(() => null),
      ]);
      setWeeklyMenu(menuData);
      if (configData) {
        setDiningConfig(configData);
      }
    } catch (err: any) {
      console.error('Failed to load menu:', err);
      setFeedback({
        type: 'error',
        message: err.message || 'Unable to fetch weekly dining schedule',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Derive ONLY active sessions (Bug 1: Inactive sessions excluded)
  const activeSessions = React.useMemo(() => {
    return getActiveSessionList(diningConfig, weeklyMenu?.activeSessions);
  }, [diningConfig, weeklyMenu]);

  // Filter items for selected day, strictly constrained to active sessions
  const itemsForDay = React.useMemo(() => {
    if (!weeklyMenu?.items) return [];
    const activeSessionIds = new Set(activeSessions.map((s) => s.id));
    return weeklyMenu.items.filter(
      (item) => item.dayOfWeek === selectedDay && activeSessionIds.has(item.session)
    );
  }, [weeklyMenu, selectedDay, activeSessions]);

  const openAddDishModal = (session?: MealSession, day?: number) => {
    const targetDay = day !== undefined ? day : selectedDay;
    setModalDay(targetDay);
    if (session && activeSessions.some((s) => s.id === session)) {
      setModalSession(session);
    } else {
      setModalSession(activeSessions[0]?.id || MealSession.LUNCH);
    }
    // Bug 3: Pre-selected defaults, minimal initial fields
    setItemName('');
    setDescription('');
    setCategory('Main');
    setTags([]);
    setTagInput('');
    setShowAdvanced(false);
    setShowDaySessionPicker(false);
    setIsModalOpen(true);
  };

  const handleCreateDish = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeMembership?.messId) return;

    if (!itemName.trim()) {
      setFeedback({ type: 'error', message: 'Please enter a dish name' });
      return;
    }

    setIsSubmitting(true);
    setFeedback(null);
    try {
      const payload: CreateMenuItemRequest = {
        messId: activeMembership.messId,
        dayOfWeek: modalDay,
        session: modalSession,
        itemName: itemName.trim(),
        description: description.trim() || undefined,
        category: category.trim() || 'Main',
        dietaryTags: tags,
      };

      await api.post<MenuItemDto>('/menus/items', payload);

      setFeedback({
        type: 'success',
        message: `Added "${itemName.trim()}" to the schedule!`,
      });

      setIsModalOpen(false);
      setItemName('');
      setDescription('');
      await fetchWeeklyMenu();
    } catch (err: any) {
      console.error('Failed to add dish:', err);
      setFeedback({
        type: 'error',
        message: err.message || 'Failed to add dish to menu',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteDish = async (itemId: string, dishName: string) => {
    if (!confirm(`Are you sure you want to remove "${dishName}" from the menu?`)) {
      return;
    }

    try {
      await api.delete(`/menus/items/${itemId}`);
      setFeedback({
        type: 'success',
        message: `Removed "${dishName}" from the menu.`,
      });
      await fetchWeeklyMenu();
    } catch (err: any) {
      console.error('Failed to delete dish:', err);
      setFeedback({
        type: 'error',
        message: err.message || 'Failed to remove dish',
      });
    }
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-card border border-slate-border shadow-subtle">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-terracotta">
            <UtensilsCrossed className="w-4 h-4" />
            <span>Culinary Operations</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-display font-extrabold text-slate-deep mt-1">
            Weekly Menu Planner
          </h1>
          <p className="text-xs sm:text-sm text-slate-muted mt-0.5">
            Configure rotating meal schedules for your active dining sessions. These items appear
            on student booking cards and chef kitchen rosters.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchWeeklyMenu}
            isLoading={isLoading}
          >
            <RefreshCw className="w-4 h-4 mr-1.5" />
            Refresh
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => openAddDishModal()}
            className="shadow-level1"
          >
            <PlusCircle className="w-4 h-4 mr-1.5" />
            Add Dish to Schedule
          </Button>
        </div>
      </div>

      {feedback && (
        <Alert
          type={feedback.type}
          title={feedback.type === 'success' ? 'Menu Updated' : 'Operation Failed'}
          onDismiss={() => setFeedback(null)}
        >
          {feedback.message}
        </Alert>
      )}

      {/* Day Selector Pills */}
      <div className="grid grid-cols-7 gap-2 overflow-x-auto">
        {DAYS.map((day) => {
          const isSelected = selectedDay === day.id;
          const isToday = getDayOfWeekDhaka() === day.id;
          const activeSessionIds = new Set(activeSessions.map((s) => s.id));
          const itemCount =
            weeklyMenu?.items.filter(
              (i) => i.dayOfWeek === day.id && activeSessionIds.has(i.session)
            ).length || 0;

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
              <div className="flex items-center gap-1 mt-1">
                {isToday && (
                  <span
                    className={clsx(
                      'text-[9px] font-extrabold uppercase px-1 py-0.2 rounded-full',
                      isSelected ? 'bg-white/20 text-white' : 'bg-sage-container text-sage-dark'
                    )}
                  >
                    Today
                  </span>
                )}
                <span
                  className={clsx(
                    'text-[10px] font-semibold',
                    isSelected ? 'text-white/80' : 'text-slate-muted'
                  )}
                >
                  {itemCount} dishes
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Session Dishes Grid for Selected Day (Bug 1 & Bug 2) */}
      {isLoading && activeSessions.length === 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2].map((i) => (
            <Card key={i} className="p-6 space-y-4">
              <Skeleton className="h-6 w-1/3" />
              <Skeleton className="h-20 w-full" />
            </Card>
          ))}
        </div>
      ) : activeSessions.length === 0 ? (
        <Card className="p-8 text-center border border-dashed border-slate-border">
          <UtensilsCrossed className="w-10 h-10 text-slate-400 mx-auto mb-2" />
          <p className="text-sm font-semibold text-slate-deep">All dining sessions are currently disabled.</p>
          <p className="text-xs text-slate-muted mt-1">Enable sessions in Cycle & Settings to schedule weekly dishes.</p>
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
            const sessionDishes = itemsForDay.filter(
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

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openAddDishModal(session.id, selectedDay)}
                      className="p-1.5 text-terracotta hover:bg-terracotta-container/40"
                      title={`Add dish to ${session.label}`}
                    >
                      <PlusCircle className="w-4 h-4" />
                    </Button>
                  </div>

                  {/* Dish List with Explicit Empty State (Bug 2) */}
                  <div className="py-4 space-y-3">
                    {isLoading ? (
                      <div className="space-y-2">
                        <Skeleton className="h-16 w-full" />
                      </div>
                    ) : sessionDishes.length === 0 ? (
                      <div className="py-8 px-4 text-center bg-canvas-tint/40 rounded-xl border border-dashed border-slate-border">
                        <UtensilsCrossed className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                        <p className="text-xs font-semibold text-slate-deep">
                          No dish scheduled yet
                        </p>
                        <p className="text-[11px] text-slate-muted mt-0.5 mb-3">
                          Add a dish for {session.label} on {DAYS.find((d) => d.id === selectedDay)?.label}.
                        </p>
                        <button
                          type="button"
                          onClick={() => openAddDishModal(session.id, selectedDay)}
                          className="inline-flex items-center gap-1.5 text-xs font-bold text-terracotta hover:text-terracotta-dark bg-terracotta-container/40 hover:bg-terracotta-container px-3 py-1.5 rounded-button transition-colors tactile-btn"
                        >
                          <PlusCircle className="w-3.5 h-3.5" />
                          Add dish
                        </button>
                      </div>
                    ) : (
                      sessionDishes.map((dish) => {
                        const isSpecial =
                          dish.dietaryTags?.includes('Chef Special') ||
                          dish.category?.toLowerCase() === 'special';

                        return (
                          <div
                            key={dish.id}
                            className={clsx(
                              'p-3.5 rounded-button border transition-all relative group',
                              isSpecial
                                ? 'bg-terracotta-container/30 border-terracotta/40'
                                : 'bg-canvas-tint/40 border-slate-border/60 hover:bg-canvas-tint/80'
                            )}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <h4 className="font-display font-bold text-sm text-slate-deep">
                                    {dish.itemName}
                                  </h4>
                                  {isSpecial && (
                                    <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-terracotta text-white flex items-center gap-0.5">
                                      <Sparkles className="w-2.5 h-2.5" /> Special
                                    </span>
                                  )}
                                </div>

                                <div className="flex items-center gap-2 mt-1 flex-wrap">
                                  <span className="text-xs font-semibold text-terracotta bg-white px-2 py-0.5 rounded border border-slate-border/60">
                                    {dish.category || 'Main Course'}
                                  </span>

                                  {dish.dietaryTags &&
                                    dish.dietaryTags.map((tag) => (
                                      <span
                                        key={tag}
                                        className="text-[10px] font-medium text-slate-muted bg-white px-1.5 py-0.5 rounded border border-slate-border/40"
                                      >
                                        {tag}
                                      </span>
                                    ))}
                                </div>

                                {dish.description && (
                                  <p className="text-xs text-slate-muted mt-2 italic">
                                    "{dish.description}"
                                  </p>
                                )}
                              </div>

                              <button
                                onClick={() => handleDeleteDish(dish.id, dish.itemName)}
                                className="opacity-0 group-hover:opacity-100 p-1.5 text-slate-light hover:text-status-error rounded-md hover:bg-white transition-all"
                                title="Remove dish from schedule"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

                {/* Footer Action */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => openAddDishModal(session.id, selectedDay)}
                  className="w-full text-xs font-semibold text-slate-deep border-dashed hover:border-solid hover:border-terracotta hover:text-terracotta"
                >
                  <PlusCircle className="w-3.5 h-3.5 mr-1" />
                  Add Dish to {session.label}
                </Button>
              </Card>
            );
          })}
        </div>
      )}

      {/* Add Dish Modal with Progressive Disclosure (Bug 3) */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => !isSubmitting && setIsModalOpen(false)}
        title="Add Dish to Schedule"
        maxWidth="md"
      >
        <form onSubmit={handleCreateDish} className="space-y-4">
          {/* 1. Pre-selected Context Banner with Optional Change (Bug 3 Req 1) */}
          <div className="bg-canvas-tint/80 border border-slate-border/80 rounded-xl p-3 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-terracotta/10 text-terracotta flex items-center justify-center shrink-0">
                {getSessionIcon(modalSession)}
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-muted block">
                  Scheduling for
                </span>
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="font-display font-bold text-sm text-slate-deep">
                    {DAYS.find((d) => d.id === modalDay)?.label} • {activeSessions.find((s) => s.id === modalSession)?.label || modalSession}
                  </span>
                  <span className="text-xs text-slate-muted">
                    ({activeSessions.find((s) => s.id === modalSession)?.timeRange || ''})
                  </span>
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setShowDaySessionPicker(!showDaySessionPicker)}
              className="text-xs font-semibold text-terracotta hover:underline px-2.5 py-1 rounded-md hover:bg-terracotta-container/30 transition-colors whitespace-nowrap"
            >
              {showDaySessionPicker ? 'Keep Selected' : 'Change Day/Session'}
            </button>
          </div>

          {/* Collapsible Day & Session Pickers (Only visible when manager clicks 'Change Day/Session') */}
          {showDaySessionPicker && (
            <div className="p-3 bg-white rounded-xl border border-slate-border space-y-3 animate-fadeIn">
              <div>
                <label className="block text-xs font-bold text-slate-deep mb-1.5">Day of Week</label>
                <div className="grid grid-cols-7 gap-1">
                  {DAYS.map((d) => {
                    const isSelected = modalDay === d.id;
                    return (
                      <button
                        key={d.id}
                        type="button"
                        onClick={() => setModalDay(d.id)}
                        className={clsx(
                          'py-1.5 px-1 rounded-lg text-xs font-bold text-center transition-all',
                          isSelected
                            ? 'bg-terracotta text-white shadow-subtle'
                            : 'text-slate-deep hover:bg-slate-100'
                        )}
                      >
                        <span className="block text-[10px] uppercase font-bold">{d.short}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-deep mb-1.5">Meal Session</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {activeSessions.map((s) => {
                    const isSelected = modalSession === s.id;
                    return (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => setModalSession(s.id)}
                        className={clsx(
                          'p-2 rounded-lg border text-left text-xs font-semibold flex items-center gap-2 transition-all',
                          isSelected
                            ? 'bg-terracotta-container/30 border-terracotta text-terracotta-dark ring-1 ring-terracotta'
                            : 'bg-white border-slate-border hover:bg-slate-50'
                        )}
                      >
                        {getSessionIcon(s.id)}
                        <span>{s.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* 2. Primary Required Field: Dish Name + Quick Pick (Bug 3 Req 2) */}
          <div>
            <label className="block text-xs font-bold text-slate-deep mb-1.5 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Utensils className="w-3.5 h-3.5 text-terracotta" />
                Dish Name <span className="text-terracotta">*</span>
              </span>
            </label>
            <Input
              placeholder="e.g. Traditional Chicken Curry with Steamed Rice"
              value={itemName}
              onChange={(e) => setItemName(e.target.value)}
              required
              autoFocus
              className="text-sm font-medium h-10"
            />

            {/* Quick Pick Chips */}
            <div className="mt-2 flex items-center gap-1.5 flex-wrap">
              <span className="text-[10px] font-bold text-slate-muted uppercase tracking-wider flex items-center gap-1 mr-0.5">
                <Sparkles className="w-3 h-3 text-terracotta" /> Quick Pick:
              </span>
              {POPULAR_DISH_SUGGESTIONS.map((dish) => (
                <button
                  key={dish.name}
                  type="button"
                  onClick={() => {
                    setItemName(dish.name);
                    setCategory(dish.category);
                  }}
                  className="text-[11px] px-2.5 py-0.5 rounded-full bg-canvas-tint hover:bg-terracotta-container/60 text-slate-deep border border-slate-border/60 hover:border-terracotta/40 transition-colors"
                >
                  + {dish.name}
                </button>
              ))}
            </div>
          </div>

          {/* 3. Collapsible Advanced Options Toggle (Bug 3 Req 3 & 4) */}
          <div className="border border-slate-border/80 rounded-xl overflow-hidden bg-slate-50/50">
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="w-full px-3.5 py-2.5 flex items-center justify-between text-xs font-bold text-slate-deep hover:bg-slate-100 transition-colors"
            >
              <span className="flex items-center gap-2 text-slate-muted">
                <Layers className="w-3.5 h-3.5 text-terracotta" />
                <span>More options (Course, Dietary tags, Notes)</span>
                {tags.length > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full bg-terracotta text-white text-[10px]">
                    {tags.length} tag{tags.length > 1 ? 's' : ''}
                  </span>
                )}
              </span>
              <ChevronDown
                className={clsx(
                  'w-4 h-4 text-slate-muted transition-transform duration-200',
                  showAdvanced && 'rotate-180'
                )}
              />
            </button>

            {showAdvanced && (
              <div className="p-3.5 pt-1 space-y-3.5 border-t border-slate-border/80 bg-white">
                {/* Course Category */}
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-muted mb-1.5">
                    Course / Category
                  </label>
                  <div className="flex items-center gap-1.5 flex-wrap mb-2">
                    {PRESET_CATEGORIES.map((cat) => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setCategory(cat)}
                        className={clsx(
                          'px-2.5 py-1 rounded-full text-xs font-semibold transition-all border',
                          category === cat
                            ? 'bg-terracotta text-white border-terracotta shadow-subtle'
                            : 'bg-white text-slate-muted border-slate-border hover:bg-slate-50'
                        )}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                  <Input
                    placeholder="Custom category (e.g. Starter, Dessert)..."
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="h-8 text-xs"
                  />
                </div>

                {/* Dietary Tags */}
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-muted mb-1.5">
                    Dietary & Allergen Tags
                  </label>
                  <div className="flex items-center gap-1.5 flex-wrap mb-2">
                    {PRESET_DIETARY_TAGS.map((pt) => {
                      const isTagged = tags.includes(pt.label);
                      return (
                        <button
                          key={pt.label}
                          type="button"
                          onClick={() => {
                            if (isTagged) {
                              handleRemoveTag(pt.label);
                            } else {
                              setTags([...tags, pt.label]);
                            }
                          }}
                          className={clsx(
                            'inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border transition-all',
                            isTagged
                              ? 'bg-slate-deep text-white border-slate-deep'
                              : 'bg-white text-slate-deep border-slate-border hover:bg-slate-50'
                          )}
                        >
                          <span>{pt.icon}</span>
                          <span>{pt.label}</span>
                          {isTagged && <Check className="w-3 h-3 text-emerald-400 ml-0.5" />}
                        </button>
                      );
                    })}
                  </div>

                  {/* Custom Tag Input */}
                  <div className="flex gap-2">
                    <Input
                      placeholder="Custom tag (e.g. Low Spice, Nut Free)..."
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddTag();
                        }
                      }}
                      className="h-8 text-xs"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleAddTag}
                      className="h-8 px-2.5 text-xs shrink-0"
                    >
                      Add
                    </Button>
                  </div>
                </div>

                {/* Kitchen Preparation Notes */}
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-muted mb-1">
                    Kitchen Preparation Notes (Optional)
                  </label>
                  <textarea
                    className="w-full h-14 p-2.5 rounded-lg bg-slate-50 border border-slate-border focus:bg-white focus:border-terracotta outline-none text-xs text-slate-deep resize-none"
                    placeholder="e.g. Mild spice; serve warm with lemon slices..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </div>
              </div>
            )}
          </div>

          {/* 4. Primary CTA Always Visible Without Scrolling (Bug 3 Req 5) */}
          <div className="pt-2 flex items-center justify-end gap-2.5 border-t border-slate-border">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsModalOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              isLoading={isSubmitting}
              className="shadow-level1 flex items-center gap-1.5"
            >
              <PlusCircle className="w-4 h-4" />
              Add Dish to Schedule
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
