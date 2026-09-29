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

  return (
    <div className="min-h-screen bg-canvas text-slate-deep flex flex-col font-body antialiased selection:bg-terracotta-container selection:text-terracotta-dark">
      {/* Top App Bar */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-border px-4 sm:px-8 py-3 flex items-center justify-between shadow-subtle">
        {/* Left: Brand Logo, Mess Name & Role */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-button bg-terracotta flex items-center justify-center text-white shadow-level1 shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-display font-extrabold text-lg sm:text-xl text-slate-deep tracking-tight leading-none">
                MessMate
              </span>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-terracotta-container/80 text-terracotta-dark">
                Admin Console
              </span>
            </div>
            {(activeMembership?.mealName || activeMembership?.messName) && (
              <div className="flex items-center gap-1.5 text-[11px] text-slate-muted font-medium mt-0.5">
                <MapPin className="w-3 h-3 text-sage shrink-0" />
                <span className="font-semibold text-slate-deep">{activeMembership.mealName || activeMembership.messName}</span>
                {activeMembership?.mealCode && (
                  <span className="font-mono font-bold text-[10px] bg-terracotta/10 text-terracotta px-1.5 py-0.5 rounded border border-terracotta/20 tracking-wider">
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

        {/* Right: Controls & Profile */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Role Badge */}
          <Badge
            variant={isPrimary ? 'manager' : 'neutral'}
            size="md"
            icon={<ShieldCheck className="w-3.5 h-3.5" />}
            className="hidden sm:inline-flex"
          >
            {isPrimary ? 'Primary Manager' : 'Manager'}
          </Badge>

          {/* Switch to Student Mode */}
          {onSwitchToStudentView && (
            <button
              onClick={onSwitchToStudentView}
              title="Test Student Experience (Toggles, Wallet)"
              className="h-8 px-2.5 rounded-input text-xs font-semibold bg-sage-tint text-sage-dark hover:bg-sage-container/50 flex items-center gap-1 transition-colors tactile-btn"
            >
              <GraduationCap className="w-3.5 h-3.5 text-sage" />
              <span className="hidden md:inline">Student View</span>
            </button>
          )}

          {/* Switch to Chef Terminal Mode */}
          {onSwitchToChefView && (
            <button
              onClick={onSwitchToChefView}
              title="Open Chef Kitchen Terminal"
              className="h-8 px-2.5 rounded-input text-xs font-semibold bg-amber-50 text-amber-800 hover:bg-amber-100/80 border border-amber-200/60 flex items-center gap-1 transition-colors tactile-btn"
            >
              <ChefHat className="w-3.5 h-3.5 text-amber-600" />
              <span className="hidden md:inline">Chef Terminal</span>
            </button>
          )}

          {/* Design Showcase */}
          {onOpenShowcase && (
            <button
              onClick={onOpenShowcase}
              title="Preview Stitch Design System Showcase"
              className="h-8 px-2 rounded-input text-xs font-semibold bg-terracotta-container/60 text-terracotta-dark hover:bg-terracotta/20 flex items-center gap-1 transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5 text-terracotta" />
              <span className="hidden xl:inline">Showcase</span>
            </button>
          )}

          {/* User Profile Avatar */}
          <div className="flex items-center gap-2 pl-2 border-l border-slate-border">
            <div className="w-9 h-9 rounded-full ring-2 ring-terracotta/20 overflow-hidden bg-terracotta-container/40 flex items-center justify-center font-display font-bold text-sm text-terracotta">
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
              className="p-2 text-slate-muted hover:text-status-error hover:bg-red-50 rounded-full transition-colors ml-1"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 pb-24 lg:pb-12">{children}</main>

      {/* Mobile Bottom Dock Navigation Bar */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-border px-2 py-1.5 flex items-center justify-around shadow-level2">
        {navItems.map((item) => {
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={clsx(
                'flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-all duration-150 tactile-btn relative',
                isActive ? 'text-terracotta font-bold' : 'text-slate-muted font-medium'
              )}
            >
              <div
                className={clsx(
                  'w-8 h-8 rounded-full flex items-center justify-center mb-0.5 transition-colors relative',
                  isActive ? 'bg-terracotta-container/60 text-terracotta' : 'text-slate-muted'
                )}
              >
                {item.icon}
                {item.badgeCount && item.badgeCount > 0 ? (
                  <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-terracotta text-white text-[9px] font-extrabold flex items-center justify-center shadow-subtle">
                    {item.badgeCount}
                  </span>
                ) : null}
              </div>
              <span className="text-[10px] tracking-tight">{item.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
};
