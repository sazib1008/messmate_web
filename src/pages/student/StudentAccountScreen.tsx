import React, { useState, useEffect } from 'react';
import {
  Wallet,
  PlusCircle,
  Clock,
  CheckCircle2,
  XCircle,
  Receipt,
  ShoppingBag,
  TrendingDown,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../api/client';
import type {
  DepositDto,
  CalculationPreviewDto,
  PaymentMethod,
  ExpenseDto,
  ExpenseCategory,
} from '../../types';
import {
  Button,
  Card,
  CardContent,
  Badge,
  Input,
  Select,
  Modal,
  Alert,
  Skeleton,
} from '../../components/common';

export interface StudentAccountScreenProps {
  initialOpenDepositModal?: boolean;
}

// ── Expense category labels & colours ────────────────────────────────────────
const CATEGORY_META: Record<
  ExpenseCategory,
  { label: string; colour: string; bg: string }
> = {
  MEAL_VARIABLE: {
    label: 'Meal Variable',
    colour: 'text-emerald-700',
    bg: 'bg-emerald-50',
  },
  FIXED_OVERHEAD: {
    label: 'Fixed Overhead',
    colour: 'text-blue-700',
    bg: 'bg-blue-50',
  },
  INDIVIDUAL_DIRECT: {
    label: 'Individual Direct',
    colour: 'text-purple-700',
    bg: 'bg-purple-50',
  },
  AD_HOC_SPECIAL: {
    label: 'Ad-Hoc Special',
    colour: 'text-amber-700',
    bg: 'bg-amber-50',
  },
  OTHER: {
    label: 'Other (Ad-Hoc Split)',
    colour: 'text-amber-700',
    bg: 'bg-amber-50',
  },
};

export const StudentAccountScreen: React.FC<StudentAccountScreenProps> = ({
  initialOpenDepositModal = false,
}) => {
  const { user, activeMembership } = useAuth();

  const [calculation, setCalculation] = useState<CalculationPreviewDto | null>(null);
  const [deposits, setDeposits] = useState<DepositDto[]>([]);
  const [expenses, setExpenses] = useState<ExpenseDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDepositModalOpen, setIsDepositModalOpen] = useState(initialOpenDepositModal);
  const [depositAmount, setDepositAmount] = useState('2000');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('BKASH');
  const [transactionRef, setTransactionRef] = useState('');
  const [depositNotes, setDepositNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [alertInfo, setAlertInfo] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [expensesExpanded, setExpensesExpanded] = useState(true);

  const fetchAccountData = async () => {
    if (!activeMembership) return;
    const messId = activeMembership.messId;
    setIsLoading(true);
    try {
      // 1. Fetch calculation preview
      const calc = await api.get<CalculationPreviewDto>(
        `/calculations/preview?messId=${messId}`
      );
      setCalculation(calc);

      // 2. Fetch student deposits (students get only their own via the backend filter)
      const myDeposits = await api.get<DepositDto[]>(
        `/deposits?messId=${messId}`
      );
      setDeposits(myDeposits);

      // 3. Fetch cycle expenses for the mess (read-only; backend returns all for any member)
      const expenseData = await api.get<ExpenseDto[]>(
        `/expenses?messId=${messId}`
      );
      setExpenses(expenseData);
    } catch (err: any) {
      console.error('Error fetching account data:', err.message || err);
    } finally {
      setIsLoading(false);
    }
  };

  const messId = activeMembership?.messId;

  useEffect(() => {
    fetchAccountData();
  }, [messId]);

  useEffect(() => {
    if (alertInfo) {
      const t = setTimeout(() => setAlertInfo(null), 5000);
      return () => clearTimeout(t);
    }
  }, [alertInfo]);

  const mySummary = calculation?.memberSummaries.find((m) => m.userId === user?.id);
  const isRateVolatile = calculation?.isRateVolatile || (!calculation?.final && (calculation?.totalCountedUnits ?? 0) < 15);

  const handleSubmitDeposit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAlertInfo(null);
    setIsSubmitting(true);
    try {
      const amountNum = parseFloat(depositAmount);
      if (isNaN(amountNum) || amountNum <= 0) {
        throw new Error('Please enter a valid deposit amount.');
      }

      await api.post('/deposits', {
        amount: amountNum,
        paymentMethod,
        transactionRef: transactionRef.trim() || undefined,
        notes: depositNotes.trim() || undefined,
      });

      setIsDepositModalOpen(false);
      setTransactionRef('');
      setDepositNotes('');
      setAlertInfo({
        type: 'success',
        message: 'Deposit request submitted successfully! It is pending manager approval.',
      });
      fetchAccountData();
    } catch (err: any) {
      setAlertInfo({
        type: 'error',
        message: err.message || 'Failed to submit deposit request.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Aggregate totals by category for a quick breakdown header
  const expenseTotals = expenses.reduce(
    (acc, e) => {
      acc[e.category] = (acc[e.category] || 0) + e.amount;
      return acc;
    },
    {} as Record<string, number>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-8 pt-6 sm:pt-8 space-y-8">
      {/* Header */}
      <section className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs uppercase font-bold tracking-wider text-terracotta flex items-center gap-1">
              <Wallet className="w-3.5 h-3.5" />
              Financial Ledger &amp; Balance
            </span>
          </div>
          <h1 className="font-display font-extrabold text-2xl sm:text-3xl text-slate-deep tracking-tight">
            Account &amp; Balance
          </h1>
          <p className="text-xs sm:text-sm text-slate-muted font-body mt-0.5">
            {user?.fullName} — Room {user?.roomNumber || 'N/A'} • Transparent breakdown of your meal units, approved deposits, and running dues
          </p>
        </div>

        <Button
          variant="primary"
          size="md"
          onClick={() => setIsDepositModalOpen(true)}
          icon={<PlusCircle className="w-4 h-4" />}
        >
          Top Up Deposit
        </Button>
      </section>

      {/* Alert banner */}
      {alertInfo && (
        <Alert type={alertInfo.type} onDismiss={() => setAlertInfo(null)}>
          {alertInfo.message}
        </Alert>
      )}

      {/* Negative Balance Alert */}
      {mySummary?.hasNegativeBalance && (
        isRateVolatile ? (
          <Alert type="info" title="Provisional Early-Cycle Balance">
            Your current balance shows a tentative deficit of{' '}
            <strong className="text-slate-deep font-mono">
              -৳{Math.abs(mySummary.netBalance).toFixed(2)}
            </strong>
            . This is based on a provisional early-cycle meal rate calculated with only{' '}
            <strong>{calculation?.totalCountedUnits ?? 0} total meal units</strong> logged mess-wide so far.
            As more meals are consumed and recorded, the rate and balance will stabilize. This is an early estimate, not a settled debt.
          </Alert>
        ) : (
          <Alert type="warning" title="Negative Due Warning">
            Your balance is currently in deficit at{' '}
            <strong className="text-status-error font-mono">
              -৳{Math.abs(mySummary.netBalance).toFixed(2)}
            </strong>
            . Please deposit funds via bKash, Nagad, or Cash to ensure uninterrupted meal service.
          </Alert>
        )
      )}

      {/* Financial Overview Bento Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Main Balance Card (5 Cols) */}
        <div className="lg:col-span-5 bg-gradient-to-br from-terracotta via-[#d04412] to-coral text-white rounded-card p-6 sm:p-8 shadow-level2 relative overflow-hidden flex flex-col justify-between min-h-[340px]">
          <div>
            <div className="flex justify-between items-start">
              <div>
                <span className="text-white/80 text-xs uppercase tracking-wider font-semibold block">
                  Net Available Balance
                </span>
                <span className="font-display font-extrabold text-3xl sm:text-4xl text-white mt-1 block tracking-tight">
                  {isLoading ? (
                    '৳ ...'
                  ) : mySummary ? (
                    `৳ ${mySummary.netBalance.toFixed(2)}`
                  ) : (
                    '৳ 0.00'
                  )}
                </span>
              </div>
              <Badge
                variant={mySummary?.hasNegativeBalance ? (isRateVolatile ? 'warning' : 'error') : 'success'}
                size="md"
                className="bg-white/20 text-white border-white/20"
              >
                {mySummary?.hasNegativeBalance
                  ? (isRateVolatile ? 'Provisional Due' : 'Negative Due')
                  : 'Active Deposit'}
              </Badge>
            </div>

            <p className="text-xs text-white/80 mt-2 font-body leading-relaxed">
              {isRateVolatile
                ? 'Provisional — early cycle rate will stabilize as more meals are logged across the mess.'
                : 'Calculated dynamically as: Approved Deposits minus (Member Units + Guest Units) × Current Running Rate.'}
            </p>
          </div>

          <div className="pt-4 border-t border-white/20 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-white/70 text-[11px] block">Current Running Rate</span>
                {isRateVolatile && (
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-white/25 text-white uppercase tracking-wider">
                    Provisional
                  </span>
                )}
              </div>
              <span className="font-display font-bold text-lg text-white">
                ৳ {calculation?.mealRate.toFixed(2) || '0.00'}{' '}
                <span className="text-xs font-normal text-white/70">/ unit</span>
              </span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsDepositModalOpen(true)}
              className="bg-white text-terracotta hover:bg-slate-50 border-transparent shadow-subtle"
            >
              Deposit Funds
            </Button>
          </div>
        </div>

        {/* Right: Running Pipeline Breakdown (7 Cols) */}
        <Card className="lg:col-span-7">
          <CardContent className="p-6 sm:p-7 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-display font-bold text-lg text-slate-deep">
                Cycle Calculation Breakdown
              </h3>
              {isRateVolatile && (
                <span className="text-[11px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-0.5 rounded-full">
                  Provisional Early Rate
                </span>
              )}
            </div>

            {isLoading ? (
              <div className="space-y-3">
                <Skeleton variant="rectangular" height={40} />
                <Skeleton variant="rectangular" height={40} />
                <Skeleton variant="rectangular" height={40} />
              </div>
            ) : (
              <div className="space-y-3 font-body text-xs sm:text-sm">
                <div className="p-3.5 bg-canvas-tint/70 rounded-input flex items-center justify-between">
                  <span className="text-slate-muted">Total Approved Advance Deposits</span>
                  <span className="font-display font-bold text-slate-deep">
                    + ৳ {mySummary?.totalDeposits.toFixed(2) || '0.00'}
                  </span>
                </div>

                <div className="p-3.5 bg-canvas-tint/70 rounded-input flex items-center justify-between">
                  <div>
                    <span className="text-slate-muted block">Student Personal Meal Cost</span>
                    <span className="text-[11px] text-slate-muted/80">
                      {mySummary?.totalMemberUnits.toFixed(1) || '0.0'} units × ৳{calculation?.mealRate.toFixed(2)}
                    </span>
                  </div>
                  <span className="font-display font-bold text-status-error">
                    - ৳ {mySummary?.mealCost.toFixed(2) || '0.00'}
                  </span>
                </div>

                <div className="p-3.5 bg-canvas-tint/70 rounded-input flex items-center justify-between">
                  <div>
                    <span className="text-slate-muted block">Guest Meals Cost</span>
                    <span className="text-[11px] text-slate-muted/80">
                      {mySummary?.totalGuestUnits.toFixed(1) || '0.0'} guest units
                    </span>
                  </div>
                  <span className="font-display font-bold text-status-error">
                    - ৳ {mySummary?.guestCost.toFixed(2) || '0.00'}
                  </span>
                </div>

                {(mySummary?.fixedOverheadCost ?? 0) > 0 && (
                  <div className="p-3.5 bg-blue-50/50 rounded-input flex items-center justify-between">
                    <div>
                      <span className="text-blue-900 block font-medium">Fixed Overhead Share (1/N)</span>
                      <span className="text-[11px] text-blue-700/80">
                        Cook salary, utilities, gas, Wi-Fi
                      </span>
                    </div>
                    <span className="font-display font-bold text-status-error">
                      - ৳ {(mySummary?.fixedOverheadCost ?? 0).toFixed(2)}
                    </span>
                  </div>
                )}

                {(mySummary?.individualDirectCost ?? 0) > 0 && (
                  <div className="p-3.5 bg-purple-50/50 rounded-input flex items-center justify-between">
                    <div>
                      <span className="text-purple-900 block font-medium">Individual Direct Charges</span>
                      <span className="text-[11px] text-purple-700/80">
                        Room rent, private penalties, direct charges
                      </span>
                    </div>
                    <span className="font-display font-bold text-status-error">
                      - ৳ {(mySummary?.individualDirectCost ?? 0).toFixed(2)}
                    </span>
                  </div>
                )}

                {(mySummary?.adHocSpecialCost ?? 0) > 0 && (
                  <div className="p-3.5 bg-amber-50/50 rounded-input flex items-center justify-between">
                    <div>
                      <span className="text-amber-900 block font-medium">Ad-Hoc Special Events Share</span>
                      <span className="text-[11px] text-amber-700/80">
                        Feasts, BBQ, special utensil repairs
                      </span>
                    </div>
                    <span className="font-display font-bold text-status-error">
                      - ৳ {(mySummary?.adHocSpecialCost ?? 0).toFixed(2)}
                    </span>
                  </div>
                )}

                <div className="p-4 bg-slate-50 rounded-input border border-slate-border flex items-center justify-between font-bold">
                  <span className="text-slate-deep">Calculated Net Balance</span>
                  <span
                    className={`font-display text-base ${
                      mySummary?.hasNegativeBalance ? 'text-status-error' : 'text-slate-deep'
                    }`}
                  >
                    ৳ {mySummary?.netBalance.toFixed(2) || '0.00'}
                  </span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── Cycle Expense Ledger (read-only for students) ─────────────────── */}
      <Card>
        <CardContent className="p-6">
          {/* Section header with collapse toggle */}
          <button
            type="button"
            onClick={() => setExpensesExpanded((v) => !v)}
            className="w-full flex items-center justify-between pb-4 border-b border-slate-border/60 text-left group"
          >
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0">
                <ShoppingBag className="w-4.5 h-4.5 text-emerald-700" />
              </div>
              <div>
                <h3 className="font-display font-bold text-lg text-slate-deep leading-tight">
                  Cycle Expense Ledger
                </h3>
                <p className="text-xs text-slate-muted mt-0.5">
                  Read-only view of all recorded mess expenses that determine your meal rate
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {!isLoading && expenses.length > 0 && (
                <div className="flex items-center gap-1.5 text-xs font-semibold text-status-error bg-red-50 px-2.5 py-1 rounded-full border border-red-100">
                  <TrendingDown className="w-3.5 h-3.5" />
                  ৳{expenses.reduce((s, e) => s + e.amount, 0).toLocaleString('en-US', { minimumFractionDigits: 0 })} total
                </div>
              )}
              {expensesExpanded ? (
                <ChevronUp className="w-4 h-4 text-slate-muted group-hover:text-slate-deep transition-colors" />
              ) : (
                <ChevronDown className="w-4 h-4 text-slate-muted group-hover:text-slate-deep transition-colors" />
              )}
            </div>
          </button>

          {expensesExpanded && (
            <>
              {/* Category summary chips */}
              {!isLoading && expenses.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-4">
                  {(Object.keys(expenseTotals) as ExpenseCategory[]).map((cat) => {
                    const meta = CATEGORY_META[cat] || CATEGORY_META.MEAL_VARIABLE;
                    return (
                      <span
                        key={cat}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold ${meta.bg} ${meta.colour} border border-current/10`}
                      >
                        {meta.label}: ৳{expenseTotals[cat].toLocaleString('en-US', { minimumFractionDigits: 0 })}
                      </span>
                    );
                  })}
                </div>
              )}

              {isLoading ? (
                <div className="space-y-3 mt-4">
                  <Skeleton variant="rectangular" height={46} />
                  <Skeleton variant="rectangular" height={46} />
                  <Skeleton variant="rectangular" height={46} />
                </div>
              ) : expenses.length === 0 ? (
                <div className="py-12 text-center">
                  <ShoppingBag className="w-8 h-8 text-slate-muted/40 mx-auto mb-3" />
                  <p className="text-sm font-semibold text-slate-muted">No expenses recorded for this cycle yet.</p>
                  <p className="text-xs text-slate-muted/70 mt-1">
                    Expenses recorded by managers will appear here and affect your meal rate.
                  </p>
                </div>
              ) : (
                <>
                  {/* Mobile Expense Cards (< md) */}
                  <div className="md:hidden space-y-3 mt-4">
                    {expenses.map((exp) => {
                      const meta = CATEGORY_META[exp.category] || CATEGORY_META.MEAL_VARIABLE;
                      return (
                        <div
                          key={exp.id}
                          className="bg-canvas-tint/40 border border-slate-border/80 rounded-card p-3.5 shadow-subtle flex flex-col gap-2"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span
                              className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${meta.bg} ${meta.colour}`}
                            >
                              {meta.label}
                            </span>
                            <span className="text-xs text-slate-muted">
                              {new Date(exp.expenseDate).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric',
                              })}
                            </span>
                          </div>

                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0 flex-1">
                              <h5 className="font-semibold text-sm text-slate-deep leading-tight">
                                {exp.title}
                              </h5>
                              {exp.notes && (
                                <p className="text-[11px] text-slate-muted mt-0.5 italic">
                                  {exp.notes}
                                </p>
                              )}
                            </div>
                            <span className="font-display font-bold text-sm text-slate-deep shrink-0">
                              ৳ {exp.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                            </span>
                          </div>
                        </div>
                      );
                    })}

                    {/* Total Card on Mobile */}
                    <div className="bg-canvas-tint p-3.5 rounded-card border-2 border-slate-border flex items-center justify-between">
                      <span className="font-bold text-xs text-slate-deep">Total Cycle Expenses</span>
                      <span className="font-display font-extrabold text-sm text-slate-deep">
                        ৳ {expenses
                          .reduce((s, e) => s + e.amount, 0)
                          .toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>

                  {/* Desktop / Tablet Expense Table (>= md) */}
                  <div className="hidden md:block overflow-x-auto mt-4">
                    <table className="w-full text-left text-xs font-body">
                      <thead>
                        <tr className="border-b border-slate-border/60 text-slate-muted uppercase tracking-wider text-[11px]">
                          <th className="py-3 px-3">Date</th>
                          <th className="py-3 px-3">Category</th>
                          <th className="py-3 px-3">Description</th>
                          <th className="py-3 px-3 text-right">Amount</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-border/40">
                        {expenses.map((exp) => {
                          const meta = CATEGORY_META[exp.category] || CATEGORY_META.MEAL_VARIABLE;
                          return (
                            <tr key={exp.id} className="hover:bg-canvas-tint/30 transition-colors">
                              <td className="py-3.5 px-3 font-semibold text-slate-deep whitespace-nowrap">
                                {new Date(exp.expenseDate).toLocaleDateString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                  year: 'numeric',
                                })}
                              </td>
                              <td className="py-3.5 px-3">
                                <span
                                  className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${meta.bg} ${meta.colour}`}
                                >
                                  {meta.label}
                                </span>
                              </td>
                              <td className="py-3.5 px-3">
                                <span className="font-medium text-slate-deep">{exp.title}</span>
                                {exp.notes && (
                                  <span className="block text-[11px] text-slate-muted mt-0.5 truncate max-w-[200px]">
                                    {exp.notes}
                                  </span>
                                )}
                              </td>
                              <td className="py-3.5 px-3 text-right font-display font-bold text-slate-deep whitespace-nowrap">
                                ৳ {exp.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                      <tfoot>
                        <tr className="border-t-2 border-slate-border bg-canvas-tint/50">
                          <td colSpan={3} className="py-3 px-3 font-bold text-slate-deep text-xs">
                            Total Cycle Expenses
                          </td>
                          <td className="py-3 px-3 text-right font-display font-extrabold text-slate-deep text-sm">
                            ৳ {expenses
                              .reduce((s, e) => s + e.amount, 0)
                              .toLocaleString('en-US', { minimumFractionDigits: 2 })}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </>
              )}

              {/* Informational note about how expenses affect the rate */}
              {!isLoading && expenses.length > 0 && (
                <div className="mt-4 p-3 bg-blue-50/60 rounded-input border border-blue-100 text-[11px] text-blue-800 leading-relaxed">
                  <strong>How this affects you:</strong> The current running meal rate is calculated as{' '}
                  <span className="font-mono">Σ MEAL_VARIABLE expenses ÷ Σ total consumed meal units</span> across all members.
                  Fixed overhead, individual direct, and ad-hoc charges are split separately.
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Deposit Transaction History Table */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-border/60">
            <div>
              <h3 className="font-display font-bold text-lg text-slate-deep">
                Deposit History &amp; Receipts
              </h3>
              <p className="text-xs text-slate-muted mt-0.5">
                Audit record of advance payments submitted to hall managers
              </p>
            </div>
            <Receipt className="w-5 h-5 text-slate-muted" />
          </div>

          {isLoading ? (
            <div className="space-y-3 mt-4">
              <Skeleton variant="rectangular" height={50} />
              <Skeleton variant="rectangular" height={50} />
            </div>
          ) : deposits.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-muted">
              No deposit records found. Click "Top Up Deposit" above to record your advance payment.
            </div>
          ) : (
            <>
              {/* Mobile Deposit History Cards (< md) */}
              <div className="md:hidden space-y-3 mt-4">
                {deposits.map((dep) => (
                  <div
                    key={dep.id}
                    className="bg-canvas-tint/40 border border-slate-border/80 rounded-card p-3.5 shadow-subtle flex flex-col gap-2.5"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs text-slate-muted font-medium">
                        {new Date(dep.depositDate).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </span>
                      {dep.status === 'APPROVED' && (
                        <span className="inline-flex items-center gap-1 text-[11px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3" /> Approved
                        </span>
                      )}
                      {dep.status === 'PENDING' && (
                        <span className="inline-flex items-center gap-1 text-[11px] text-amber-700 font-bold bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                          <Clock className="w-3 h-3" /> Pending Review
                        </span>
                      )}
                      {dep.status === 'REJECTED' && (
                        <span className="inline-flex items-center gap-1 text-[11px] text-status-error font-bold bg-red-50 px-2 py-0.5 rounded-full border border-red-200">
                          <XCircle className="w-3 h-3" /> Rejected
                        </span>
                      )}
                    </div>

                    <div className="flex items-baseline justify-between gap-2">
                      <div>
                        <span className="text-[10px] uppercase font-bold text-slate-muted block">Amount</span>
                        <span className="font-display font-extrabold text-base text-slate-deep">
                          ৳ {dep.amount.toFixed(2)}
                        </span>
                      </div>
                      <span className="px-2 py-0.5 rounded-full bg-canvas-tint text-slate-deep font-semibold text-xs border border-slate-border/60">
                        {dep.paymentMethod}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-muted pt-2 border-t border-slate-border/50">
                      <div>
                        <span className="block text-[10px] uppercase font-semibold text-slate-400">Trx Ref</span>
                        <span className="font-mono text-slate-deep font-semibold truncate block">
                          {dep.transactionRef || 'Cash / Direct'}
                        </span>
                      </div>
                      <div>
                        <span className="block text-[10px] uppercase font-semibold text-slate-400">Reviewed By</span>
                        <span className="text-slate-deep truncate block">
                          {dep.approvedByName || 'Pending'}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop / Tablet Deposit Table (>= md) */}
              <div className="hidden md:block overflow-x-auto mt-4">
                <table className="w-full text-left text-xs font-body">
                  <thead>
                    <tr className="border-b border-slate-border/60 text-slate-muted uppercase tracking-wider text-[11px]">
                      <th className="py-3 px-3">Date</th>
                      <th className="py-3 px-3">Amount</th>
                      <th className="py-3 px-3">Method</th>
                      <th className="py-3 px-3">Trx ID / Ref</th>
                      <th className="py-3 px-3">Status</th>
                      <th className="py-3 px-3">Reviewed By</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-border/40">
                    {deposits.map((dep) => (
                      <tr key={dep.id} className="hover:bg-canvas-tint/30 transition-colors">
                        <td className="py-3.5 px-3 font-semibold text-slate-deep">
                          {new Date(dep.depositDate).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </td>
                        <td className="py-3.5 px-3 font-display font-bold text-slate-deep">
                          ৳ {dep.amount.toFixed(2)}
                        </td>
                        <td className="py-3.5 px-3">
                          <span className="px-2 py-0.5 rounded-full bg-canvas-tint text-slate-deep font-semibold border border-slate-border/40">
                            {dep.paymentMethod}
                          </span>
                        </td>
                        <td className="py-3.5 px-3 font-mono text-slate-muted">
                          {dep.transactionRef || '—'}
                        </td>
                        <td className="py-3.5 px-3">
                          {dep.status === 'APPROVED' && (
                            <span className="inline-flex items-center gap-1 text-emerald-700 font-bold">
                              <CheckCircle2 className="w-3.5 h-3.5" /> Approved
                            </span>
                          )}
                          {dep.status === 'PENDING' && (
                            <span className="inline-flex items-center gap-1 text-amber-700 font-bold">
                              <Clock className="w-3.5 h-3.5" /> Pending Review
                            </span>
                          )}
                          {dep.status === 'REJECTED' && (
                            <span className="inline-flex items-center gap-1 text-status-error font-bold">
                              <XCircle className="w-3.5 h-3.5" /> Rejected
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-3 text-slate-muted">
                          {dep.approvedByName || '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Top Up Deposit Modal */}
      <Modal
        isOpen={isDepositModalOpen}
        onClose={() => setIsDepositModalOpen(false)}
        title="Submit Advance Deposit"
        description="Funds will be credited to your dining wallet once reviewed by a hall manager."
      >
        <form onSubmit={handleSubmitDeposit} className="space-y-4">
          <Input
            label="Deposit Amount (BDT)"
            type="number"
            min="10"
            step="10"
            value={depositAmount}
            onChange={(e) => setDepositAmount(e.target.value)}
            required
          />

          <Select
            label="Payment Method"
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value as any)}
            options={[
              { value: 'BKASH', label: 'bKash (017XXXXXXXX)' },
              { value: 'NAGAD', label: 'Nagad' },
              { value: 'CASH', label: 'Cash to Manager' },
              { value: 'BANK_TRANSFER', label: 'Bank Transfer' },
            ]}
          />

          <Input
            label="Transaction ID / Receipt Reference"
            placeholder="e.g. 9BKS7821A"
            value={transactionRef}
            onChange={(e) => setTransactionRef(e.target.value)}
            helperText="Enter the transaction ID received from your mobile wallet"
          />

          <Input
            label="Notes (Optional)"
            placeholder="e.g. Advance payment for September"
            value={depositNotes}
            onChange={(e) => setDepositNotes(e.target.value)}
          />

          <div className="pt-2 flex flex-col-reverse sm:flex-row justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              size="md"
              onClick={() => setIsDepositModalOpen(false)}
              disabled={isSubmitting}
              className="w-full sm:w-auto min-h-[44px] justify-center"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="md"
              isLoading={isSubmitting}
              className="w-full sm:w-auto min-h-[44px] justify-center"
            >
              Submit Deposit
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
