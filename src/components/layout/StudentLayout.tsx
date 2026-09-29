import React from 'react';
import {
  Utensils,
  Calendar,
  Wallet,
  BookOpen,
  LogOut,
  Sparkles,
  MapPin,
  School,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Badge } from '../common';
import { clsx } from 'clsx';

export type StudentTab = 'home' | 'calendar' | 'account' | 'menu';

export interface StudentLayoutProps {
  currentTab: StudentTab;
  onTabChange: (tab: StudentTab) => void;
  onOpenShowcase?: () => void;
  onSwitchToManagerView?: () => void;
  children: React.ReactNode;
}

export const StudentLayout: React.FC<StudentLayoutProps> = ({
  currentTab,
  onTabChange,
  onOpenShowcase,
  onSwitchToManagerView,
  children,
}) => {
  const { user, activeMembership, logout } = useAuth();

  const navItems: Array<{ id: StudentTab; label: string; icon: React.ReactNode }> = [
    { id: 'home', label: 'Dashboard', icon: <Utensils className="w-5 h-5" /> },
    { id: 'calendar', label: 'Meal Calendar', icon: <Calendar className="w-5 h-5" /> },
    { id: 'account', label: 'My Wallet', icon: <Wallet className="w-5 h-5" /> },
    { id: 'menu', label: 'Weekly Menu', icon: <BookOpen className="w-5 h-5" /> },
  ];

  return (
    <div className="min-h-screen bg-canvas text-slate-deep flex flex-col font-body antialiased selection:bg-terracotta-container selection:text-terracotta-dark">
      {/* Top App Bar */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-border px-4 sm:px-8 py-3 flex items-center justify-between shadow-subtle">
        {/* Left: Brand Logo & Title */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-button bg-terracotta flex items-center justify-center text-white shadow-level1 shrink-0">
            <Utensils className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-display font-extrabold text-lg sm:text-xl text-slate-deep tracking-tight leading-none">
                MessMate
              </span>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-slate-100 text-slate-muted hidden sm:inline-block">
                Campus Dining
              </span>
            </div>
            {activeMembership?.messName && (
              <div className="flex items-center gap-1 text-[11px] text-slate-muted font-medium mt-0.5">
                <MapPin className="w-3 h-3 text-sage" />
                <span>{activeMembership.messName}</span>
              </div>
            )}
          </div>
        </div>

        {/* Center: Desktop Navigation Tabs */}
        <nav className="hidden md:flex items-center gap-1 bg-canvas-tint/80 p-1 rounded-button border border-slate-border/50">
          {navItems.map((item) => {
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className={clsx(
                  'h-9 px-4 rounded-input text-xs font-semibold flex items-center gap-2 transition-all duration-150 tactile-btn',
                  isActive
                    ? 'bg-white text-slate-deep shadow-subtle'
                    : 'text-slate-muted hover:text-slate-deep hover:bg-white/50'
                )}
              >
                {item.icon}
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Right: Role Pill, User Avatar & Logout */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          {/* Stitch Student Role Badge */}
          <Badge
            variant="student"
            size="md"
            icon={<School className="w-3.5 h-3.5" />}
            className="hidden sm:inline-flex"
          >
            Role: Student
          </Badge>

          {/* Quick Switch to Manager View if Authorized */}
          {onSwitchToManagerView && (
            <button
              onClick={onSwitchToManagerView}
              title="Return to Manager Console"
              className="h-8 px-2.5 rounded-input text-xs font-semibold bg-terracotta text-white hover:bg-terracotta-dark flex items-center gap-1 transition-colors tactile-btn shadow-subtle"
            >
              <span>Manager Console</span>
            </button>
          )}

          {/* Quick Switch to Component Showcase */}
          {onOpenShowcase && (
            <button
              onClick={onOpenShowcase}
              title="Preview Stitch Design System Showcase"
              className="h-8 px-2.5 rounded-input text-xs font-semibold bg-terracotta-container text-terracotta-dark hover:bg-terracotta/20 flex items-center gap-1 transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5 text-terracotta" />
              <span className="hidden lg:inline">Design Showcase</span>
            </button>
          )}

          {/* User Profile Avatar */}
          <div className="flex items-center gap-2 pl-2 border-l border-slate-border">
            <div className="w-9 h-9 rounded-full ring-2 ring-terracotta/20 overflow-hidden bg-terracotta-container/40 flex items-center justify-center font-display font-bold text-sm text-terracotta">
              {user?.avatarUrl ? (
                <img src={user.avatarUrl} alt={user.fullName} className="w-full h-full object-cover" />
              ) : (
                user?.fullName.charAt(0) || 'U'
              )}
            </div>
            <div className="hidden xl:block text-left">
              <span className="block text-xs font-bold text-slate-deep leading-tight">
                {user?.fullName || 'Student'}
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

      {/* Content Area */}
      <main className="flex-1 pb-24 md:pb-12">{children}</main>

      {/* Mobile Bottom Dock Navigation Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-border px-4 py-2 flex items-center justify-around shadow-level2">
        {navItems.map((item) => {
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={clsx(
                'flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all duration-150 tactile-btn',
                isActive ? 'text-terracotta font-bold' : 'text-slate-muted font-medium'
              )}
            >
              <div
                className={clsx(
                  'w-8 h-8 rounded-full flex items-center justify-center mb-0.5 transition-colors',
                  isActive ? 'bg-terracotta-container/60 text-terracotta' : 'text-slate-muted'
                )}
              >
                {item.icon}
              </div>
              <span className="text-[10px] tracking-tight">{item.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
};
