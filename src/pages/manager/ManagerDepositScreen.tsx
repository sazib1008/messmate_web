import React, { useState, useEffect, useMemo } from 'react';
import {
  CheckCircle2,
  XCircle,
  Clock,
  Search,
  RefreshCw,
  ShieldAlert,
  Download,
  Receipt,
  Copy,
  Check,
  Eye,
  Filter,
  ArrowUpRight,
  Inbox,
  User,
  Calendar,
  Hash,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../api/client';
import type { DepositDto, ReviewDepositRequest, PaymentMethod } from '../../types';
import {
  Card,
  Button,
  Badge,
  Input,
  Modal,
  Alert,
  Skeleton,
} from '../../components/common';
import { clsx } from 'clsx';

type TopTab = 'requests' | 'history';
type HistoryStatusFilter = 'ALL' | 'APPROVED' | 'REJECTED';

export const ManagerDepositScreen: React.FC = () => {
  const { activeMembership } = useAuth();
  const [deposits, setDeposits] = useState<DepositDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasInitializedTab, setHasInitializedTab] = useState(false);

  // Top-level tabs: 'requests' (Action Queue) vs 'history' (Read-only Log)
  const [activeTab, setActiveTab] = useState<TopTab>('requests');

  // History Tab Filters
  const [historyStatusFilter, setHistoryStatusFilter] = useState<HistoryStatusFilter>('ALL');
  const [methodFilter, setMethodFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Modals & Actions
  const [activeReviewDeposit, setActiveReviewDeposit] = useState<DepositDto | null>(null);
  const [selectedDetailsDeposit, setSelectedDetailsDeposit] = useState<DepositDto | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  // Track loading per deposit ID so cards don't share loading spinners
  const [loadingIds, setLoadingIds] = useState<Set<string>>(new Set());
  const [cardErrors, setCardErrors] = useState<Record<string, string>>({});
  const [feedback, setFeedback] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  useEffect(() => {
    fetchDeposits();
  }, [activeMembership?.messId]);

  const fetchDeposits = async () => {
    if (!activeMembership?.messId) return;
    setIsLoading(true);
    try {
      const data = await api.get<DepositDto[]>(
        `/deposits?messId=${activeMembership.messId}`
      );
      setDeposits(data);

      // Auto-select tab on first load: Requests if any pending, else History
      if (!hasInitializedTab) {
        const pendingCount = data.filter((d) => d.status === 'PENDING').length;
        setActiveTab(pendingCount > 0 ? 'requests' : 'history');
        setHasInitializedTab(true);
      }
    } catch (err: any) {
      console.error('Failed to load deposits:', err);
      setFeedback({
        type: 'error',
        message: err.message || 'Unable to fetch deposit records',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleApproveDeposit = async (dep: DepositDto) => {
    setLoadingIds((prev) => new Set(prev).add(dep.id));
    setFeedback(null);
    setCardErrors((prev) => {
      const copy = { ...prev };
      delete copy[dep.id];
      return copy;
    });

    try {
      const payload: ReviewDepositRequest = {
        approved: true,
      };
      await api.post(`/deposits/${dep.id}/review`, payload);

      setFeedback({
        type: 'success',
        message: `Approved deposit of ৳${dep.amount.toFixed(2)} for ${dep.userFullName} — Room ${dep.roomNumber || 'N/A'}. Balance ledger credited.`,
      });

      if (selectedDetailsDeposit?.id === dep.id) {
        setSelectedDetailsDeposit(null);
      }

      await fetchDeposits();
    } catch (err: any) {
      console.error('Failed to approve deposit:', err);
      const errMsg = err.message || 'Failed to approve deposit';
      setFeedback({
        type: 'error',
        message: errMsg,
      });
      setCardErrors((prev) => ({
        ...prev,
        [dep.id]: errMsg,
      }));
    } finally {
      setLoadingIds((prev) => {
        const next = new Set(prev);
        next.delete(dep.id);
        return next;
      });
    }
  };

  const handleConfirmReject = async () => {
    if (!activeReviewDeposit) return;
    const targetId = activeReviewDeposit.id;
    setLoadingIds((prev) => new Set(prev).add(targetId));
    setFeedback(null);
    setCardErrors((prev) => {
      const copy = { ...prev };
      delete copy[targetId];
      return copy;
    });

    try {
      const payload: ReviewDepositRequest = {
        approved: false,
        rejectionReason: rejectionReason.trim() || undefined,
      };
      await api.post(`/deposits/${targetId}/review`, payload);

      setFeedback({
        type: 'success',
        message: `Rejected deposit request for ${activeReviewDeposit.userFullName} — Room ${activeReviewDeposit.roomNumber || 'N/A'}.`,
      });

      if (selectedDetailsDeposit?.id === targetId) {
        setSelectedDetailsDeposit(null);
      }

      setActiveReviewDeposit(null);
      setRejectionReason('');
      await fetchDeposits();
    } catch (err: any) {
      console.error('Failed to reject deposit:', err);
      const errMsg = err.message || 'Failed to reject deposit';
      setFeedback({
        type: 'error',
        message: errMsg,
      });
      setCardErrors((prev) => ({
        ...prev,
        [targetId]: errMsg,
      }));
    } finally {
      setLoadingIds((prev) => {
        const next = new Set(prev);
        next.delete(targetId);
        return next;
      });
    }
  };

  const handleCopyTrx = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const formatDhakaDateTime = (dateStr?: string) => {
    if (!dateStr) return 'N/A';
    try {
      const d = new Date(dateStr);
      return new Intl.DateTimeFormat('en-US', {
        timeZone: 'Asia/Dhaka',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }).format(d);
    } catch {
      return dateStr.split('T')[0];
    }
  };

  // Grouped datasets
  const pendingRequests = useMemo(() => {
    return deposits.filter((d) => d.status === 'PENDING');
  }, [deposits]);

  const historyDeposits = useMemo(() => {
    return deposits.filter((d) => d.status === 'APPROVED' || d.status === 'REJECTED');
  }, [deposits]);

  // Filtered History
  const filteredHistory = useMemo(() => {
    return historyDeposits.filter((d) => {
      const matchStatus =
        historyStatusFilter === 'ALL' || d.status === historyStatusFilter;
      const matchMethod =
        methodFilter === 'ALL' || d.paymentMethod === methodFilter;
      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        q === '' ||
        d.userFullName.toLowerCase().includes(q) ||
        (d.roomNumber && d.roomNumber.toLowerCase().includes(q)) ||
        (d.transactionRef && d.transactionRef.toLowerCase().includes(q)) ||
        (d.paymentMethod && d.paymentMethod.toLowerCase().includes(q)) ||
        (d.amount && d.amount.toString().includes(q)) ||
        (d.notes && d.notes.toLowerCase().includes(q));
      return matchStatus && matchMethod && matchSearch;
    });
  }, [historyDeposits, historyStatusFilter, methodFilter, searchQuery]);

  // Aggregate Metrics
  const pendingCount = pendingRequests.length;
  const approvedCount = deposits.filter((d) => d.status === 'APPROVED').length;
  const rejectedCount = deposits.filter((d) => d.status === 'REJECTED').length;
  const approvedTotalSum = deposits
    .filter((d) => d.status === 'APPROVED')
    .reduce((sum, d) => sum + d.amount, 0);

  const role = activeMembership?.role;
  const isManager = role === 'PRIMARY_MANAGER' || role === 'MANAGER' || role === 'OWNER';

  // Export filtered history to CSV
  const handleExportCsv = () => {
    if (filteredHistory.length === 0) return;
    const headers = [
      'Transaction ID',
      'Student Name',
      'Room Number',
      'Amount (BDT)',
      'Payment Method',
      'Status',
      'Date & Time (Dhaka)',
      'Verified By',
      'Notes',
    ];

    const rows = filteredHistory.map((d) => [
      `"${d.transactionRef || d.id.slice(0, 8)}"`,
      `"${d.userFullName.replace(/"/g, '""')}"`,
      `"${d.roomNumber || ''}"`,
      d.amount.toFixed(2),
      `"${d.paymentMethod}"`,
      `"${d.status}"`,
      `"${formatDhakaDateTime(d.createdAt || d.depositDate)}"`,
      `"${d.approvedByName || ''}"`,
      `"${(d.notes || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute(
      'download',
      `MessMate_Deposit_History_${new Date().toISOString().split('T')[0]}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const renderMethodBadge = (method: PaymentMethod | string) => {
    switch (method) {
      case 'BKASH':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-pink-50 text-[#E2136E] border border-pink-200">
            bKash
          </span>
        );
      case 'NAGAD':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-[#D97706] border border-amber-200">
            Nagad
          </span>
        );
      case 'BANK_TRANSFER':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
            Bank
          </span>
        );
      case 'CASH':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            Cash
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
            {method}
          </span>
        );
    }
  };

  if (!isManager) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <div className="p-8 bg-status-error/10 border border-status-error/30 rounded-card inline-flex flex-col items-center gap-3">
          <ShieldAlert className="w-12 h-12 text-status-error" />
          <h2 className="text-xl font-bold font-display text-slate-deep">Access Denied</h2>
          <p className="text-sm text-slate-muted max-w-md">
            Only mess managers and owners have permission to review, approve, or manage member deposits.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-card border border-slate-border shadow-subtle">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-terracotta">
            <Receipt className="w-4 h-4" />
            <span>Financial Approvals &amp; Transaction Ledger</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-display font-extrabold text-slate-deep mt-1">
            Deposit Management &amp; History
          </h1>
          <p className="text-xs sm:text-sm text-slate-muted mt-0.5">
            Process pending member deposit requests and review the permanent audited deposit transaction ledger.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {activeTab === 'history' && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportCsv}
              disabled={filteredHistory.length === 0}
              title="Download CSV statement of verified deposit history"
            >
              <Download className="w-4 h-4 mr-1.5 text-slate-600" />
              Export CSV
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={fetchDeposits}
            isLoading={isLoading}
          >
            <RefreshCw className="w-4 h-4 mr-1.5" />
            Refresh
          </Button>
        </div>
      </div>

      {feedback && (
        <Alert
          type={feedback.type}
          title={feedback.type === 'success' ? 'Verification Updated' : 'Action Failed'}
          onDismiss={() => setFeedback(null)}
        >
          {feedback.message}
        </Alert>
      )}

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Approved Deposits Card */}
        <div
          onClick={() => {
            setActiveTab('history');
            setHistoryStatusFilter('APPROVED');
          }}
          className={clsx(
            'p-4 rounded-card border transition-all cursor-pointer hover:shadow-md',
            activeTab === 'history' && historyStatusFilter === 'APPROVED'
              ? 'bg-sage-container/40 border-sage ring-2 ring-sage/30'
              : 'bg-sage-container/20 border-sage/40'
          )}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-sage-dark uppercase tracking-wider">
              Total Verified Deposits
            </span>
            <CheckCircle2 className="w-4 h-4 text-sage" />
          </div>
          <div className="font-display font-extrabold text-2xl text-slate-deep mt-1">
            ৳{approvedTotalSum.toLocaleString('en-US', { minimumFractionDigits: 0 })}
          </div>
          <div className="text-[11px] text-slate-muted mt-0.5 flex items-center justify-between">
            <span>{approvedCount} transactions credited</span>
            <span className="text-sage font-semibold text-[10px] flex items-center gap-0.5">
              View History <ArrowUpRight className="w-3 h-3" />
            </span>
          </div>
        </div>

        {/* Pending Review Card */}
        <div
          onClick={() => setActiveTab('requests')}
          className={clsx(
            'p-4 rounded-card border transition-all cursor-pointer hover:shadow-md',
            activeTab === 'requests'
              ? 'bg-amber-100/70 border-amber-400 ring-2 ring-amber-300'
              : 'bg-amber-50 border-amber-200'
          )}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-800 uppercase tracking-wider">
              Pending Verification
            </span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <div className="font-display font-extrabold text-2xl text-amber-950 mt-1">
            {pendingCount}
          </div>
          <div className="text-[11px] text-amber-700 mt-0.5 flex items-center justify-between">
            <span>{pendingCount > 0 ? 'Requires action' : 'All caught up'}</span>
            <span className="text-amber-800 font-semibold text-[10px] flex items-center gap-0.5">
              Review Queue <ArrowUpRight className="w-3 h-3" />
            </span>
          </div>
        </div>

        {/* Rejected Deposits Card */}
        <div
          onClick={() => {
            setActiveTab('history');
            setHistoryStatusFilter('REJECTED');
          }}
          className={clsx(
            'p-4 rounded-card border transition-all cursor-pointer hover:shadow-md',
            activeTab === 'history' && historyStatusFilter === 'REJECTED'
              ? 'bg-red-50 border-red-300 ring-2 ring-red-200'
              : 'bg-white border-slate-border shadow-subtle'
          )}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-muted uppercase tracking-wider">
              Rejected / Invalid
            </span>
            <XCircle className="w-4 h-4 text-red-500" />
          </div>
          <div className="font-display font-extrabold text-2xl text-slate-deep mt-1">
            {rejectedCount}
          </div>
          <div className="text-[11px] text-slate-muted mt-0.5 flex items-center justify-between">
            <span>Declined claims</span>
            <span className="text-slate-500 font-semibold text-[10px] flex items-center gap-0.5">
              View History <ArrowUpRight className="w-3 h-3" />
            </span>
          </div>
        </div>
      </div>

      {/* ─── TWO DISTINCT TOP-LEVEL TABS ─── */}
      <div className="flex items-center gap-2 border-b border-slate-border/80">
        <button
          onClick={() => setActiveTab('requests')}
          className={clsx(
            'flex items-center gap-2 pb-3 px-5 font-display font-bold text-sm border-b-2 transition-all tactile-btn',
            activeTab === 'requests'
              ? 'border-terracotta text-terracotta'
              : 'border-transparent text-slate-muted hover:text-slate-deep'
          )}
        >
          <Inbox className="w-4 h-4" />
          <span>Requests</span>
          <span
            className={clsx(
              'px-2 py-0.5 rounded-full text-xs font-semibold transition-colors',
              pendingCount > 0
                ? 'bg-amber-100 text-amber-800'
                : 'bg-canvas-tint text-slate-muted border border-slate-border/40'
            )}
          >
            {pendingCount}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('history')}
          className={clsx(
            'flex items-center gap-2 pb-3 px-5 font-display font-bold text-sm border-b-2 transition-all tactile-btn',
            activeTab === 'history'
              ? 'border-terracotta text-terracotta'
              : 'border-transparent text-slate-muted hover:text-slate-deep'
          )}
        >
          <Receipt className="w-4 h-4" />
          <span>History</span>
          <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-canvas-tint text-slate-muted border border-slate-border/40">
            {historyDeposits.length}
          </span>
        </button>
      </div>

      {/* ─── TAB 1: REQUESTS (ACTION QUEUE FOR PENDING DEPOSITS) ─── */}
      {activeTab === 'requests' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-display font-bold text-lg text-slate-deep">
                Pending Verification Queue
              </h2>
              <p className="text-xs text-slate-muted mt-0.5">
                Review payment receipts and transaction IDs submitted by members. Approvals immediately credit the student's dining ledger.
              </p>
            </div>
            {pendingRequests.length > 0 && (
              <span className="text-xs font-semibold text-amber-800 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">
                {pendingRequests.length} awaiting review
              </span>
            )}
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Skeleton className="h-48 rounded-card" />
              <Skeleton className="h-48 rounded-card" />
            </div>
          ) : pendingRequests.length === 0 ? (
            /* Calm Confirmation Empty State */
            <div className="p-12 text-center bg-white rounded-card border border-slate-border shadow-subtle">
              <div className="w-14 h-14 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-3 border border-emerald-100">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h3 className="font-display font-bold text-base text-slate-deep">
                No pending requests — all caught up
              </h3>
              <p className="text-xs text-slate-muted mt-1.5 max-w-md mx-auto leading-relaxed">
                All student deposit claims have been verified. Any new deposit requests submitted via bKash, Nagad, or Cash will appear here for review.
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setActiveTab('history')}
                className="mt-5 text-xs font-semibold"
              >
                <Receipt className="w-4 h-4 mr-1.5 text-slate-500" />
                View Deposit History ({historyDeposits.length})
              </Button>
            </div>
          ) : (
            /* Focused Action Card List */
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {pendingRequests.map((dep) => {
                const isCardLoading = loadingIds.has(dep.id);
                const cardError = cardErrors[dep.id];

                return (
                  <Card
                    key={dep.id}
                    className="p-5 border border-slate-border shadow-subtle hover:border-amber-300 transition-all flex flex-col justify-between"
                  >
                    <div className="space-y-4">
                      {/* Card Header: Student Info & Amount */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-terracotta-container/60 text-terracotta flex items-center justify-center font-bold text-sm shrink-0">
                            {dep.userFullName?.charAt(0) || 'U'}
                          </div>
                          <div>
                            <h3 className="font-bold text-sm text-slate-deep leading-tight">
                              {dep.userFullName}
                            </h3>
                            <span className="text-xs text-slate-muted font-medium flex items-center gap-1 mt-0.5">
                              <User className="w-3 h-3 text-slate-400" />
                              Room {dep.roomNumber || 'N/A'}
                            </span>
                          </div>
                        </div>

                        <div className="text-right">
                          <span className="text-[10px] uppercase font-bold text-slate-muted block">
                            Claimed Amount
                          </span>
                          <span className="font-display font-extrabold text-xl text-amber-900 block leading-tight">
                            ৳{dep.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                      </div>

                      {/* Metadata Pill Grid */}
                      <div className="bg-canvas-tint/70 p-3 rounded-input border border-slate-border/50 grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <span className="text-[10px] uppercase font-bold text-slate-muted block">
                            Payment Method
                          </span>
                          <div className="mt-1">{renderMethodBadge(dep.paymentMethod)}</div>
                        </div>

                        <div>
                          <span className="text-[10px] uppercase font-bold text-slate-muted block">
                            Submitted Time (Dhaka)
                          </span>
                          <span className="text-[11px] font-semibold text-slate-deep mt-1 flex items-center gap-1">
                            <Calendar className="w-3 h-3 text-slate-400" />
                            {formatDhakaDateTime(dep.createdAt || dep.depositDate)}
                          </span>
                        </div>

                        <div className="col-span-2 pt-1 border-t border-slate-border/40">
                          <span className="text-[10px] uppercase font-bold text-slate-muted block">
                            Transaction Reference (Trx ID)
                          </span>
                          {dep.transactionRef ? (
                            <div className="inline-flex items-center gap-2 mt-1 bg-white px-2.5 py-1 rounded border border-slate-border font-mono font-bold text-slate-deep text-xs">
                              <Hash className="w-3 h-3 text-slate-400" />
                              <span>{dep.transactionRef}</span>
                              <button
                                type="button"
                                onClick={() => handleCopyTrx(dep.transactionRef!, dep.id)}
                                className="text-slate-400 hover:text-slate-700 transition-colors ml-1"
                                title="Copy Transaction Ref"
                              >
                                {copiedId === dep.id ? (
                                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                                ) : (
                                  <Copy className="w-3.5 h-3.5" />
                                )}
                              </button>
                            </div>
                          ) : (
                            <span className="text-slate-400 italic text-[11px] mt-1 block">
                              Direct Cash Handover (No Trx ID)
                            </span>
                          )}
                        </div>

                        {dep.notes && (
                          <div className="col-span-2 pt-1 border-t border-slate-border/40">
                            <span className="text-[10px] uppercase font-bold text-slate-muted block">
                              Student Notes
                            </span>
                            <p className="text-[11px] text-slate-deep mt-0.5 leading-snug">
                              {dep.notes}
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Scoped Card Error Banner if any */}
                      {cardError && (
                        <div className="p-2.5 rounded bg-red-50 border border-red-200 text-status-error text-xs flex items-center gap-1.5 mt-2">
                          <XCircle className="w-3.5 h-3.5 shrink-0" />
                          <span>{cardError}</span>
                        </div>
                      )}
                    </div>

                    {/* Prominent Action Buttons */}
                    <div className="flex items-center gap-2.5 pt-4 mt-2 border-t border-slate-border/60">
                      <Button
                        variant="primary"
                        size="md"
                        onClick={() => handleApproveDeposit(dep)}
                        isLoading={isCardLoading}
                        disabled={isCardLoading}
                        className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-2.5 shadow-sm"
                      >
                        <CheckCircle2 className="w-4 h-4 mr-1.5" />
                        Approve (৳{dep.amount.toFixed(0)})
                      </Button>
                      <Button
                        variant="outline"
                        size="md"
                        onClick={() => {
                          setActiveReviewDeposit(dep);
                          setRejectionReason('');
                        }}
                        disabled={isCardLoading}
                        className="border-red-300 text-red-600 hover:bg-red-50 font-bold text-xs py-2.5"
                      >
                        <XCircle className="w-4 h-4 mr-1.5" />
                        Reject
                      </Button>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ─── TAB 2: HISTORY (READ-ONLY SETTLED DEPOSITS) ─── */}
      {activeTab === 'history' && (
        <Card className="p-4 sm:p-5 border border-slate-border shadow-subtle space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-2 border-b border-slate-border/50">
            <div>
              <h2 className="font-display font-bold text-lg text-slate-deep flex items-center gap-2">
                <span>Deposit History Ledger</span>
                <span className="text-xs font-normal text-slate-muted bg-canvas-tint px-2 py-0.5 rounded-full border border-slate-border">
                  {filteredHistory.length} record{filteredHistory.length !== 1 ? 's' : ''}
                </span>
              </h2>
              <p className="text-xs text-slate-muted mt-0.5">
                Permanent audit ledger of approved and rejected deposit transactions.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              {/* Payment Method Filter */}
              <div className="flex items-center gap-1.5">
                <Filter className="w-3.5 h-3.5 text-slate-muted hidden sm:inline" />
                <select
                  value={methodFilter}
                  onChange={(e) => setMethodFilter(e.target.value)}
                  className="text-xs font-semibold bg-canvas-tint border border-slate-border rounded-input px-2.5 py-2 text-slate-deep focus:outline-none focus:border-terracotta"
                >
                  <option value="ALL">All Methods</option>
                  <option value="BKASH">bKash</option>
                  <option value="NAGAD">Nagad</option>
                  <option value="BANK_TRANSFER">Bank Transfer</option>
                  <option value="CASH">Cash</option>
                </select>
              </div>

              {/* Search Input */}
              <div className="w-full sm:w-64">
                <Input
                  placeholder="Search student, Trx ID, room..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  leftIcon={<Search className="w-4 h-4 text-slate-muted" />}
                />
              </div>
            </div>
          </div>

          {/* History Status Filter Chips (Approved / Rejected / All) — No Pending here! */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
            <button
              onClick={() => setHistoryStatusFilter('ALL')}
              className={clsx(
                'px-3.5 py-1.5 rounded-button text-xs font-bold transition-all tactile-btn whitespace-nowrap',
                historyStatusFilter === 'ALL'
                  ? 'bg-slate-deep text-white shadow-subtle'
                  : 'bg-canvas-tint text-slate-muted hover:text-slate-deep border border-slate-border/50'
              )}
            >
              All History ({historyDeposits.length})
            </button>
            <button
              onClick={() => setHistoryStatusFilter('APPROVED')}
              className={clsx(
                'px-3.5 py-1.5 rounded-button text-xs font-bold transition-all tactile-btn whitespace-nowrap flex items-center gap-1.5',
                historyStatusFilter === 'APPROVED'
                  ? 'bg-emerald-700 text-white shadow-subtle'
                  : 'bg-canvas-tint text-slate-muted hover:text-slate-deep border border-slate-border/50'
              )}
            >
              <span>Approved / Credited</span>
              <span
                className={clsx(
                  'px-1.5 py-0.2 rounded-full text-[10px]',
                  historyStatusFilter === 'APPROVED' ? 'bg-white/20 text-white' : 'bg-emerald-100 text-emerald-800'
                )}
              >
                {approvedCount}
              </span>
            </button>
            <button
              onClick={() => setHistoryStatusFilter('REJECTED')}
              className={clsx(
                'px-3.5 py-1.5 rounded-button text-xs font-bold transition-all tactile-btn whitespace-nowrap flex items-center gap-1.5',
                historyStatusFilter === 'REJECTED'
                  ? 'bg-red-600 text-white shadow-subtle'
                  : 'bg-canvas-tint text-slate-muted hover:text-slate-deep border border-slate-border/50'
              )}
            >
              <span>Rejected</span>
              <span
                className={clsx(
                  'px-1.5 py-0.2 rounded-full text-[10px]',
                  historyStatusFilter === 'REJECTED' ? 'bg-white/20 text-white' : 'bg-red-100 text-red-800'
                )}
              >
                {rejectedCount}
              </span>
            </button>
          </div>

          {/* Mobile Card Conversion (< md) */}
          <div className="md:hidden space-y-3">
            {isLoading ? (
              <div className="space-y-3 p-3">
                <Skeleton className="h-24 w-full rounded-card" />
                <Skeleton className="h-24 w-full rounded-card" />
              </div>
            ) : filteredHistory.length === 0 ? (
              <div className="p-8 text-center text-slate-muted bg-canvas-tint/40 rounded-card border border-slate-border">
                <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-2 text-slate-400">
                  <Receipt className="w-6 h-6" />
                </div>
                <p className="font-bold text-sm text-slate-deep">No history records found</p>
                <p className="text-xs text-slate-muted mt-1 max-w-sm mx-auto">
                  {historyDeposits.length === 0
                    ? 'No approved or rejected deposits recorded yet.'
                    : 'No deposits match your current filters or search query.'}
                </p>
                {(historyStatusFilter !== 'ALL' || methodFilter !== 'ALL' || searchQuery !== '') && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setHistoryStatusFilter('ALL');
                      setMethodFilter('ALL');
                      setSearchQuery('');
                    }}
                    className="mt-3 text-xs"
                  >
                    Reset Filters
                  </Button>
                )}
              </div>
            ) : (
              filteredHistory.map((dep) => (
                <div
                  key={dep.id}
                  className="bg-white border border-slate-border rounded-card p-4 shadow-subtle flex flex-col gap-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-terracotta-container/60 text-terracotta flex items-center justify-center font-bold text-xs shrink-0">
                        {dep.userFullName?.charAt(0) || 'U'}
                      </div>
                      <div>
                        <span className="block font-bold text-sm text-slate-deep leading-tight">
                          {dep.userFullName}
                        </span>
                        <span className="block text-[11px] text-slate-muted">Room {dep.roomNumber || 'N/A'}</span>
                      </div>
                    </div>
                    <Badge
                      variant={dep.status === 'APPROVED' ? 'success' : 'error'}
                      size="sm"
                    >
                      {dep.status === 'APPROVED' && <CheckCircle2 className="w-3 h-3 mr-1 inline" />}
                      {dep.status === 'REJECTED' && <XCircle className="w-3 h-3 mr-1 inline" />}
                      {dep.status}
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between bg-canvas-tint/70 p-2.5 rounded-lg border border-slate-border/50">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-muted block">Amount</span>
                      <span
                        className={clsx(
                          'font-display font-extrabold text-base',
                          dep.status === 'APPROVED'
                            ? 'text-emerald-700'
                            : 'text-slate-400 line-through'
                        )}
                      >
                        +৳{dep.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] uppercase font-bold text-slate-muted block">Method</span>
                      {renderMethodBadge(dep.paymentMethod)}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs text-slate-muted">
                    <div>
                      <span className="block text-[10px] font-semibold text-slate-400 uppercase">Date &amp; Time</span>
                      <span className="text-slate-deep font-medium">{formatDhakaDateTime(dep.createdAt || dep.depositDate)}</span>
                    </div>
                    <div>
                      <span className="block text-[10px] font-semibold text-slate-400 uppercase">Trx Ref</span>
                      {dep.transactionRef ? (
                        <div className="inline-flex items-center gap-1 font-mono font-semibold text-slate-deep text-[11px]">
                          <span className="truncate max-w-[100px]">{dep.transactionRef}</span>
                          <button
                            type="button"
                            onClick={() => handleCopyTrx(dep.transactionRef!, dep.id)}
                            className="min-w-[28px] min-h-[28px] flex items-center justify-center text-slate-400 hover:text-slate-700 transition-colors"
                            title="Copy Trx Ref"
                          >
                            {copiedId === dep.id ? (
                              <Check className="w-3 h-3 text-emerald-600" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </button>
                        </div>
                      ) : (
                        <span className="italic">Cash / Direct</span>
                      )}
                    </div>
                  </div>

                  {dep.approvedByName && (
                    <div className="text-[11px] text-sage font-medium bg-sage-tint/30 px-2 py-1 rounded">
                      Verified by: {dep.approvedByName}
                    </div>
                  )}

                  <div className="pt-1 border-t border-slate-border/50">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedDetailsDeposit(dep)}
                      className="w-full min-h-[40px] text-xs justify-center"
                    >
                      <Eye className="w-3.5 h-3.5 mr-1.5 text-slate-500" />
                      View Deposit Receipt
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Read-only History Table (Desktop / Tablet >= md) */}
          <div className="hidden md:block overflow-x-auto rounded-lg border border-slate-border">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-canvas-tint/90 border-b border-slate-border text-slate-deep">
                  <th className="p-3 font-display font-bold whitespace-nowrap">Date &amp; Time</th>
                  <th className="p-3 font-display font-bold whitespace-nowrap">Transaction Ref</th>
                  <th className="p-3 font-display font-bold whitespace-nowrap">Student Member</th>
                  <th className="p-3 font-display font-bold whitespace-nowrap">Method</th>
                  <th className="p-3 font-display font-bold whitespace-nowrap">Amount</th>
                  <th className="p-3 font-display font-bold whitespace-nowrap">Status</th>
                  <th className="p-3 font-display font-bold whitespace-nowrap">Audit Trail</th>
                  <th className="p-3 font-display font-bold text-right whitespace-nowrap">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-border">
                {isLoading ? (
                  <tr>
                    <td colSpan={8} className="p-8 text-center">
                      <Skeleton className="h-6 w-full mb-2" />
                      <Skeleton className="h-6 w-3/4 mx-auto" />
                    </td>
                  </tr>
                ) : filteredHistory.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-12 text-center text-slate-muted">
                      <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-2 text-slate-400">
                        <Receipt className="w-6 h-6" />
                      </div>
                      <p className="font-bold text-sm text-slate-deep">No history records found</p>
                      <p className="text-xs text-slate-muted mt-1 max-w-sm mx-auto">
                        {historyDeposits.length === 0
                          ? 'No approved or rejected deposits recorded yet.'
                          : 'No deposits match your current filters or search query.'}
                      </p>
                      {(historyStatusFilter !== 'ALL' || methodFilter !== 'ALL' || searchQuery !== '') && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setHistoryStatusFilter('ALL');
                            setMethodFilter('ALL');
                            setSearchQuery('');
                          }}
                          className="mt-3 text-xs"
                        >
                          Reset Filters
                        </Button>
                      )}
                    </td>
                  </tr>
                ) : (
                  filteredHistory.map((dep) => (
                    <tr
                      key={dep.id}
                      className="hover:bg-canvas-tint/40 transition-colors"
                    >
                      {/* Date & Time */}
                      <td className="p-3 text-slate-deep whitespace-nowrap">
                        <div className="font-medium text-slate-deep">
                          {formatDhakaDateTime(dep.createdAt || dep.depositDate)}
                        </div>
                        <div className="text-[10px] text-slate-muted">
                          ID: #{dep.id.slice(0, 8)}
                        </div>
                      </td>

                      {/* Transaction Ref / ID */}
                      <td className="p-3 whitespace-nowrap">
                        {dep.transactionRef ? (
                          <div className="inline-flex items-center gap-1.5 bg-canvas-tint px-2 py-0.5 rounded border border-slate-border font-mono font-semibold text-slate-deep text-[11px]">
                            <span>{dep.transactionRef}</span>
                            <button
                              type="button"
                              onClick={() => handleCopyTrx(dep.transactionRef!, dep.id)}
                              className="text-slate-400 hover:text-slate-700 transition-colors"
                              title="Copy Transaction Ref"
                            >
                              {copiedId === dep.id ? (
                                <Check className="w-3 h-3 text-emerald-600" />
                              ) : (
                                <Copy className="w-3 h-3" />
                              )}
                            </button>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic text-[11px]">Cash / Direct</span>
                        )}
                      </td>

                      {/* Student Member */}
                      <td className="p-3 font-bold text-slate-deep whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-terracotta-container/60 text-terracotta flex items-center justify-center font-bold text-xs shrink-0">
                            {dep.userFullName?.charAt(0) || 'U'}
                          </div>
                          <div>
                            <span className="block text-slate-deep font-semibold">{dep.userFullName}</span>
                            <span className="block text-[10px] text-slate-muted font-normal">
                              Room {dep.roomNumber || 'N/A'}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Method */}
                      <td className="p-3 whitespace-nowrap">
                        {renderMethodBadge(dep.paymentMethod)}
                      </td>

                      {/* Amount */}
                      <td className="p-3 whitespace-nowrap">
                        <span
                          className={clsx(
                            'font-display font-extrabold text-sm',
                            dep.status === 'APPROVED'
                              ? 'text-emerald-700'
                              : 'text-slate-400 line-through'
                          )}
                        >
                          +৳{dep.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </span>
                      </td>

                      {/* Status Badge */}
                      <td className="p-3 whitespace-nowrap">
                        <Badge
                          variant={dep.status === 'APPROVED' ? 'success' : 'error'}
                          size="sm"
                        >
                          {dep.status === 'APPROVED' && <CheckCircle2 className="w-3 h-3 mr-1 inline" />}
                          {dep.status === 'REJECTED' && <XCircle className="w-3 h-3 mr-1 inline" />}
                          {dep.status}
                        </Badge>
                      </td>

                      {/* Audit Trail & Notes */}
                      <td className="p-3 max-w-xs">
                        {dep.approvedByName ? (
                          <span className="text-[11px] text-sage font-semibold block">
                            Verified by {dep.approvedByName}
                          </span>
                        ) : (
                          <span className="text-[11px] text-red-600 font-medium block">
                            Declined Claim
                          </span>
                        )}
                        {dep.notes && (
                          <span className="text-[11px] text-slate-muted mt-0.5 block truncate max-w-xs">
                            {dep.notes}
                          </span>
                        )}
                      </td>

                      {/* Actions: Strictly Read-Only (Receipt) */}
                      <td className="p-3 text-right whitespace-nowrap">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedDetailsDeposit(dep)}
                          className="text-slate-600 hover:text-slate-deep text-xs px-2.5 py-1"
                        >
                          <Eye className="w-3.5 h-3.5 mr-1 text-slate-400" />
                          Receipt
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Reject Reason Modal (Triggered from Requests Tab) */}
      <Modal
        isOpen={!!activeReviewDeposit}
        onClose={() => setActiveReviewDeposit(null)}
        title="Reject Deposit Claim"
        maxWidth="sm"
      >
        <div className="space-y-4">
          <p className="text-xs text-slate-deep leading-relaxed">
            You are rejecting the deposit claim of{' '}
            <strong className="text-terracotta">
              ৳{activeReviewDeposit?.amount.toFixed(2)}
            </strong>{' '}
            from <strong>{activeReviewDeposit?.userFullName} — Room {activeReviewDeposit?.roomNumber || 'N/A'}</strong>.
          </p>

          <div>
            <label className="block text-xs font-bold text-slate-deep mb-1">
              Rejection Reason (Optional)
            </label>
            <textarea
              className="w-full h-20 p-3 rounded-input bg-[#F4F0E8] border border-transparent focus:border-terracotta focus:ring-1 focus:ring-terracotta outline-none text-xs text-slate-deep resize-none"
              placeholder="e.g. Transaction ID not found in bKash merchant statement..."
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-border">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setActiveReviewDeposit(null)}
              disabled={!!activeReviewDeposit && loadingIds.has(activeReviewDeposit.id)}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={handleConfirmReject}
              isLoading={!!activeReviewDeposit && loadingIds.has(activeReviewDeposit.id)}
              disabled={!!activeReviewDeposit && loadingIds.has(activeReviewDeposit.id)}
            >
              Confirm Rejection
            </Button>
          </div>
        </div>
      </Modal>

      {/* Transaction Details / Receipt Modal (Read-Only) */}
      <Modal
        isOpen={!!selectedDetailsDeposit}
        onClose={() => setSelectedDetailsDeposit(null)}
        title="Deposit Receipt & Audit Log"
        maxWidth="md"
      >
        {selectedDetailsDeposit && (
          <div className="space-y-5">
            {/* Amount Banner */}
            <div className="p-4 rounded-card bg-canvas-tint border border-slate-border flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold text-slate-muted uppercase tracking-wider block">
                  Deposit Amount
                </span>
                <span className="font-display font-extrabold text-2xl text-slate-deep">
                  ৳{selectedDetailsDeposit.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </span>
              </div>
              <Badge
                variant={
                  selectedDetailsDeposit.status === 'APPROVED'
                    ? 'success'
                    : selectedDetailsDeposit.status === 'PENDING'
                    ? 'warning'
                    : 'error'
                }
                size="md"
              >
                {selectedDetailsDeposit.status}
              </Badge>
            </div>

            {/* Details Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-input bg-white border border-slate-border/70">
                <span className="text-slate-muted block text-[10px] uppercase font-semibold">Student Member</span>
                <span className="font-bold text-slate-deep mt-0.5 block">
                  {selectedDetailsDeposit.userFullName}
                </span>
                <span className="text-slate-500 text-[11px] block">
                  Room: {selectedDetailsDeposit.roomNumber || 'N/A'}
                </span>
              </div>

              <div className="p-3 rounded-input bg-white border border-slate-border/70">
                <span className="text-slate-muted block text-[10px] uppercase font-semibold">Payment Method</span>
                <div className="mt-1">{renderMethodBadge(selectedDetailsDeposit.paymentMethod)}</div>
              </div>

              <div className="p-3 rounded-input bg-white border border-slate-border/70">
                <span className="text-slate-muted block text-[10px] uppercase font-semibold">Transaction Reference</span>
                <span className="font-mono font-bold text-slate-deep mt-0.5 block">
                  {selectedDetailsDeposit.transactionRef || 'N/A'}
                </span>
              </div>

              <div className="p-3 rounded-input bg-white border border-slate-border/70">
                <span className="text-slate-muted block text-[10px] uppercase font-semibold">Date &amp; Time (Dhaka)</span>
                <span className="font-semibold text-slate-deep mt-0.5 block">
                  {formatDhakaDateTime(selectedDetailsDeposit.createdAt || selectedDetailsDeposit.depositDate)}
                </span>
              </div>

              <div className="p-3 rounded-input bg-white border border-slate-border/70">
                <span className="text-slate-muted block text-[10px] uppercase font-semibold">Verification Audit</span>
                <span className="font-semibold text-slate-deep mt-0.5 block">
                  {selectedDetailsDeposit.approvedByName
                    ? `Verified by ${selectedDetailsDeposit.approvedByName}`
                    : selectedDetailsDeposit.status === 'PENDING'
                    ? 'Pending verification'
                    : 'Rejected'}
                </span>
              </div>

              <div className="p-3 rounded-input bg-white border border-slate-border/70">
                <span className="text-slate-muted block text-[10px] uppercase font-semibold">Ledger Impact</span>
                <span className="font-semibold text-emerald-700 mt-0.5 block">
                  {selectedDetailsDeposit.status === 'APPROVED'
                    ? `+৳${selectedDetailsDeposit.amount.toFixed(2)} Credited to Balance`
                    : 'No balance impact'}
                </span>
              </div>
            </div>

            {/* Notes if any */}
            {selectedDetailsDeposit.notes && (
              <div className="p-3 rounded-input bg-canvas-tint/70 border border-slate-border text-xs">
                <span className="text-slate-muted font-bold block mb-0.5">Notes / Remarks:</span>
                <p className="text-slate-deep">{selectedDetailsDeposit.notes}</p>
              </div>
            )}

            {/* Close Button */}
            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-border">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedDetailsDeposit(null)}
              >
                Close Receipt
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
