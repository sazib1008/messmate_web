import React from 'react';
import { Utensils, PlusCircle, Users } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface Props {
  onCreateMeal: () => void;
  onJoinMeal: () => void;
  onLogout: () => void;
}

export const WelcomeScreen: React.FC<Props> = ({ onCreateMeal, onJoinMeal, onLogout }) => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-canvas flex flex-col items-center justify-center p-6 font-body">
      {/* Background decorative elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-32 -right-32 w-[500px] h-[500px] bg-terracotta/6 rounded-full blur-3xl" />
        <div className="absolute -bottom-32 -left-32 w-[400px] h-[400px] bg-terracotta/5 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-amber-100/20 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-sm">
        {/* Brand Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-[22px] bg-gradient-to-br from-terracotta to-terracotta-hover text-white shadow-level2 mb-5 relative">
            <Utensils className="w-10 h-10" />
            <div className="absolute inset-0 rounded-[22px] bg-white/10 opacity-0 hover:opacity-100 transition-opacity" />
          </div>

          <h1 className="font-display font-extrabold text-3xl text-slate-deep tracking-tight">
            Welcome to MessMate
          </h1>
          {user && (
            <p className="text-sm text-slate-muted mt-2">
              Hi, <span className="font-semibold text-slate-deep">{user.fullName.split(' ')[0]}</span> 👋
            </p>
          )}
          <p className="text-sm text-slate-muted mt-3 leading-relaxed max-w-xs mx-auto">
            Your student mess management starts here. Create a new meal group or join an existing one with a code.
          </p>
        </div>

        {/* Action Cards */}
        <div className="space-y-4">
          {/* Create Meal Card */}
          <button
            id="welcome-create-meal-btn"
            onClick={onCreateMeal}
            className="group w-full bg-white border border-slate-border rounded-card shadow-level1 hover:shadow-level2 hover:border-terracotta/40 p-5 text-left transition-all duration-200 active:scale-98"
          >
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-terracotta-container group-hover:bg-terracotta group-hover:text-white text-terracotta flex items-center justify-center transition-all duration-200 shadow-sm">
                <PlusCircle className="w-6 h-6" />
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="font-display font-bold text-base text-slate-deep group-hover:text-terracotta transition-colors">
                  Create a Meal Group
                </h2>
                <p className="text-xs text-slate-muted mt-1 leading-relaxed">
                  Start a new mess, invite your roommates with a unique code, and track meals, expenses & deposits.
                </p>
                <div className="flex items-center gap-1 mt-2">
                  <span className="text-xs font-semibold text-terracotta bg-terracotta-container px-2 py-0.5 rounded-full">
                    You become the Owner
                  </span>
                </div>
              </div>
            </div>
          </button>

          {/* Join Meal Card */}
          <button
            id="welcome-join-meal-btn"
            onClick={onJoinMeal}
            className="group w-full bg-white border border-slate-border rounded-card shadow-level1 hover:shadow-level2 hover:border-blue-400/40 p-5 text-left transition-all duration-200 active:scale-98"
          >
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-blue-50 group-hover:bg-blue-500 group-hover:text-white text-blue-500 flex items-center justify-center transition-all duration-200 shadow-sm">
                <Users className="w-6 h-6" />
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="font-display font-bold text-base text-slate-deep group-hover:text-blue-600 transition-colors">
                  Join a Meal Group
                </h2>
                <p className="text-xs text-slate-muted mt-1 leading-relaxed">
                  Have a code from your mess manager? Enter it to request joining an existing mess group.
                </p>
                <div className="flex items-center gap-1 mt-2">
                  <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                    Requires manager approval
                  </span>
                </div>
              </div>
            </div>
          </button>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center">
          <button
            type="button"
            id="welcome-logout-btn"
            onClick={onLogout}
            className="text-xs text-slate-muted hover:text-slate-deep underline transition-colors"
          >
            Sign out
          </button>
        </div>
      </div>
    </div>
  );
};
