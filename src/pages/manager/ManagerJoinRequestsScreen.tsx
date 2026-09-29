import React, { useState, useEffect, useCallback } from 'react';
import {
  Clock, CheckCircle2, XCircle, User, BookOpen,
  Phone, DoorOpen, Building2, RefreshCw, AlertCircle,
  Inbox, ChevronDown, ChevronUp, Copy, Check, UserPlus
} from 'lucide-react';
import { api } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import type { MealJoinRequestDto } from '../../types';

export const ManagerJoinRequestsScreen: React.FC = () => {
  const { activeMembership } = useAuth();
  const mealId = activeMembership?.mealId || activeMembership?.messId || '';

  const [requests, setRequests] = useState<MealJoinRequestDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reviewingId, setReviewingId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [rejectNotes, setRejectNotes] = useState<Record<string, string>>({});
  const [copied, setCopied] = useState(false);

  const fetchRequests = useCallback(async () => {
    if (!mealId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await api.get<MealJoinRequestDto[]>(`/meals/${mealId}/join-requests`);
      setRequests(data);
    } catch (err: any) {
      setError(err?.message || 'Failed to load join requests.');
    } finally {
      setLoading(false);
    }
  }, [mealId]);

  useEffect(() => { fetchRequests(); }, [fetchRequests]);

  const handleReview = async (requestId: string, approved: boolean) => {
    setReviewingId(requestId);
    try {
      await api.post(`/meals/${mealId}/join-requests/${requestId}/review`, {
        approved,
        notes: approved ? null : (rejectNotes[requestId] || null),
      });
      await fetchRequests();
      setExpandedId(null);
    } catch (err: any) {
      setError(err?.message || 'Review failed. Please try again.');
    } finally {
      setReviewingId(null);
    }
  };

  const pendingRequests = requests.filter(r => r.status === 'PENDING');
  const processedRequests = requests.filter(r => r.status !== 'PENDING');

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString('en-BD', {
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch { return dateStr; }
  };

  const RequestCard: React.FC<{ req: MealJoinRequestDto; isPending: boolean }> = ({ req, isPending }) => {
    const isExpanded = expandedId === req.id;
    const isReviewing = reviewingId === req.id;

    return (
      <div className={`bg-white border rounded-card shadow-subtle overflow-hidden transition-all ${
        isPending ? 'border-amber-200' : req.status === 'APPROVED' ? 'border-green-200' : 'border-red-200'
      }`}>
        {/* Header */}
        <div className="p-4">
          <div className="flex items-start gap-3">
            {/* Avatar */}
            <div className="flex-shrink-0 w-11 h-11 rounded-full bg-slate-100 flex items-center justify-center font-display font-bold text-sm text-terracotta">
              {req.userName.charAt(0).toUpperCase()}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2 flex-wrap">
                <div>
                  <h3 className="font-semibold text-sm text-slate-deep">
                    {req.userName} — Room {req.roomNumber || 'N/A'}
                  </h3>
                  <p className="text-xs text-slate-muted">{req.userEmail}</p>
                </div>
                <div className="flex items-center gap-2">
                  {/* Status Badge */}
                  {req.status === 'PENDING' && (
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-600 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                      <Clock className="w-3 h-3" /> Pending
                    </span>
                  )}
                  {req.status === 'APPROVED' && (
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-green-600 bg-green-50 border border-green-200 px-2 py-0.5 rounded-full">
                      <CheckCircle2 className="w-3 h-3" /> Approved
                    </span>
                  )}
                  {req.status === 'REJECTED' && (
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-red-600 bg-red-50 border border-red-200 px-2 py-0.5 rounded-full">
                      <XCircle className="w-3 h-3" /> Rejected
                    </span>
                  )}
                  {/* Expand Toggle */}
                  <button
                    onClick={() => setExpandedId(isExpanded ? null : req.id)}
                    className="p-1 rounded-lg hover:bg-slate-100 transition-colors text-slate-muted"
                    aria-label="Toggle details"
                  >
                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Quick details */}
              <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                {req.studentId && (
                  <span className="flex items-center gap-1 text-xs text-slate-muted">
                    <BookOpen className="w-3 h-3" /> {req.studentId}
                  </span>
                )}
                {req.department && (
                  <span className="flex items-center gap-1 text-xs text-slate-muted">
                    <Building2 className="w-3 h-3" /> {req.department}
                  </span>
                )}
                {req.roomNumber && (
                  <span className="flex items-center gap-1 text-xs text-slate-muted">
                    <DoorOpen className="w-3 h-3" /> {req.roomNumber}
                  </span>
                )}
                <span className="text-xs text-slate-muted ml-auto">{formatDate(req.createdAt)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Expanded Details */}
        {isExpanded && (
          <div className="border-t border-slate-border p-4 bg-slate-50 space-y-4">
            {/* More details */}
            <div className="grid grid-cols-2 gap-3">
              {req.userPhone && (
                <div className="flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5 text-slate-muted flex-shrink-0" />
                  <div>
                    <p className="text-xs text-slate-muted">Phone</p>
                    <p className="text-xs font-semibold text-slate-deep">{req.userPhone}</p>
                  </div>
                </div>
              )}
              {req.studentId && (
                <div className="flex items-center gap-2">
                  <BookOpen className="w-3.5 h-3.5 text-slate-muted flex-shrink-0" />
                  <div>
                    <p className="text-xs text-slate-muted">Student ID</p>
                    <p className="text-xs font-semibold text-slate-deep">{req.studentId}</p>
                  </div>
                </div>
              )}
              {req.department && (
                <div className="flex items-center gap-2">
                  <Building2 className="w-3.5 h-3.5 text-slate-muted flex-shrink-0" />
                  <div>
                    <p className="text-xs text-slate-muted">Department</p>
                    <p className="text-xs font-semibold text-slate-deep">{req.department}</p>
                  </div>
                </div>
              )}
              {req.roomNumber && (
                <div className="flex items-center gap-2">
                  <DoorOpen className="w-3.5 h-3.5 text-slate-muted flex-shrink-0" />
                  <div>
                    <p className="text-xs text-slate-muted">Room</p>
                    <p className="text-xs font-semibold text-slate-deep">{req.roomNumber}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Request Note */}
            {req.requestNotes && (
              <div className="bg-white border border-slate-border rounded-xl px-3 py-2">
                <p className="text-xs text-slate-muted font-medium mb-0.5">Student's Note</p>
                <p className="text-xs text-slate-deep italic">"{req.requestNotes}"</p>
              </div>
            )}

            {/* Reviewed By */}
            {req.reviewedByName && (
              <p className="text-xs text-slate-muted">
                Reviewed by <strong>{req.reviewedByName}</strong>
                {req.reviewedAt && <> · {formatDate(req.reviewedAt)}</>}
              </p>
            )}

            {/* Pending Actions */}
            {isPending && (
              <div className="space-y-2">
                {/* Reject Note */}
                <div>
                  <label className="block text-xs font-semibold text-slate-muted mb-1">
                    Rejection Reason (if rejecting)
                  </label>
                  <input
                    type="text"
                    placeholder="Optional note to student…"
                    value={rejectNotes[req.id] || ''}
                    onChange={e => setRejectNotes(prev => ({ ...prev, [req.id]: e.target.value }))}
                    className="w-full h-9 px-3 rounded-input border border-slate-border bg-white text-xs text-slate-deep placeholder-slate-muted focus:outline-none focus:ring-1 focus:ring-terracotta/40"
                  />
                </div>

                <div className="flex gap-2">
                  <button
                    id={`approve-btn-${req.id}`}
                    onClick={() => handleReview(req.id, true)}
                    disabled={isReviewing}
                    className="flex-1 h-10 bg-green-500 hover:bg-green-600 text-white rounded-button text-xs font-bold flex items-center justify-center gap-1.5 transition-all disabled:opacity-60 shadow-subtle"
                  >
                    {isReviewing ? (
                      <span className="animate-spin w-3.5 h-3.5 border border-white border-t-transparent rounded-full" />
                    ) : (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Approve & Add Member
                      </>
                    )}
                  </button>
                  <button
                    id={`reject-btn-${req.id}`}
                    onClick={() => handleReview(req.id, false)}
                    disabled={isReviewing}
                    className="flex-1 h-10 bg-red-50 border border-red-200 hover:bg-red-500 hover:text-white hover:border-red-500 text-red-600 rounded-button text-xs font-bold flex items-center justify-center gap-1.5 transition-all disabled:opacity-60"
                  >
                    {isReviewing ? (
                      <span className="animate-spin w-3.5 h-3.5 border border-red-400 border-t-transparent rounded-full" />
                    ) : (
                      <>
                        <XCircle className="w-3.5 h-3.5" />
                        Reject
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="p-4 sm:p-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display font-extrabold text-2xl text-slate-deep">Join Requests</h1>
          <p className="text-sm text-slate-muted mt-0.5">
            Review and approve new member requests for your meal group.
          </p>
        </div>
        <button
          onClick={fetchRequests}
          disabled={loading}
          className="p-2 rounded-xl hover:bg-slate-100 transition-colors text-slate-muted"
          title="Refresh"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Meal Join Code Share Banner */}
      {activeMembership?.mealCode && (
        <div className="bg-gradient-to-r from-terracotta/10 via-amber-500/10 to-orange-50 border border-terracotta/25 rounded-2xl p-4 sm:p-5 mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-subtle">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-terracotta text-white flex items-center justify-center shrink-0 shadow-subtle">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] font-bold text-terracotta uppercase tracking-wider">Meal Join Code</p>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="font-mono text-xl font-black text-slate-deep tracking-widest">{activeMembership.mealCode}</span>
                <span className="text-xs text-slate-muted hidden sm:inline">• Share this code with students to let them join</span>
              </div>
            </div>
          </div>
          <button
            onClick={() => {
              navigator.clipboard.writeText(activeMembership.mealCode || '');
              setCopied(true);
              setTimeout(() => setCopied(false), 2000);
            }}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white border border-slate-border text-slate-deep hover:bg-slate-50 font-bold text-xs transition-all shadow-subtle shrink-0 cursor-pointer active:scale-95"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-emerald-700">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-slate-muted" />
                <span>Copy Code</span>
              </>
            )}
          </button>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="flex items-start gap-2 text-xs text-status-error bg-red-50 border border-red-200 rounded-input px-3 py-2 mb-4">
          <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
          {error}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-16">
          <div className="animate-spin w-8 h-8 border-2 border-terracotta border-t-transparent rounded-full" />
        </div>
      )}

      {!loading && (
        <>
          {/* Pending Section */}
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              <Clock className="w-4 h-4 text-amber-500" />
              <h2 className="font-semibold text-sm text-slate-deep">
                Pending Approval
              </h2>
              {pendingRequests.length > 0 && (
                <span className="text-xs font-bold text-white bg-amber-500 px-2 py-0.5 rounded-full">
                  {pendingRequests.length}
                </span>
              )}
            </div>

            {pendingRequests.length === 0 ? (
              <div className="bg-white border border-slate-border rounded-card p-8 text-center">
                <Inbox className="w-8 h-8 text-slate-muted mx-auto mb-2" />
                <p className="text-sm font-semibold text-slate-deep">No pending requests</p>
                <p className="text-xs text-slate-muted mt-1">Share your meal code so students can apply to join.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {pendingRequests.map(req => (
                  <RequestCard key={req.id} req={req} isPending={true} />
                ))}
              </div>
            )}
          </div>

          {/* Processed Section */}
          {processedRequests.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <User className="w-4 h-4 text-slate-muted" />
                <h2 className="font-semibold text-sm text-slate-deep">Recent Decisions</h2>
              </div>
              <div className="space-y-3">
                {processedRequests.slice(0, 10).map(req => (
                  <RequestCard key={req.id} req={req} isPending={false} />
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};
