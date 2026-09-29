import React, { useState } from 'react';
import { ArrowLeft, Search, Users, CheckCircle2, AlertCircle, Clock, Shield } from 'lucide-react';
import { api } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import type { MealCodeVerificationResponse, MealJoinRequestDto } from '../../types';

interface Props {
  onBack: () => void;
  onRequestSubmitted: () => void;
}

type Step = 'enter-code' | 'verify-preview' | 'success';

export const JoinMealFlow: React.FC<Props> = ({ onBack, onRequestSubmitted }) => {
  const { refreshUser } = useAuth();

  const [step, setStep] = useState<Step>('enter-code');
  const [code, setCode] = useState('');
  const [notes, setNotes] = useState('');
  const [roomNumber, setRoomNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [verifiedMeal, setVerifiedMeal] = useState<MealCodeVerificationResponse | null>(null);
  const [joinRequest, setJoinRequest] = useState<MealJoinRequestDto | null>(null);

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = code.trim().toUpperCase();
    if (!clean) { setError('Please enter the meal code.'); return; }
    setLoading(true);
    setError(null);
    try {
      const meal = await api.post<MealCodeVerificationResponse>('/meals/verify-code', { code: clean });
      setVerifiedMeal(meal);
      setStep('verify-preview');
    } catch (err: any) {
      setError(err?.message || 'Invalid meal code. Please check with your mess manager.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!verifiedMeal) return;
    setLoading(true);
    setError(null);
    try {
      const req = await api.post<MealJoinRequestDto>('/meals/join-request', {
        code: verifiedMeal.code,
        notes: notes.trim() || null,
        roomNumber: roomNumber.trim() || null,
      });
      setJoinRequest(req);
      setStep('success');
      await refreshUser();
    } catch (err: any) {
      setError(err?.message || 'Failed to submit join request. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const cycleStatusColor = (status: string) => {
    if (status === 'ACTIVE') return 'text-green-600 bg-green-50';
    if (status === 'EXPIRING') return 'text-amber-600 bg-amber-50';
    if (status === 'COMPLETED') return 'text-slate-500 bg-slate-50';
    return 'text-slate-600 bg-slate-50';
  };

  // ─── Success ───
  if (step === 'success' && joinRequest) {
    return (
      <div className="min-h-screen bg-canvas flex items-center justify-center p-6 font-body">
        <div className="w-full max-w-sm text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-[22px] bg-blue-50 text-blue-500 mb-5 shadow-level1">
            <Clock className="w-10 h-10" />
          </div>
          <h1 className="font-display font-extrabold text-2xl text-slate-deep">Request Submitted!</h1>
          <p className="text-sm text-slate-muted mt-2 mb-6 max-w-xs mx-auto">
            Your join request for <strong>{joinRequest.mealName}</strong> has been sent to the meal manager for approval.
          </p>

          <div className="bg-white rounded-card shadow-level1 border border-slate-border p-5 mb-6 text-left space-y-3">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-blue-500 flex-shrink-0" />
              <p className="text-xs text-slate-muted">
                You'll be notified when a manager approves your request. Until then, you can check your status on the pending screen.
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-muted">
              <span className="font-semibold text-slate-deep">Meal Code:</span>
              <span className="font-bold text-terracotta">{verifiedMeal?.code}</span>
            </div>
            {joinRequest.roomNumber && (
              <div className="flex items-center gap-2 text-xs text-slate-muted">
                <span className="font-semibold text-slate-deep">Room / Seat:</span>
                <span className="font-bold text-slate-deep">Room {joinRequest.roomNumber}</span>
              </div>
            )}
            <div className="flex items-center gap-2 text-xs text-slate-muted">
              <span className="font-semibold text-slate-deep">Status:</span>
              <span className="inline-flex items-center gap-1 font-semibold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full text-xs">
                <Clock className="w-3 h-3" /> Pending Approval
              </span>
            </div>
          </div>

          <button
            onClick={onRequestSubmitted}
            className="w-full h-12 bg-terracotta hover:bg-terracotta-hover text-white rounded-button font-bold text-sm shadow-level1 transition-all active:scale-98"
          >
            View Request Status →
          </button>
        </div>
      </div>
    );
  }

  // ─── Step 2: Preview & Confirm ───
  if (step === 'verify-preview' && verifiedMeal) {
    return (
      <div className="min-h-screen bg-canvas flex items-center justify-center p-6 font-body">
        <div className="w-full max-w-md">
          <div className="flex items-center gap-3 mb-8">
            <button onClick={() => { setStep('enter-code'); setError(null); }} className="p-2 rounded-xl hover:bg-slate-100 transition-colors">
              <ArrowLeft className="w-5 h-5 text-slate-muted" />
            </button>
            <div>
              <p className="text-xs text-slate-muted font-medium">Confirm Your Request</p>
              <h1 className="font-display font-extrabold text-xl text-slate-deep">Meal Group Found</h1>
            </div>
          </div>

          {/* Meal Preview Card */}
          <div className="bg-white rounded-card shadow-level2 border border-slate-border p-5 mb-4">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-terracotta-container flex items-center justify-center flex-shrink-0">
                <Users className="w-6 h-6 text-terracotta" />
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="font-display font-bold text-lg text-slate-deep truncate">{verifiedMeal.name}</h2>
                {verifiedMeal.address && (
                  <p className="text-xs text-slate-muted truncate">{verifiedMeal.address}</p>
                )}
                <div className="flex items-center gap-2 mt-2 flex-wrap">
                  <span className="text-xs font-bold text-terracotta bg-terracotta-container px-2 py-0.5 rounded-full tracking-wide">
                    {verifiedMeal.code}
                  </span>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${cycleStatusColor(verifiedMeal.currentCycleStatus)}`}>
                    Cycle #{verifiedMeal.currentCycleNumber} · {verifiedMeal.currentCycleStatus}
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-slate-border grid grid-cols-2 gap-4 text-center">
              <div>
                <p className="text-lg font-extrabold text-slate-deep">{verifiedMeal.memberCount}</p>
                <p className="text-xs text-slate-muted">Active Members</p>
              </div>
              <div>
                <p className="text-sm font-bold text-slate-deep truncate">{verifiedMeal.ownerName}</p>
                <p className="text-xs text-slate-muted">Meal Owner</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-card shadow-level1 border border-slate-border p-5">
            <form onSubmit={handleSubmitRequest} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-muted uppercase tracking-wide mb-1.5">
                  Room / Seat Number (optional)
                </label>
                <input
                  type="text"
                  id="join-request-room"
                  value={roomNumber}
                  onChange={e => setRoomNumber(e.target.value)}
                  placeholder="e.g. 204 or Seat 3B"
                  className="w-full h-11 px-4 rounded-input border border-slate-border bg-slate-50 text-sm text-slate-deep placeholder-slate-muted focus:outline-none focus:ring-2 focus:ring-terracotta/40 focus:border-terracotta/60 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-muted uppercase tracking-wide mb-1.5">
                  Note to Manager (optional)
                </label>
                <textarea
                  id="join-request-notes"
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="Introduce yourself or add any notes..."
                  rows={3}
                  maxLength={200}
                  className="w-full px-4 py-3 rounded-input border border-slate-border bg-slate-50 text-sm text-slate-deep placeholder-slate-muted focus:outline-none focus:ring-2 focus:ring-terracotta/40 focus:border-terracotta/60 transition-all resize-none"
                />
              </div>

              {error && (
                <div className="flex items-start gap-2 text-xs text-status-error bg-red-50 border border-red-200 rounded-input px-3 py-2">
                  <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                  {error}
                </div>
              )}

              <div className="flex items-start gap-2 text-xs text-slate-muted bg-amber-50 border border-amber-200 rounded-input px-3 py-2">
                <Clock className="w-3.5 h-3.5 flex-shrink-0 mt-0.5 text-amber-500" />
                Your request will be pending until the meal manager approves it.
              </div>

              <button
                type="submit"
                id="join-meal-submit-btn"
                disabled={loading}
                className="w-full h-12 bg-terracotta hover:bg-terracotta-hover text-white rounded-button text-sm font-bold shadow-level1 flex items-center justify-center gap-2 transition-all disabled:opacity-60 active:scale-98"
              >
                {loading ? (
                  <span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    Submit Join Request
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  // ─── Step 1: Enter Code ───
  return (
    <div className="min-h-screen bg-canvas flex items-center justify-center p-6 font-body">
      <div className="w-full max-w-md">
        <div className="flex items-center gap-3 mb-8">
          <button onClick={onBack} className="p-2 rounded-xl hover:bg-slate-100 transition-colors">
            <ArrowLeft className="w-5 h-5 text-slate-muted" />
          </button>
          <div>
            <p className="text-xs text-slate-muted font-medium">Join a Meal Group</p>
            <h1 className="font-display font-extrabold text-xl text-slate-deep">Enter Meal Code</h1>
          </div>
        </div>

        <div className="bg-white rounded-card shadow-level2 border border-slate-border p-6">
          <div className="flex justify-center mb-5">
            <div className="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center">
              <Search className="w-7 h-7 text-blue-500" />
            </div>
          </div>

          <p className="text-sm text-slate-muted text-center mb-5">
            Get the 6-character code from your mess manager or roommate and enter it below.
          </p>

          <form onSubmit={handleVerifyCode} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-muted uppercase tracking-wide mb-1.5">
                Meal Code
              </label>
              <input
                type="text"
                id="join-meal-code-input"
                value={code}
                onChange={e => setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
                placeholder="e.g. MM7K42"
                maxLength={8}
                autoFocus
                className="w-full h-14 px-4 rounded-input border border-slate-border bg-slate-50 text-xl font-bold text-center text-slate-deep tracking-widest placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-400/40 focus:border-blue-400/60 transition-all uppercase"
              />
            </div>

            {error && (
              <div className="flex items-start gap-2 text-xs text-status-error bg-red-50 border border-red-200 rounded-input px-3 py-2">
                <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                {error}
              </div>
            )}

            <button
              type="submit"
              id="join-meal-verify-btn"
              disabled={loading || code.trim().length < 4}
              className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white rounded-button text-sm font-bold shadow-level1 flex items-center justify-center gap-2 transition-all disabled:opacity-50 active:scale-98"
            >
              {loading ? (
                <span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
              ) : (
                <>
                  <Search className="w-4 h-4" />
                  Verify Code
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
