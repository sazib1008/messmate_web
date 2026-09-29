import React, { useState } from 'react';
import {
  Clock, RefreshCw, X, Users, Shield, Utensils,
  ArrowLeft, CheckCircle2, XCircle, AlertCircle
} from 'lucide-react';
import { api } from '../../api/client';
import { useAuth } from '../../context/AuthContext';

interface Props {
  onTryAnotherMeal: () => void;
  onLogout: () => void;
}

export const JoinPendingScreen: React.FC<Props> = ({ onTryAnotherMeal, onLogout }) => {
  const { pendingJoinRequest, refreshUser, clearPendingRequest } = useAuth();

  const [refreshing, setRefreshing] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [cancelConfirm, setCancelConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRefresh = async () => {
    setRefreshing(true);
    setError(null);
    try {
      await refreshUser();
    } catch {
      setError('Failed to refresh. Please try again.');
    } finally {
      setRefreshing(false);
    }
  };

  const handleCancelRequest = async () => {
    if (!pendingJoinRequest) return;
    setCancelling(true);
    setError(null);
    try {
      await api.delete(`/meals/join-requests/${pendingJoinRequest.id}`);
      clearPendingRequest();
      onTryAnotherMeal();
    } catch (err: any) {
      setError(err?.message || 'Failed to cancel request. Please try again.');
      setCancelConfirm(false);
    } finally {
      setCancelling(false);
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString('en-BD', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateStr;
    }
  };

  const timeAgo = (dateStr: string) => {
    try {
      const diff = Date.now() - new Date(dateStr).getTime();
      const hours = Math.floor(diff / 3600000);
      if (hours < 1) return 'Just now';
      if (hours < 24) return `${hours}h ago`;
      const days = Math.floor(hours / 24);
      return `${days}d ago`;
    } catch {
      return '';
    }
  };

  if (!pendingJoinRequest) {
    return (
      <div className="min-h-screen bg-canvas flex items-center justify-center p-6 font-body">
        <div className="text-center">
          <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-3" />
          <h2 className="font-display font-bold text-lg text-slate-deep">No pending request</h2>
          <p className="text-sm text-slate-muted mt-1">Your request may have been processed. Refreshing…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-canvas flex flex-col items-center justify-center p-6 font-body">
      {/* Decorative background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-32 -right-32 w-[400px] h-[400px] bg-amber-100/30 rounded-full blur-3xl" />
        <div className="absolute -bottom-32 -left-32 w-[350px] h-[350px] bg-terracotta/5 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-sm">
        {/* Header Icon */}
        <div className="text-center mb-6">
          <div className="relative inline-flex items-center justify-center">
            <div className="w-20 h-20 rounded-[22px] bg-amber-50 flex items-center justify-center shadow-level1">
              <Clock className="w-10 h-10 text-amber-500" />
            </div>
            {/* Animated pulse ring */}
            <span className="absolute inset-0 rounded-[22px] bg-amber-400/20 animate-ping" style={{ animationDuration: '2.5s' }} />
          </div>

          <h1 className="font-display font-extrabold text-2xl text-slate-deep mt-4">
            Awaiting Approval
          </h1>
          <p className="text-sm text-slate-muted mt-2 max-w-xs mx-auto">
            Your join request has been sent. The meal manager will review it shortly.
          </p>
        </div>

        {/* Request Card */}
        <div className="bg-white rounded-card shadow-level2 border border-slate-border overflow-hidden mb-4">
          {/* Meal Info */}
          <div className="p-5 border-b border-slate-border">
            <div className="flex items-start gap-3">
              <div className="w-11 h-11 rounded-xl bg-terracotta-container flex items-center justify-center flex-shrink-0">
                <Utensils className="w-5 h-5 text-terracotta" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-slate-muted font-medium">Joining</p>
                <h2 className="font-display font-bold text-base text-slate-deep truncate">
                  {pendingJoinRequest.mealName}
                </h2>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  <span className="text-xs font-bold text-terracotta bg-terracotta-container px-2 py-0.5 rounded-full">
                    {pendingJoinRequest.mealCode}
                  </span>
                  <span className="text-xs text-slate-muted">
                    Owner: {pendingJoinRequest.ownerName}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Request Details */}
          <div className="p-5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-muted">Request Status</span>
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-600 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-full">
                <Clock className="w-3 h-3" />
                Pending Approval
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-muted">Submitted</span>
              <span className="text-xs font-semibold text-slate-deep">
                {formatDate(pendingJoinRequest.createdAt)}
                <span className="text-slate-muted font-normal ml-1">({timeAgo(pendingJoinRequest.createdAt)})</span>
              </span>
            </div>
            {pendingJoinRequest.requestNotes && (
              <div>
                <span className="text-xs text-slate-muted">Your Note</span>
                <p className="text-xs text-slate-deep bg-slate-50 rounded-lg px-3 py-2 mt-1 italic">
                  "{pendingJoinRequest.requestNotes}"
                </p>
              </div>
            )}
          </div>

          {/* Info Banner */}
          <div className="bg-blue-50 border-t border-blue-100 px-5 py-3 flex items-start gap-2">
            <Shield className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-blue-700">
              Once approved, you'll automatically be taken to your student dashboard. Keep this tab open or come back to check.
            </p>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="flex items-start gap-2 text-xs text-status-error bg-red-50 border border-red-200 rounded-input px-3 py-2 mb-3">
            <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
            {error}
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-3">
          {/* Refresh */}
          <button
            id="pending-refresh-btn"
            onClick={handleRefresh}
            disabled={refreshing}
            className="w-full h-11 bg-white border border-slate-border hover:border-terracotta/40 text-slate-deep rounded-button text-sm font-semibold flex items-center justify-center gap-2 transition-all shadow-level1 active:scale-98 disabled:opacity-60"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'Refreshing…' : 'Check Status'}
          </button>

          {/* Cancel Request */}
          {!cancelConfirm ? (
            <button
              id="pending-cancel-btn"
              onClick={() => setCancelConfirm(true)}
              className="w-full h-11 bg-white border border-red-200 hover:border-red-400 text-red-500 hover:text-red-600 rounded-button text-sm font-semibold flex items-center justify-center gap-2 transition-all active:scale-98"
            >
              <X className="w-4 h-4" />
              Cancel Request & Try Another
            </button>
          ) : (
            <div className="bg-red-50 border border-red-200 rounded-card p-4 space-y-3">
              <div className="flex items-start gap-2">
                <XCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-red-700 font-medium">
                  Are you sure you want to cancel your join request for <strong>{pendingJoinRequest.mealName}</strong>?
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setCancelConfirm(false)}
                  className="flex-1 h-9 bg-white border border-slate-border text-slate-deep rounded-button text-xs font-semibold transition-all hover:bg-slate-50"
                >
                  Keep Request
                </button>
                <button
                  id="pending-cancel-confirm-btn"
                  onClick={handleCancelRequest}
                  disabled={cancelling}
                  className="flex-1 h-9 bg-red-500 hover:bg-red-600 text-white rounded-button text-xs font-semibold transition-all disabled:opacity-60 flex items-center justify-center gap-1.5"
                >
                  {cancelling ? (
                    <span className="animate-spin w-3 h-3 border border-white border-t-transparent rounded-full" />
                  ) : (
                    <>
                      <X className="w-3.5 h-3.5" />Yes, Cancel
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Try Another Meal */}
          {!cancelConfirm && (
            <button
              id="pending-back-btn"
              onClick={() => { clearPendingRequest(); onTryAnotherMeal(); }}
              className="w-full text-xs text-slate-muted hover:text-slate-deep flex items-center justify-center gap-1 py-2 transition-colors"
            >
              <ArrowLeft className="w-3 h-3" />
              Go back to Welcome screen
            </button>
          )}

          <button
            onClick={onLogout}
            className="w-full text-xs text-slate-muted hover:text-slate-deep underline py-1 transition-colors"
          >
            Sign out
          </button>
        </div>

        {/* Members chip */}
        <div className="mt-6 flex items-center justify-center gap-2 text-xs text-slate-muted">
          <Users className="w-3.5 h-3.5" />
          <span>While waiting, your mess's meal cycle continues normally for existing members.</span>
        </div>
      </div>
    </div>
  );
};
