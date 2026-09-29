import React, { useState } from 'react';
import { Utensils, Lock, Mail, User, Phone, Sparkles, LogIn, UserPlus } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Button, Input, Card, CardContent, Alert } from '../../components/common';

export interface AuthScreenProps {
  onOpenShowcase?: () => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ onOpenShowcase }) => {
  const { login, register, isLoading } = useAuth();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('password123');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    try {
      if (isSignUp) {
        if (!fullName.trim() || !email.trim()) {
          setErrorMsg('Please enter your full name and email.');
          return;
        }
        await register(fullName, email, password, phone);
      } else {
        if (!email.trim()) {
          setErrorMsg('Please enter your email address.');
          return;
        }
        await login(email, password);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Authentication failed. Please check credentials.');
    }
  };

  const handleQuickLogin = async (quickEmail: string) => {
    setErrorMsg(null);
    try {
      await login(quickEmail, 'password123');
    } catch (err: any) {
      setErrorMsg(err.message || 'Quick login failed.');
    }
  };

  return (
    <div className="min-h-screen bg-canvas flex flex-col justify-center items-center px-4 py-12">
      {/* Brand Header */}
      <div className="text-center mb-8 max-w-sm">
        <div className="w-14 h-14 rounded-button bg-terracotta flex items-center justify-center text-white mx-auto shadow-level1 mb-3">
          <Utensils className="w-7 h-7" />
        </div>
        <h1 className="font-display font-extrabold text-2xl sm:text-3xl text-slate-deep tracking-tight">
          MessMate
        </h1>
        <p className="text-xs sm:text-sm text-slate-muted mt-1 font-body">
          Smart Dining & Hostel Mess Management
        </p>
      </div>

      {/* Auth Card */}
      <Card className="w-full max-w-md shadow-level2">
        <CardContent className="p-6 sm:p-8 space-y-6">
          {/* Sign In vs Sign Up Tabs */}
          <div className="flex bg-canvas-tint p-1 rounded-button border border-slate-border/50">
            <button
              type="button"
              onClick={() => {
                setIsSignUp(false);
                setErrorMsg(null);
              }}
              className={`flex-1 h-10 rounded-input text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${!isSignUp
                  ? 'bg-white text-slate-deep shadow-subtle'
                  : 'text-slate-muted hover:text-slate-deep'
                }`}
            >
              <LogIn className="w-4 h-4" />
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setIsSignUp(true);
                setErrorMsg(null);
              }}
              className={`flex-1 h-10 rounded-input text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${isSignUp
                  ? 'bg-white text-slate-deep shadow-subtle'
                  : 'text-slate-muted hover:text-slate-deep'
                }`}
            >
              <UserPlus className="w-4 h-4" />
              Create Account
            </button>
          </div>

          {errorMsg && (
            <Alert type="error" onDismiss={() => setErrorMsg(null)}>
              {errorMsg}
            </Alert>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {isSignUp && (
              <>
                <Input
                  label="Full Name"
                  placeholder="e.g. Tanvir Rahman"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  leftIcon={<User className="w-4 h-4" />}
                  required
                />
                <Input
                  label="Phone Number (Optional)"
                  placeholder="e.g. +88017XXXXXXXX"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  leftIcon={<Phone className="w-4 h-4" />}
                />
              </>
            )}

            <Input
              label="Email Address"
              type="email"
              placeholder="e.g. s1.arafat@messmate.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              leftIcon={<Mail className="w-4 h-4" />}
              required
            />

            <Input
              label="Password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              leftIcon={<Lock className="w-4 h-4" />}
              helperText={!isSignUp ? 'Default seed password: password123' : undefined}
              required
            />

            <Button
              type="submit"
              variant="primary"
              size="md"
              fullWidth
              isLoading={isLoading}
              className="mt-2"
            >
              {isSignUp ? 'Register & Join' : 'Sign In to Campus Mess'}
            </Button>
          </form>

          {/* 1-Click Quick Login Preset Accounts */}
          <div className="pt-4 border-t border-slate-border/60">
            <span className="text-[11px] font-semibold text-slate-muted uppercase tracking-wider block mb-2 text-center">
              Or 1-Click Quick Login (Seed Accounts)
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleQuickLogin('s1.arafat@messmate.com')}
                className="p-2.5 rounded-input bg-canvas-tint hover:bg-terracotta-container/30 border border-slate-border/50 text-left transition-colors tactile-btn"
              >
                <div className="text-xs font-bold text-slate-deep">Arafat Hossain</div>
                <div className="text-[10px] text-slate-muted">Student • Regular Balance</div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('s10.sohel@messmate.com')}
                className="p-2.5 rounded-input bg-red-50 hover:bg-red-100/70 border border-red-200 text-left transition-colors tactile-btn"
              >
                <div className="text-xs font-bold text-status-error">Sohel Rana</div>
                <div className="text-[10px] text-red-600">Student • Negative Balance</div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('s2.bilal@messmate.com')}
                className="p-2.5 rounded-input bg-canvas-tint hover:bg-sage-container/30 border border-slate-border/50 text-left transition-colors tactile-btn"
              >
                <div className="text-xs font-bold text-slate-deep">Bilal Mahmud</div>
                <div className="text-[10px] text-slate-muted">Student • Greenfield Hall</div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('primary.manager@messmate.com')}
                className="p-2.5 rounded-input bg-slate-100 hover:bg-slate-200 border border-slate-300 text-left transition-colors tactile-btn"
              >
                <div className="text-xs font-bold text-slate-deep">Rahim Chowdhury</div>
                <div className="text-[10px] text-slate-muted">Primary Manager</div>
              </button>
            </div>
          </div>

          {/* Design Showcase Link */}
          {onOpenShowcase && (
            <div className="pt-2 text-center">
              <button
                type="button"
                onClick={onOpenShowcase}
                className="inline-flex items-center gap-1.5 text-xs text-terracotta font-semibold hover:underline"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Explore Google Stitch Design System Showcase</span>
              </button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
