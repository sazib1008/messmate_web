import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AuthScreen } from './pages/auth/AuthScreen';
import { ProfileSetupScreen } from './pages/onboarding/ProfileSetupScreen';
import { WelcomeScreen } from './pages/onboarding/WelcomeScreen';
import { CreateMealFlow } from './pages/onboarding/CreateMealFlow';
import { JoinMealFlow } from './pages/onboarding/JoinMealFlow';
import { JoinPendingScreen } from './pages/onboarding/JoinPendingScreen';
import { StudentLayout } from './components/layout/StudentLayout';
import type { StudentTab } from './components/layout/StudentLayout';
import { ManagerLayout } from './components/layout/ManagerLayout';
import type { ManagerTab } from './components/layout/ManagerLayout';

import { StudentHomeScreen } from './pages/student/StudentHomeScreen';
import { StudentCalendarScreen } from './pages/student/StudentCalendarScreen';
import { StudentAccountScreen } from './pages/student/StudentAccountScreen';
import { StudentMenuScreen } from './pages/student/StudentMenuScreen';

import { ManagerDashboardScreen } from './pages/manager/ManagerDashboardScreen';
import { ManagerExpenseScreen } from './pages/manager/ManagerExpenseScreen';
import { ManagerDepositScreen } from './pages/manager/ManagerDepositScreen';
import { ManagerMemberScreen } from './pages/manager/ManagerMemberScreen';
import { ManagerMenuPlannerScreen } from './pages/manager/ManagerMenuPlannerScreen';
import { ManagerSettingsScreen } from './pages/manager/ManagerSettingsScreen';
import { ManagerJoinRequestsScreen } from './pages/manager/ManagerJoinRequestsScreen';
import { ChefScreen } from './pages/chef/ChefScreen';
import { ComponentShowcase } from './pages/dev/ComponentShowcase';
import { Utensils } from 'lucide-react';

// ─── Onboarding flow sub-screens ───────────────────────────────────────────
type OnboardingFlow = 'welcome' | 'create-meal' | 'join-meal' | 'join-pending';

// ─── Main App Content ───────────────────────────────────────────────────────
const AppContent: React.FC = () => {
  const { user, activeMembership, pendingJoinRequest, isLoading, logout, refreshUser } = useAuth();

  const [studentTab, setStudentTab] = useState<StudentTab>('home');
  const [managerTab, setManagerTab] = useState<ManagerTab>('dashboard');
  const [portalMode, setPortalMode] = useState<'STUDENT' | 'MANAGER' | 'CHEF'>('STUDENT');
  const [showShowcase, setShowShowcase] = useState(false);
  const [openDepositModalOnAccount, setOpenDepositModalOnAccount] = useState(false);
  const [onboardingFlow, setOnboardingFlow] = useState<OnboardingFlow>('welcome');

  // Helper: determine if user is manager/owner
  const role = activeMembership?.role;
  const isManager =
    role === 'PRIMARY_MANAGER' || role === 'MANAGER' || role === 'OWNER';
  const isChef = role === 'CHEF';

  // Auto-detect default portal mode on login
  useEffect(() => {
    if (isChef) {
      setPortalMode('CHEF');
    } else if (isManager) {
      setPortalMode('MANAGER');
    } else {
      setPortalMode('STUDENT');
    }
  }, [role, isChef, isManager]);

  // Reset onboarding flow when pending request is cleared externally
  useEffect(() => {
    if (!pendingJoinRequest && onboardingFlow === 'join-pending') {
      setOnboardingFlow('welcome');
    }
  }, [pendingJoinRequest]);

  // ─── Loading Splash ───
  if (isLoading) {
    return (
      <div className="min-h-screen bg-canvas flex flex-col items-center justify-center p-4 font-body">
        <div className="w-14 h-14 rounded-2xl bg-terracotta flex items-center justify-center text-white shadow-level2 animate-pulse mb-4">
          <Utensils className="w-7 h-7" />
        </div>
        <h2 className="font-display font-extrabold text-xl text-slate-deep">MessMate</h2>
        <p className="text-sm text-slate-muted mt-1">Loading your dining workspace…</p>
      </div>
    );
  }

  // ─── Gate 1: Not logged in → Auth ───
  if (!user) {
    return (
      <div className="page-fade-in">
        <AuthScreen onOpenShowcase={() => setShowShowcase(true)} />
      </div>
    );
  }

  if (showShowcase) {
    return <div className="page-fade-in"><ComponentShowcase onBack={() => setShowShowcase(false)} /></div>;
  }

  // ─── Gate 2: Profile not complete → Profile Setup ───
  const isProfileComplete = Boolean(
    user?.isProfileComplete ||
    (user as any)?.profileComplete ||
    (user?.roomNumber && user.roomNumber.trim().length > 0)
  );

  if (!isProfileComplete) {
    return (
      <div className="page-fade-in">
        <ProfileSetupScreen onComplete={refreshUser} />
      </div>
    );
  }

  // ─── Gate 3: Chef Portal ───
  if (portalMode === 'CHEF' && activeMembership) {
    return (
      <div className="page-fade-in">
        <ChefScreen
          onSwitchToManagerView={isManager ? () => setPortalMode('MANAGER') : undefined}
          onSwitchToStudentView={isManager ? () => setPortalMode('STUDENT') : undefined}
          onOpenShowcase={() => setShowShowcase(true)}
        />
      </div>
    );
  }

  // ─── Gate 4: Manager Portal ───
  if (portalMode === 'MANAGER' && isManager && activeMembership) {
    return (
      <div className="page-fade-in">
        <ManagerLayout
          currentTab={managerTab}
          onTabChange={setManagerTab}
          onSwitchToStudentView={() => setPortalMode('STUDENT')}
          onSwitchToChefView={() => setPortalMode('CHEF')}
          onOpenShowcase={() => setShowShowcase(true)}
        >
          {managerTab === 'dashboard' && (
            <ManagerDashboardScreen
              onNavigateTab={setManagerTab}
              onSwitchToChefView={() => setPortalMode('CHEF')}
            />
          )}
          {managerTab === 'expenses' && <ManagerExpenseScreen />}
          {managerTab === 'deposits' && <ManagerDepositScreen />}
          {managerTab === 'members' && <ManagerMemberScreen />}
          {managerTab === 'join-requests' && <ManagerJoinRequestsScreen />}
          {managerTab === 'menu-planner' && <ManagerMenuPlannerScreen />}
          {managerTab === 'settings' && <ManagerSettingsScreen />}
        </ManagerLayout>
      </div>
    );
  }

  // ─── Gate 5: Active meal membership → Student Portal ───
  if (activeMembership) {
    return (
      <div className="page-fade-in">
        <StudentLayout
          currentTab={studentTab}
          onTabChange={(tab) => {
            if (tab !== 'account') setOpenDepositModalOnAccount(false);
            setStudentTab(tab);
          }}
          onOpenShowcase={() => setShowShowcase(true)}
          onSwitchToManagerView={isManager ? () => setPortalMode('MANAGER') : undefined}
        >
          {studentTab === 'home' && (
            <StudentHomeScreen
              onNavigateToCalendar={() => setStudentTab('calendar')}
              onNavigateToAccount={() => {
                setOpenDepositModalOnAccount(false);
                setStudentTab('account');
              }}
              onOpenDepositModal={() => {
                setOpenDepositModalOnAccount(true);
                setStudentTab('account');
              }}
            />
          )}
          {studentTab === 'calendar' && <StudentCalendarScreen />}
          {studentTab === 'account' && (
            <StudentAccountScreen initialOpenDepositModal={openDepositModalOnAccount} />
          )}
          {studentTab === 'menu' && (
            <StudentMenuScreen onNavigateToCalendar={() => setStudentTab('calendar')} />
          )}
        </StudentLayout>
      </div>
    );
  }

  // ─── Gate 6: Pending join request ───
  if (pendingJoinRequest || onboardingFlow === 'join-pending') {
    return (
      <div className="page-fade-in">
        <JoinPendingScreen
          onTryAnotherMeal={() => setOnboardingFlow('welcome')}
          onLogout={logout}
        />
      </div>
    );
  }

  // ─── Gate 7: No meal yet → Onboarding Flows ───
  if (onboardingFlow === 'create-meal') {
    return (
      <div className="page-fade-in">
        <CreateMealFlow
          onBack={() => setOnboardingFlow('welcome')}
          onCreated={() => {
            // refreshUser already called in CreateMealFlow after success
            // activeMembership will be set which gates to Student Portal
          }}
        />
      </div>
    );
  }

  if (onboardingFlow === 'join-meal') {
    return (
      <div className="page-fade-in">
        <JoinMealFlow
          onBack={() => setOnboardingFlow('welcome')}
          onRequestSubmitted={() => setOnboardingFlow('join-pending')}
        />
      </div>
    );
  }

  // Default → Welcome Screen
  return (
    <div className="page-fade-in">
      <WelcomeScreen
        onCreateMeal={() => setOnboardingFlow('create-meal')}
        onJoinMeal={() => setOnboardingFlow('join-meal')}
        onLogout={logout}
      />
    </div>
  );
};

// ─── Root App ───────────────────────────────────────────────────────────────
export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
