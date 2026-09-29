import React from 'react';
import {
  LayoutDashboard,
  Receipt,
  CreditCard,
  Users,
  UtensilsCrossed,
  SlidersHorizontal,
  LogOut,
  Sparkles,
  MapPin,
  ShieldCheck,
  GraduationCap,
  ChefHat,
  UserPlus,
  Menu,
  X,
  ChevronRight,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Badge } from '../common';
import { clsx } from 'clsx';

export type ManagerTab =
  | 'dashboard'
  | 'expenses'
  | 'deposits'
  | 'members'
  | 'join-requests'
  | 'menu-planner'
  | 'settings';

export interface ManagerLayoutProps {
  currentTab: ManagerTab;
  onTabChange: (tab: ManagerTab) => void;
  onSwitchToStudentView?: () => void;
  onSwitchToChefView?: () => void;
  onOpenShowcase?: () => void;
  pendingDepositsCount?: number;
  negativeBalancesCount?: number;
  pendingJoinRequestsCount?: number;
  children: React.ReactNode;
}

export const ManagerLayout: React.FC<ManagerLayoutProps> = ({
  currentTab,
  onTabChange,
  onSwitchToStudentView,
  onSwitchToChefView,
  onOpenShowcase,
  pendingDepositsCount = 0,
  negativeBalancesCount = 0,
  pendingJoinRequestsCount = 0,
  children,
}) => {
  const { user, activeMembership, logout } = useAuth();

  const isPrimary = activeMembership?.role === 'PRIMARY_MANAGER';
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = React.useState(false);

  const navItems: Array<{
    id: ManagerTab;
    label: string;
    icon: React.ReactNode;
    badgeCount?: number;
  }> = [
    {
      id: 'dashboard',
      label: 'Overview',
      icon: <LayoutDashboard className="w-4 h-4" />,
    },
    {
      id: 'expenses',
      label: 'Expenses',
      icon: <Receipt className="w-4 h-4" />,
    },
    {
      id: 'deposits',
      label: 'Deposits',
      icon: <CreditCard className="w-4 h-4" />,
      badgeCount: pendingDepositsCount,
    },
    {
      id: 'members',
      label: 'Members',
      icon: <Users className="w-4 h-4" />,
      badgeCount: negativeBalancesCount > 0 ? negativeBalancesCount : undefined,
    },
    {
      id: 'join-requests',
      label: 'Join Requests',
      icon: <UserPlus className="w-4 h-4" />,
      badgeCount: pendingJoinRequestsCount > 0 ? pendingJoinRequestsCount : undefined,
    },
    {
      id: 'menu-planner',
      label: 'Menu Planner',
      icon: <UtensilsCrossed className="w-4 h-4" />,
    },
    {
      id: 'settings',
      label: 'Cycle & Settings',
      icon: <SlidersHorizontal className="w-4 h-4" />,
    },
  ];

  const moreBadgeCount =
    (negativeBalancesCount > 0 ? negativeBalancesCount : 0) +
    (pendingJoinRequestsCount > 0 ? pendingJoinRequestsCount : 0);

  return (
    <div className="min-h-screen bg-canvas text-slate-deep flex flex-col font-body antialiased selection:bg-terracotta-container selection:text-terracotta-dark">
      {/* Top App Bar */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-border px-3 sm:px-8 py-2.5 sm:py-3 flex items-center justify-between shadow-subtle">
        {/* Left: Brand Logo, Mess Name & Role */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-button bg-terracotta flex items-center justify-center text-white shadow-level1 shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <span className="font-display font-extrabold text-base sm:text-xl text-slate-deep tracking-tight leading-none">
                MessMate
              </span>
              <span className="text-[9px] sm:text-[10px] uppercase font-bold tracking-wider px-1.5 sm:px-2 py-0.5 rounded-full bg-terracotta-container/80 text-terracotta-dark truncate">
                Admin
              </span>
            </div>
            {(activeMembership?.mealName || activeMembership?.messName) && (
              <div className="flex items-center gap-1 text-[11px] text-slate-muted font-medium mt-0.5 truncate">
                <MapPin className="w-3 h-3 text-sage shrink-0" />
                <span className="font-semibold text-slate-deep truncate">
                  {activeMembership.mealName || activeMembership.messName}
                </span>
                {activeMembership?.mealCode && (
                  <span className="hidden sm:inline font-mono font-bold text-[10px] bg-terracotta/10 text-terracotta px-1.5 py-0.5 rounded border border-terracotta/20 tracking-wider">
                    {activeMembership.mealCode}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Center: Desktop Navigation Tabs */}
        <nav className="hidden lg:flex items-center gap-1 bg-canvas-tint/80 p-1 rounded-button border border-slate-border/50">
          {navItems.map((item) => {
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className={clsx(
                  'h-9 px-3.5 rounded-input text-xs font-semibold flex items-center gap-1.5 transition-all duration-150 tactile-btn relative',
                  isActive
                    ? 'bg-white text-slate-deep shadow-subtle'
                    : 'text-slate-muted hover:text-slate-deep hover:bg-white/50'
                )}
              >
                {item.icon}
                <span>{item.label}</span>
                {item.badgeCount && item.badgeCount > 0 ? (
                  <span
                    className={clsx(
                      'ml-1 text-[10px] font-extrabold px-1.5 py-0.2 rounded-full',
                      item.id === 'deposits'
                        ? 'bg-terracotta text-white'
                        : 'bg-red-500 text-white'
                    )}
                  >
                    {item.badgeCount}
                  </span>
                ) : null}
              </button>
            );
          })}
        </nav>

        {/* Right: Controls, Profile & Mobile Hamburger */}
        <div className="flex items-center gap-1.5 sm:gap-3">
          {/* Role Badge */}
          <Badge
            variant={isPrimary ? 'manager' : 'neutral'}
            size="md"
            icon={<ShieldCheck className="w-3.5 h-3.5" />}
            className="hidden sm:inline-flex"
          >
            {isPrimary ? 'Primary Manager' : 'Manager'}
          </Badge>

          {/* Switch to Student Mode (Desktop/Tablet) */}
          {onSwitchToStudentView && (
            <button
              onClick={onSwitchToStudentView}
              title="Test Student Experience (Toggles, Wallet)"
              className="h-8 px-2.5 rounded-input text-xs font-semibold bg-sage-tint text-sage-dark hover:bg-sage-container/50 hidden md:flex items-center gap-1 transition-colors tactile-btn"
            >
              <GraduationCap className="w-3.5 h-3.5 text-sage" />
              <span>Student View</span>
            </button>
          )}

          {/* Switch to Chef Terminal Mode (Desktop/Tablet) */}
          {onSwitchToChefView && (
            <button
              onClick={onSwitchToChefView}
              title="Open Chef Kitchen Terminal"
              className="h-8 px-2.5 rounded-input text-xs font-semibold bg-amber-50 text-amber-800 hover:bg-amber-100/80 border border-amber-200/60 hidden md:flex items-center gap-1 transition-colors tactile-btn"
            >
              <ChefHat className="w-3.5 h-3.5 text-amber-600" />
              <span>Chef Terminal</span>
            </button>
          )}

          {/* Design Showcase (Large screens) */}
          {onOpenShowcase && (
            <button
              onClick={onOpenShowcase}
              title="Preview Stitch Design System Showcase"
              className="h-8 px-2 rounded-input text-xs font-semibold bg-terracotta-container/60 text-terracotta-dark hover:bg-terracotta/20 hidden xl:flex items-center gap-1 transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5 text-terracotta" />
              <span>Showcase</span>
            </button>
          )}

          {/* User Profile Avatar */}
          <div className="flex items-center gap-1.5 sm:gap-2 pl-1 sm:pl-2 border-l border-slate-border">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full ring-2 ring-terracotta/20 overflow-hidden bg-terracotta-container/40 flex items-center justify-center font-display font-bold text-xs sm:text-sm text-terracotta">
              {user?.avatarUrl ? (
                <img src={user.avatarUrl} alt={user.fullName} className="w-full h-full object-cover" />
              ) : (
                user?.fullName.charAt(0) || 'M'
              )}
            </div>
            <div className="hidden xl:block text-left">
              <span className="block text-xs font-bold text-slate-deep leading-tight">
                {user?.fullName || 'Manager'}
              </span>
              <span className="block text-[11px] text-slate-muted leading-none">
                {user?.email}
              </span>
            </div>

            <button
              onClick={logout}
              title="Sign Out"
              className="hidden sm:flex min-w-[44px] min-h-[44px] items-center justify-center text-slate-muted hover:text-status-error hover:bg-red-50 rounded-full transition-colors ml-0.5"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>

          {/* Mobile Hamburger Drawer Trigger */}
          <button
            type="button"
            onClick={() => setIsMobileDrawerOpen(true)}
            aria-label="Open mobile navigation menu"
            className="lg:hidden min-w-[44px] min-h-[44px] flex items-center justify-center text-slate-deep hover:bg-canvas-tint rounded-button transition-colors relative"
          >
            <Menu className="w-5 h-5" />
            {moreBadgeCount > 0 && (
              <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-red-500" />
            )}
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 pb-28 lg:pb-12">{children}</main>

      {/* Mobile Bottom Dock Navigation Bar (4 high-frequency items: icon + label stacked) */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-border px-2 pt-1.5 pb-safe min-h-[64px] flex items-center justify-around shadow-level2">
        {/* 1. Overview */}
        <button
          onClick={() => onTabChange('dashboard')}
          className={clsx(
            'flex-1 max-w-[80px] flex flex-col items-center justify-center py-1 px-1 rounded-xl transition-all duration-150 tactile-btn shrink-0',
            currentTab === 'dashboard' ? 'text-terracotta font-bold' : 'text-slate-muted font-medium'
          )}
        >
          <div
            className={clsx(
              'w-8 h-8 rounded-full flex items-center justify-center mb-0.5 transition-colors shrink-0',
              currentTab === 'dashboard' ? 'bg-terracotta-container/60 text-terracotta' : 'text-slate-muted'
            )}
          >
            <LayoutDashboard className="w-4 h-4" />
          </div>
          <span
            className={clsx(
              'text-xs font-semibold tracking-tight block shrink-0 text-center leading-none',
              currentTab === 'dashboard' ? 'text-terracotta font-bold' : 'text-slate-600'
            )}
          >
            Overview
          </span>
        </button>

        {/* 2. Expenses */}
        <button
          onClick={() => onTabChange('expenses')}
          className={clsx(
            'flex-1 max-w-[80px] flex flex-col items-center justify-center py-1 px-1 rounded-xl transition-all duration-150 tactile-btn shrink-0',
            currentTab === 'expenses' ? 'text-terracotta font-bold' : 'text-slate-muted font-medium'
          )}
        >
          <div
            className={clsx(
              'w-8 h-8 rounded-full flex items-center justify-center mb-0.5 transition-colors shrink-0',
              currentTab === 'expenses' ? 'bg-terracotta-container/60 text-terracotta' : 'text-slate-muted'
            )}
          >
            <Receipt className="w-4 h-4" />
          </div>
          <span
            className={clsx(
              'text-xs font-semibold tracking-tight block shrink-0 text-center leading-none',
              currentTab === 'expenses' ? 'text-terracotta font-bold' : 'text-slate-600'
            )}
          >
            Expenses
          </span>
        </button>

        {/* 3. Deposits */}
        <button
          onClick={() => onTabChange('deposits')}
          className={clsx(
            'flex-1 max-w-[80px] flex flex-col items-center justify-center py-1 px-1 rounded-xl transition-all duration-150 tactile-btn relative shrink-0',
            currentTab === 'deposits' ? 'text-terracotta font-bold' : 'text-slate-muted font-medium'
          )}
        >
          <div
            className={clsx(
              'w-8 h-8 rounded-full flex items-center justify-center mb-0.5 transition-colors relative shrink-0',
              currentTab === 'deposits' ? 'bg-terracotta-container/60 text-terracotta' : 'text-slate-muted'
            )}
          >
            <CreditCard className="w-4 h-4" />
            {pendingDepositsCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 rounded-full bg-terracotta text-white text-[9px] font-extrabold flex items-center justify-center shadow-subtle">
                {pendingDepositsCount}
              </span>
            )}
          </div>
          <span
            className={clsx(
              'text-xs font-semibold tracking-tight block shrink-0 text-center leading-none',
              currentTab === 'deposits' ? 'text-terracotta font-bold' : 'text-slate-600'
            )}
          >
            Deposits
          </span>
        </button>

        {/* 4. More (Slide-out Drawer) */}
        <button
          onClick={() => setIsMobileDrawerOpen(true)}
          className="flex-1 max-w-[80px] flex flex-col items-center justify-center py-1 px-1 rounded-xl transition-all duration-150 tactile-btn relative shrink-0 text-slate-muted font-medium"
        >
          <div className="w-8 h-8 rounded-full flex items-center justify-center mb-0.5 relative text-slate-muted shrink-0">
            <Menu className="w-4 h-4" />
            {moreBadgeCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 rounded-full bg-red-500 text-white text-[9px] font-extrabold flex items-center justify-center shadow-subtle">
                {moreBadgeCount}
              </span>
            )}
          </div>
          <span className="text-xs font-semibold tracking-tight block shrink-0 text-center leading-none text-slate-600">
            More
          </span>
        </button>
      </nav>

      {/* Slide-out Mobile Navigation Drawer */}
      {isMobileDrawerOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-slate-deep/50 backdrop-blur-sm transition-opacity"
            onClick={() => setIsMobileDrawerOpen(false)}
            aria-hidden="true"
          />

          {/* Drawer Content */}
          <div className="relative ml-auto w-4/5 max-w-xs bg-white h-full shadow-level3 flex flex-col z-10 pt-safe pb-safe animate-in slide-in-from-right duration-200">
            {/* Drawer Header */}
            <div className="px-5 py-4 border-b border-slate-border flex items-center justify-between">
              <div>
                <h2 className="font-display font-bold text-base text-slate-deep">Manager Menu</h2>
                {activeMembership?.messName && (
                  <p className="text-xs text-slate-muted truncate max-w-[180px]">
                    {activeMembership.messName}
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={() => setIsMobileDrawerOpen(false)}
                className="min-w-[44px] min-h-[44px] flex items-center justify-center text-slate-muted hover:text-slate-deep rounded-full hover:bg-canvas-tint transition-colors"
                aria-label="Close menu"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Drawer Nav Items List */}
            <div className="flex-1 overflow-y-auto px-3 py-3 space-y-1">
              {navItems.map((item) => {
                const isActive = currentTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      onTabChange(item.id);
                      setIsMobileDrawerOpen(false);
                    }}
                    className={clsx(
                      'w-full min-h-[44px] px-3.5 py-2.5 rounded-card flex items-center justify-between text-sm font-semibold transition-colors',
                      isActive
                        ? 'bg-terracotta-container/50 text-terracotta-dark font-bold'
                        : 'text-slate-deep hover:bg-canvas-tint'
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={clsx(
                          'w-8 h-8 rounded-full flex items-center justify-center',
                          isActive ? 'bg-terracotta text-white' : 'bg-slate-100 text-slate-muted'
                        )}
                      >
                        {item.icon}
                      </div>
                      <span>{item.label}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      {item.badgeCount && item.badgeCount > 0 ? (
                        <span
                          className={clsx(
                            'text-[10px] font-extrabold px-2 py-0.5 rounded-full',
                            item.id === 'deposits'
                              ? 'bg-terracotta text-white'
                              : 'bg-red-500 text-white'
                          )}
                        >
                          {item.badgeCount}
                        </span>
                      ) : null}
                      <ChevronRight className="w-4 h-4 text-slate-300" />
                    </div>
                  </button>
                );
              })}

              <hr className="my-3 border-slate-border/60" />

              {/* View Switches */}
              <div className="space-y-1.5 pt-1">
                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-muted px-3">
                  Quick Switches
                </span>
                {onSwitchToStudentView && (
                  <button
                    onClick={() => {
                      setIsMobileDrawerOpen(false);
                      onSwitchToStudentView();
                    }}
                    className="w-full min-h-[44px] px-3.5 py-2 rounded-card flex items-center gap-3 text-xs font-semibold text-sage-dark bg-sage-tint/60 hover:bg-sage-tint transition-colors"
                  >
                    <GraduationCap className="w-4 h-4 text-sage" />
                    <span>Student View</span>
                  </button>
                )}
                {onSwitchToChefView && (
                  <button
                    onClick={() => {
                      setIsMobileDrawerOpen(false);
                      onSwitchToChefView();
                    }}
                    className="w-full min-h-[44px] px-3.5 py-2 rounded-card flex items-center gap-3 text-xs font-semibold text-amber-800 bg-amber-50 hover:bg-amber-100/80 transition-colors"
                  >
                    <ChefHat className="w-4 h-4 text-amber-600" />
                    <span>Chef Terminal</span>
                  </button>
                )}
                {onOpenShowcase && (
                  <button
                    onClick={() => {
                      setIsMobileDrawerOpen(false);
                      onOpenShowcase();
                    }}
                    className="w-full min-h-[44px] px-3.5 py-2 rounded-card flex items-center gap-3 text-xs font-semibold text-terracotta-dark bg-terracotta-container/50 hover:bg-terracotta-container transition-colors"
                  >
                    <Sparkles className="w-4 h-4 text-terracotta" />
                    <span>Design Showcase</span>
                  </button>
                )}
              </div>
            </div>

            {/* Drawer Footer with User & Sign Out */}
            <div className="p-4 border-t border-slate-border bg-canvas-tint/40 flex items-center justify-between">
              <div className="min-w-0 pr-2">
                <p className="text-xs font-bold text-slate-deep truncate">{user?.fullName}</p>
                <p className="text-[10px] text-slate-muted truncate">{user?.email}</p>
              </div>
              <button
                onClick={() => {
                  setIsMobileDrawerOpen(false);
                  logout();
                }}
                className="min-h-[44px] px-3 py-1.5 rounded-button text-xs font-semibold text-status-error bg-red-50 hover:bg-red-100 flex items-center gap-1.5 transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
