import React, { useState, useEffect } from 'react';
import {
  Receipt,
  PlusCircle,
  Search,
  RefreshCw,
  Users,
  UserCheck,
  Info,
  CheckSquare,
  Square,
  ShieldAlert,
  Trash2,
  AlertTriangle,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../api/client';
import type { ExpenseDto, ExpenseCategory, CreateExpenseRequest, MemberDto } from '../../types';
import { getTodayDhaka } from '../../utils/dhakaDate';
import {
  Card,
  Button,
  Input,
  Select,
  Modal,
  Alert,
  Skeleton,
} from '../../components/common';
import { clsx } from 'clsx';

interface CategoryConfig {
  id: ExpenseCategory;
  label: string;
  shortLabel: string;
  accountingRule: string;
  description: string;
  badgeStyle: string;
}

const CATEGORIES: CategoryConfig[] = [
  {
    id: 'MEAL_VARIABLE',
    label: 'Meal Variable (Groceries, Meat, Fish, Veg, Spices)',
    shortLabel: 'Meal Variable',
    accountingRule: 'Meal Rate pool: Σ Expenses / Σ Consumed Meals',
    description: 'Groceries, vegetables, meat, fish, spices, cooking oil, rice, dal.',
    badgeStyle: 'bg-emerald-50 text-emerald-700 border-emerald-300',
  },
  {
    id: 'FIXED_OVERHEAD',
    label: 'Fixed Overhead (Cook Salary, Gas, Utilities, Wi-Fi)',
    shortLabel: 'Fixed Overhead',
    accountingRule: 'Equal 1/N split across all active mess members',
    description: 'Cook/maid salary, LPG gas refills, electricity, water, Wi-Fi, cleaning supplies.',
    badgeStyle: 'bg-blue-50 text-blue-700 border-blue-300',
  },
  {
    id: 'INDIVIDUAL_DIRECT',
    label: 'Individual Direct (Seat Rent, Private Penalty, Personal Charge)',
    shortLabel: 'Individual Direct',
    accountingRule: '100% directly assigned to selected target member',
    description: 'Seat/room rent, private penalty, or direct charges assigned to a single member.',
    badgeStyle: 'bg-purple-50 text-purple-700 border-purple-300',
  },
  {
    id: 'AD_HOC_SPECIAL',
    label: 'Ad-Hoc Special (Feasts, BBQ, Repairs, Events)',
    shortLabel: 'Ad-Hoc Special',
    accountingRule: 'Split equally among opt-in participants (0 for non-participants)',
    description: 'Feasts, barbecues, one-off events, or kitchen utensil repair.',
    badgeStyle: 'bg-amber-50 text-amber-700 border-amber-300',
  },
  {
    id: 'OTHER',
    label: 'Other (Ad-Hoc Split)',
    shortLabel: 'Other (Ad-Hoc Split)',
    accountingRule: 'Split among selected participants (or all if empty)',
    description: 'Miscellaneous expenses split among selected participants (or all if none selected).',
    badgeStyle: 'bg-amber-50 text-amber-700 border-amber-300',
  },
];

/**
 * Validates expense item descriptions to prevent empty, too-short, or keyboard-mashed garbage input.
 */
const validateExpenseTitle = (title: string): string | null => {
  const trimmed = title.trim();
  if (!trimmed) return 'Please enter an expense title / description.';
  if (trimmed.length < 3) return 'Expense title must be at least 3 characters long.';
  if (trimmed.length > 120) return 'Expense title must be under 120 characters.';
  // Must contain letters (supports English and Bengali)
  if (!/[a-zA-Z\u0980-\u09FF]/.test(trimmed)) {
    return 'Expense title must contain descriptive text/letters.';
  }
  // Prevent single repeated character spam (e.g. "aaaaa" or "......")
  if (/^(.)\1{3,}$/i.test(trimmed)) {
    return 'Expense title appears invalid (repeated characters).';
  }
  // Detect keyboard mashing in long continuous words without vowels (e.g., "ratgaeynyre" or "qwrtyp")
  const words = trimmed.split(/\s+/);
  for (const word of words) {
    const cleanWord = word.replace(/[^a-zA-Z]/g, '');
    if (cleanWord.length >= 7 && !/[aeiouyAEIOUY]/.test(cleanWord)) {
      return `"${word}" does not appear to be a valid item name.`;
    }
  }
  return null;
};

export const ManagerExpenseScreen: React.FC = () => {
  const { activeMembership } = useAuth();
  const [expenses, setExpenses] = useState<ExpenseDto[]>([]);
  const [members, setMembers] = useState<MemberDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newCategory, setNewCategory] = useState<ExpenseCategory>('MEAL_VARIABLE');
  const [newTitle, setNewTitle] = useState('');
  const [newAmount, setNewAmount] = useState('');
  const [newExpenseDate, setNewExpenseDate] = useState(
    getTodayDhaka() // Use Asia/Dhaka date — toISOString() gives UTC which is one day behind pre-6 AM
  );
  const [newReceiptUrl, setNewReceiptUrl] = useState('');
  const [newNotes, setNewNotes] = useState('');
  const [targetMemberId, setTargetMemberId] = useState('');
  const [participantIds, setParticipantIds] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Soft confirmation modal state for oversized amounts
  const [showHighAmountModal, setShowHighAmountModal] = useState(false);
  const [pendingExpensePayload, setPendingExpensePayload] = useState<CreateExpenseRequest | null>(null);

  // Delete modal state
  const [expenseToDelete, setExpenseToDelete] = useState<ExpenseDto | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [feedback, setFeedback] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  useEffect(() => {
    fetchExpenses();
    fetchMembers();
  }, [activeMembership?.messId]);

  const fetchExpenses = async () => {
    if (!activeMembership?.messId) return;
    setIsLoading(true);
    try {
      const data = await api.get<ExpenseDto[]>(
        `/expenses?messId=${activeMembership.messId}`
      );
      setExpenses(data);
    } catch (err: any) {
      console.error('Failed to load expenses:', err);
      setFeedback({
        type: 'error',
        message: err.message || 'Unable to fetch expense records',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchMembers = async () => {
    if (!activeMembership?.messId) return;
    try {
      const data = await api.get<MemberDto[]>(
        `/messes/${activeMembership.messId}/members`
      );
      setMembers(data);
    } catch (err) {
      console.error('Failed to load members for expense allocation:', err);
    }
  };

  const handleOpenModal = () => {
    setNewCategory('MEAL_VARIABLE');
    setNewTitle('');
    setNewAmount('');
    setNewReceiptUrl('');
    setNewNotes('');
    setTargetMemberId('');
    // By default, select all active members for convenience if switching to ad-hoc
    setParticipantIds(members.filter((m) => m.status === 'ACTIVE').map((m) => m.userId));
    setIsModalOpen(true);
  };

  const toggleParticipant = (userId: string) => {
    setParticipantIds((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  const toggleSelectAllParticipants = () => {
    const activeMemberIds = members.filter((m) => m.status === 'ACTIVE').map((m) => m.userId);
    if (participantIds.length === activeMemberIds.length) {
      setParticipantIds([]);
    } else {
      setParticipantIds(activeMemberIds);
    }
  };

  const executeCreateExpense = async (payload: CreateExpenseRequest) => {
    if (!activeMembership?.messId) return;
    setIsSubmitting(true);
    setFeedback(null);
    try {
      await api.post<ExpenseDto>('/expenses', {
        ...payload,
        messId: activeMembership.messId,
      });

      setFeedback({
        type: 'success',
        message: `Successfully recorded ৳${payload.amount.toFixed(2)} under ${
          CATEGORIES.find((c) => c.id === payload.category)?.shortLabel
        } for "${payload.title}".`,
      });

      // Reset modal fields
      setIsModalOpen(false);
      setShowHighAmountModal(false);
      setPendingExpensePayload(null);
      setNewTitle('');
      setNewAmount('');
      setNewReceiptUrl('');
      setNewNotes('');
      setTargetMemberId('');
      setParticipantIds([]);

      // Refresh list
      await fetchExpenses();
    } catch (err: any) {
      console.error('Failed to create expense:', err);
      setFeedback({
        type: 'error',
        message: err.message || 'Failed to record expense. Please try again.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeMembership?.messId) return;

    const titleError = validateExpenseTitle(newTitle);
    if (titleError) {
      setFeedback({ type: 'error', message: titleError });
      return;
    }

    const parsedAmount = parseFloat(newAmount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setFeedback({ type: 'error', message: 'Please enter a valid expense amount' });
      return;
    }
    if (parsedAmount > 10000000) {
      setFeedback({ type: 'error', message: 'Expense amount exceeds the maximum allowable ceiling of ৳10,000,000.' });
      return;
    }

    if (newCategory === 'INDIVIDUAL_DIRECT' && !targetMemberId) {
      setFeedback({
        type: 'error',
        message: 'Please select a target member to assign this direct charge.',
      });
      return;
    }

    if (newCategory === 'AD_HOC_SPECIAL' && participantIds.length === 0) {
      setFeedback({
        type: 'error',
        message: 'Please select at least 1 participant for this ad-hoc special event.',
      });
      return;
    }

    const payload: CreateExpenseRequest = {
      category: newCategory,
      title: newTitle.trim(),
      amount: parsedAmount,
      expenseDate: newExpenseDate,
      receiptUrl: newReceiptUrl.trim() || undefined,
      notes: newNotes.trim() || undefined,
      targetMemberId: newCategory === 'INDIVIDUAL_DIRECT' ? targetMemberId : null,
      participantIds: newCategory === 'AD_HOC_SPECIAL' ? participantIds : [],
    };

    // Sanity check: Check for unusually large amount
    const avgExpense = expenses.length > 0 ? totalExpenseSum / expenses.length : 0;
    const isUnusuallyHigh = parsedAmount >= 50000 || (avgExpense > 0 && parsedAmount >= 10 * avgExpense && parsedAmount >= 10000);

    if (isUnusuallyHigh) {
      setPendingExpensePayload(payload);
      setShowHighAmountModal(true);
      return;
    }

    await executeCreateExpense(payload);
  };

  const handleDeleteExpense = async () => {
    if (!expenseToDelete) return;
    setIsDeleting(true);
    try {
      await api.delete(`/expenses/${expenseToDelete.id}`);
      setFeedback({
        type: 'success',
        message: `Successfully deleted expense "${expenseToDelete.title}" (৳${expenseToDelete.amount.toFixed(2)}). Meal rate and member balances have been recalculated.`,
      });
      setExpenseToDelete(null);
      await fetchExpenses();
    } catch (err: any) {
      console.error('Failed to delete expense:', err);
      setFeedback({
        type: 'error',
        message: err.message || 'Failed to delete expense. Active cycles allow deletion, but concluded cycles are locked.',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  // Filtered expenses
  const filteredExpenses = React.useMemo(() => {
    return expenses.filter((exp) => {
      const matchCategory =
        selectedCategory === 'ALL' || exp.category === selectedCategory;
      const matchSearch =
        searchQuery === '' ||
        exp.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        exp.recordedByName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (exp.targetMemberName &&
          exp.targetMemberName.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (exp.notes && exp.notes.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchCategory && matchSearch;
    });
  }, [expenses, selectedCategory, searchQuery]);

  // Aggregate totals
  const totalExpenseSum = React.useMemo(() => {
    return expenses.reduce((sum, e) => sum + e.amount, 0);
  }, [expenses]);

  // Category breakdown amounts
  const categoryTotals = React.useMemo(() => {
    const totals: Record<string, number> = {};
    for (const cat of CATEGORIES) {
      totals[cat.id] = 0;
    }
    for (const e of expenses) {
      totals[e.category] = (totals[e.category] || 0) + e.amount;
    }
    return totals;
  }, [expenses]);

  const role = activeMembership?.role;
  const isManager = role === 'PRIMARY_MANAGER' || role === 'MANAGER' || role === 'OWNER';

  if (!isManager) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <div className="p-8 bg-status-error/10 border border-status-error/30 rounded-card inline-flex flex-col items-center gap-3">
          <ShieldAlert className="w-12 h-12 text-status-error" />
          <h2 className="text-xl font-bold font-display text-slate-deep">Access Denied</h2>
          <p className="text-sm text-slate-muted max-w-md">
            Only mess managers and owners have permission to access the expense management ledger and record purchases.
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
            <span>4-Tier Expense Accounting</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-display font-extrabold text-slate-deep mt-1">
            Mess Expenses Ledger
          </h1>
          <p className="text-xs sm:text-sm text-slate-muted mt-0.5 max-w-2xl">
            Streamlined 4-tier model: variable meal ingredients, equal fixed overhead, 100% individual
            charges, and opt-in ad-hoc event splits.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchExpenses}
            isLoading={isLoading}
          >
            <RefreshCw className="w-4 h-4 mr-1.5" />
            Refresh
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={handleOpenModal}
            className="shadow-level1"
          >
            <PlusCircle className="w-4 h-4 mr-1.5" />
            Add New Expense
          </Button>
        </div>
      </div>

      {feedback && (
        <Alert
          type={feedback.type}
          title={feedback.type === 'success' ? 'Expense Saved' : 'Error'}
          onDismiss={() => setFeedback(null)}
        >
          {feedback.message}
        </Alert>
      )}

      {/* 4-Tier Spend Breakdown Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
        {/* Total Card */}
        <div className="p-4 rounded-card bg-terracotta-container/30 border border-terracotta/40">
          <div className="text-[11px] font-bold text-terracotta-dark uppercase tracking-wider">
            Total Cycle Procurement
          </div>
          <div className="font-display font-extrabold text-xl sm:text-2xl text-slate-deep mt-1">
            ৳{totalExpenseSum.toLocaleString('en-US', { minimumFractionDigits: 0 })}
          </div>
          <div className="text-[10px] text-slate-muted mt-0.5">
            {expenses.length} total entries recorded
          </div>
        </div>

        {/* 4 Categories */}
        {CATEGORIES.map((cat) => {
          const amt = categoryTotals[cat.id] || 0;
          const pct = totalExpenseSum > 0 ? (amt / totalExpenseSum) * 100 : 0;
          return (
            <div
              key={cat.id}
              className="p-4 rounded-card bg-white border border-slate-border shadow-subtle flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-muted uppercase tracking-wider">
                    {cat.shortLabel}
                  </span>
                  <span className="text-[10px] text-slate-400 font-medium">
                    {pct.toFixed(1)}%
                  </span>
                </div>
                <div className="font-display font-extrabold text-lg sm:text-xl text-slate-deep mt-1">
                  ৳{amt.toLocaleString('en-US', { minimumFractionDigits: 0 })}
                </div>
              </div>
              <div className="text-[10px] text-slate-500 mt-2 pt-2 border-t border-slate-100 flex items-center gap-1">
                <Info className="w-3 h-3 text-slate-400 shrink-0" />
                <span className="truncate">{cat.accountingRule}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Search & Filter Bar */}
      <Card className="p-4 border border-slate-border shadow-subtle space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Category Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
            <button
              onClick={() => setSelectedCategory('ALL')}
              className={clsx(
                'px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all tactile-btn',
                selectedCategory === 'ALL'
                  ? 'bg-slate-deep text-white shadow-subtle'
                  : 'bg-slate-100 text-slate-muted hover:bg-slate-200'
              )}
            >
              All Tiers ({expenses.length})
            </button>
            {CATEGORIES.map((cat) => {
              const count = expenses.filter((e) => e.category === cat.id).length;
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={clsx(
                    'px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all tactile-btn',
                    selectedCategory === cat.id
                      ? 'bg-terracotta text-white shadow-subtle'
                      : 'bg-canvas-tint text-slate-muted hover:bg-canvas-tint/80 border border-slate-border/60'
                  )}
                >
                  {cat.shortLabel} ({count})
                </button>
              );
            })}
          </div>

          {/* Text Search Input */}
          <div className="w-full md:w-72">
            <Input
              placeholder="Search title, member, notes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              leftIcon={<Search className="w-4 h-4 text-slate-muted" />}
            />
          </div>
        </div>

        {/* Expenses Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-canvas-tint/90 border-b border-slate-border text-slate-deep">
                <th className="p-3 font-display font-bold">Date</th>
                <th className="p-3 font-display font-bold">Tier / Category</th>
                <th className="p-3 font-display font-bold">Title & Allocation</th>
                <th className="p-3 font-display font-bold">Recorded By</th>
                <th className="p-3 font-display font-bold text-right">Amount (BDT)</th>
                <th className="p-3 font-display font-bold text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-border">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center">
                    <Skeleton className="h-6 w-full mb-2" />
                    <Skeleton className="h-6 w-3/4 mx-auto" />
                  </td>
                </tr>
              ) : filteredExpenses.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-12 text-center text-slate-muted">
                    <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-2 text-slate-400">
                      <Receipt className="w-6 h-6" />
                    </div>
                    <p className="font-bold text-sm text-slate-deep">No expenses found</p>
                    <p className="text-xs text-slate-muted mt-1">
                      {searchQuery || selectedCategory !== 'ALL'
                        ? 'Try clearing your filters or search terms.'
                        : 'Record your first expense by clicking "Add New Expense" above.'}
                    </p>
                  </td>
                </tr>
              ) : (
                filteredExpenses.map((exp) => {
                  const catConfig = CATEGORIES.find((c) => c.id === exp.category);
                  return (
                    <tr
                      key={exp.id}
                      className="hover:bg-canvas-tint/40 transition-colors"
                    >
                      <td className="p-3 font-semibold text-slate-deep whitespace-nowrap">
                        {exp.expenseDate}
                      </td>
                      <td className="p-3 whitespace-nowrap">
                        <span
                          className={clsx(
                            'inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold border',
                            catConfig?.badgeStyle || 'bg-slate-100 text-slate-700 border-slate-200'
                          )}
                        >
                          {catConfig?.shortLabel || exp.category}
                        </span>
                      </td>
                      <td className="p-3">
                        <div className="font-bold text-slate-deep text-sm">
                          {exp.title}
                        </div>

                        {/* Accounting Allocation Label */}
                        <div className="mt-1">
                          {exp.category === 'INDIVIDUAL_DIRECT' && (
                            <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-purple-50 text-purple-800 text-[11px] font-medium border border-purple-200">
                              <UserCheck className="w-3 h-3 text-purple-600" />
                              <span>
                                Charged 100% to:{' '}
                                <strong>
                                  {(() => {
                                    const target = members.find((m) => m.userId === exp.targetMemberId);
                                    const name = exp.targetMemberName || target?.fullName || 'Specific Member';
                                    const room = target?.roomNumber;
                                    return room ? `${name} — Room ${room}` : name;
                                  })()}
                                </strong>
                              </span>
                            </div>
                          )}

                          {(exp.category === 'AD_HOC_SPECIAL' || exp.category === 'OTHER') && (
                            <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-amber-50 text-amber-800 text-[11px] font-medium border border-amber-200">
                              <Users className="w-3 h-3 text-amber-600" />
                              <span>
                                Opt-in Split:{' '}
                                {exp.participantIds && exp.participantIds.length > 0 ? (
                                  <>
                                    <strong>{exp.participantIds.length}</strong> participants (৳
                                    {(exp.amount / exp.participantIds.length).toFixed(2)}/each)
                                  </>
                                ) : (
                                  <span>All members (৳{(exp.amount / (members.length || 1)).toFixed(2)}/each)</span>
                                )}
                              </span>
                            </div>
                          )}

                          {exp.category === 'FIXED_OVERHEAD' && (
                            <span className="text-[11px] text-blue-700 font-medium">
                              Equal 1/N overhead share among all active members
                            </span>
                          )}

                          {exp.category === 'MEAL_VARIABLE' && (
                            <span className="text-[11px] text-emerald-700 font-medium">
                              Pooled meal cost → factors into meal rate
                            </span>
                          )}
                        </div>

                        {exp.notes && (
                          <p className="text-[11px] text-slate-muted mt-1 italic">
                            {exp.notes}
                          </p>
                        )}
                        {exp.receiptUrl && (
                          <span className="text-[10px] text-terracotta underline mt-0.5 block">
                            Receipt Ref: {exp.receiptUrl}
                          </span>
                        )}
                      </td>
                      <td className="p-3 text-slate-muted whitespace-nowrap">
                        {exp.recordedByName}
                      </td>
                      <td className="p-3 text-right whitespace-nowrap">
                        <span className="font-display font-extrabold text-sm sm:text-base text-slate-deep">
                          ৳{exp.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </span>
                      </td>
                      <td className="p-3 text-center whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => setExpenseToDelete(exp)}
                          className="p-1.5 text-slate-400 hover:text-status-error hover:bg-status-error/10 rounded transition-colors inline-flex items-center justify-center"
                          title="Delete expense"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Add Expense Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => !isSubmitting && setIsModalOpen(false)}
        title="Record Mess Expense (4-Tier Accounting)"
        maxWidth="lg"
      >
        <form onSubmit={handleCreateExpense} className="space-y-4">
          {/* Category Selection */}
          <div>
            <label className="block text-xs font-bold text-slate-deep mb-1">
              Expense Tier / Category <span className="text-terracotta">*</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {CATEGORIES.map((cat) => {
                const isSelected = newCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => {
                      setNewCategory(cat.id);
                      if ((cat.id === 'AD_HOC_SPECIAL' || cat.id === 'OTHER') && participantIds.length === 0) {
                        setParticipantIds(
                          members.filter((m) => m.status === 'ACTIVE').map((m) => m.userId)
                        );
                      }
                    }}
                    className={clsx(
                      'text-left p-3 rounded-card border transition-all text-xs flex flex-col justify-between',
                      isSelected
                        ? 'border-terracotta bg-terracotta/5 shadow-subtle ring-1 ring-terracotta'
                        : 'border-slate-border bg-white hover:border-slate-300'
                    )}
                  >
                    <div>
                      <div className="font-bold text-slate-deep flex items-center justify-between">
                        <span>{cat.shortLabel}</span>
                        {isSelected && (
                          <span className="w-2 h-2 rounded-full bg-terracotta" />
                        )}
                      </div>
                      <p className="text-[11px] text-slate-muted mt-1 leading-snug">
                        {cat.description}
                      </p>
                    </div>
                    <div className="text-[10px] text-terracotta font-semibold mt-2 pt-1 border-t border-slate-100">
                      {cat.accountingRule}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Conditional Allocation: INDIVIDUAL_DIRECT */}
          {newCategory === 'INDIVIDUAL_DIRECT' && (
            <div className="p-3.5 rounded-card bg-purple-50/70 border border-purple-200 space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-purple-900">
                <UserCheck className="w-4 h-4 text-purple-700" />
                <span>Assign Direct Charge to Target Member</span>
              </div>
              <p className="text-[11px] text-purple-700">
                This expense will be charged 100% directly to this selected member's bill. It is excluded from the general meal rate.
              </p>
              <div>
                <Select
                  value={targetMemberId}
                  onChange={(e) => setTargetMemberId(e.target.value)}
                  options={[
                    { value: '', label: '-- Select Member to Charge 100% --' },
                    ...members.map((m) => ({
                      value: m.userId,
                      label: `${m.fullName} — Room ${m.roomNumber || 'N/A'} (${m.role})`,
                    })),
                  ]}
                  required
                />
              </div>
            </div>
          )}

          {/* Conditional Allocation: AD_HOC_SPECIAL or OTHER */}
          {(newCategory === 'AD_HOC_SPECIAL' || newCategory === 'OTHER') && (
            <div className="p-3.5 rounded-card bg-amber-50/70 border border-amber-200 space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs font-bold text-amber-900">
                  <Users className="w-4 h-4 text-amber-700" />
                  <span>Opt-In Event Participants ({participantIds.length} Selected)</span>
                </div>
                <button
                  type="button"
                  onClick={toggleSelectAllParticipants}
                  className="text-[11px] font-bold text-amber-800 hover:text-amber-900 underline"
                >
                  {participantIds.length === members.filter((m) => m.status === 'ACTIVE').length
                    ? 'Deselect All'
                    : 'Select All Active'}
                </button>
              </div>
              <div className="p-2.5 rounded-input bg-amber-100/60 border border-amber-300 text-[11px] text-amber-900 space-y-1">
                <p className="font-semibold">
                  Other expenses are split only among selected participants (like Ad-Hoc/Special). Leave participants empty to split equally across all members.
                </p>
                {participantIds.length === 0 ? (
                  <p className="text-amber-800 italic">No participants selected → expense will be split equally across all active mess members.</p>
                ) : (
                  <p className="text-amber-800">
                    The total cost will be split equally among only the {participantIds.length} selected participant(s). Non-participants pay ৳0.
                  </p>
                )}
                {parseFloat(newAmount) > 0 && participantIds.length > 0 && (
                  <strong className="block text-amber-950 font-bold mt-0.5">
                    Estimated share: ৳{(parseFloat(newAmount) / participantIds.length).toFixed(2)} per participant.
                  </strong>
                )}
              </div>

              {/* Participant Checkbox Grid */}
              <div className="max-h-40 overflow-y-auto grid grid-cols-1 sm:grid-cols-2 gap-1.5 pr-1 bg-white p-2 rounded border border-amber-200">
                {members.map((m) => {
                  const isChecked = participantIds.includes(m.userId);
                  return (
                    <button
                      key={m.userId}
                      type="button"
                      onClick={() => toggleParticipant(m.userId)}
                      className={clsx(
                        'flex items-center gap-2 p-1.5 rounded text-left text-xs transition-colors',
                        isChecked
                          ? 'bg-amber-100/60 text-amber-900 font-semibold'
                          : 'hover:bg-slate-50 text-slate-700'
                      )}
                    >
                      {isChecked ? (
                        <CheckSquare className="w-4 h-4 text-amber-700 shrink-0" />
                      ) : (
                        <Square className="w-4 h-4 text-slate-400 shrink-0" />
                      )}
                      <span className="truncate">{m.fullName} — Room {m.roomNumber || 'N/A'}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Conditional Info: FIXED_OVERHEAD */}
          {newCategory === 'FIXED_OVERHEAD' && (
            <div className="p-3 rounded-card bg-blue-50/70 border border-blue-200 flex items-start gap-2 text-xs text-blue-800">
              <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
              <div>
                <strong>Fixed Overhead Accounting:</strong> This expense is divided equally (1/N) across all{' '}
                {members.filter((m) => m.status === 'ACTIVE').length || 1} active members in this mess cycle,
                regardless of the number of meals eaten or days present.
              </div>
            </div>
          )}

          {/* Conditional Info: MEAL_VARIABLE */}
          {newCategory === 'MEAL_VARIABLE' && (
            <div className="p-3 rounded-card bg-emerald-50/70 border border-emerald-200 flex items-start gap-2 text-xs text-emerald-800">
              <Info className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <strong>Meal Variable Accounting:</strong> This expense directly funds the kitchen grocery pool.
                It is divided by total consumed meals (including guest meals) to determine the per-meal rate.
              </div>
            </div>
          )}

          {/* Title / Description */}
          <div>
            <label className="block text-xs font-bold text-slate-deep mb-1">
              Title / Item Description <span className="text-terracotta">*</span>
            </label>
            <Input
              placeholder="e.g. 25kg Miniket Rice, Beef 5kg, Cook Salary for Sept"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              required
            />
          </div>

          {/* Amount and Date */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-deep mb-1">
                Amount (BDT) <span className="text-terracotta">*</span>
              </label>
              <Input
                type="number"
                placeholder="2500"
                value={newAmount}
                onChange={(e) => setNewAmount(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-deep mb-1">
                Date of Purchase / Billing
              </label>
              <Input
                type="date"
                value={newExpenseDate}
                onChange={(e) => setNewExpenseDate(e.target.value)}
                required
              />
            </div>
          </div>

          {/* Receipt Reference */}
          <div>
            <label className="block text-xs font-bold text-slate-deep mb-1">
              Receipt Reference / Voucher ID (Optional)
            </label>
            <Input
              placeholder="e.g. VOUCHER-2026-09-001 or memo number"
              value={newReceiptUrl}
              onChange={(e) => setNewReceiptUrl(e.target.value)}
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-bold text-slate-deep mb-1">
              Notes & Supplier Details (Optional)
            </label>
            <textarea
              className="w-full h-16 p-3 rounded-input bg-[#F4F0E8] border border-transparent focus:border-terracotta focus:ring-1 focus:ring-terracotta outline-none text-xs text-slate-deep resize-none"
              placeholder="Purchased from Kawran Bazar vendor with cash memo..."
              value={newNotes}
              onChange={(e) => setNewNotes(e.target.value)}
            />
          </div>

          <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-border">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsModalOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              isLoading={isSubmitting}
              className="shadow-level1"
            >
              Confirm & Record Expense
            </Button>
          </div>
        </form>
      </Modal>

      {/* High-Amount Soft Confirmation Modal */}
      <Modal
        isOpen={showHighAmountModal}
        onClose={() => !isSubmitting && setShowHighAmountModal(false)}
        title="Unusually High Amount Confirmation"
        maxWidth="md"
      >
        <div className="space-y-4">
          <div className="p-4 rounded-card bg-amber-50 border border-amber-200 flex items-start gap-3">
            <AlertTriangle className="w-6 h-6 text-amber-600 shrink-0 mt-0.5" />
            <div className="text-xs text-amber-900 space-y-1">
              <p className="font-bold text-sm">
                This amount (৳{pendingExpensePayload?.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}) looks unusually high. Are you sure?
              </p>
              <p>
                You are recording this expense under{' '}
                <strong>
                  {CATEGORIES.find((c) => c.id === pendingExpensePayload?.category)?.shortLabel}
                </strong>
                .
              </p>
              {pendingExpensePayload?.category === 'MEAL_VARIABLE' && (
                <p className="text-amber-800 font-medium">
                  Notice: Meal Variable expenses directly drive the mess meal rate. An oversized entry—especially early in the cycle with low meal counts—can produce an extreme meal rate and generate large negative due warnings for students.
                </p>
              )}
            </div>
          </div>

          <div className="p-3 rounded-input bg-canvas-tint/70 text-xs space-y-1">
            <div className="flex justify-between">
              <span className="text-slate-muted">Title:</span>
              <span className="font-semibold text-slate-deep">{pendingExpensePayload?.title}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-muted">Category:</span>
              <span className="font-semibold text-slate-deep">
                {CATEGORIES.find((c) => c.id === pendingExpensePayload?.category)?.shortLabel}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-muted">Amount:</span>
              <span className="font-bold font-display text-slate-deep text-sm">
                ৳{pendingExpensePayload?.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowHighAmountModal(false)}
              disabled={isSubmitting}
            >
              Go Back &amp; Check
            </Button>
            <Button
              type="button"
              variant="primary"
              onClick={() => {
                if (pendingExpensePayload) {
                  executeCreateExpense(pendingExpensePayload);
                }
              }}
              isLoading={isSubmitting}
              className="bg-amber-600 hover:bg-amber-700 text-white border-transparent"
            >
              Yes, Record ৳{pendingExpensePayload?.amount.toLocaleString()}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete Expense Confirmation Modal */}
      <Modal
        isOpen={!!expenseToDelete}
        onClose={() => !isDeleting && setExpenseToDelete(null)}
        title="Delete Expense Record"
        maxWidth="sm"
      >
        <div className="space-y-4">
          <div className="p-4 rounded-card bg-status-error/10 border border-status-error/20 flex items-start gap-3">
            <Trash2 className="w-5 h-5 text-status-error shrink-0 mt-0.5" />
            <div className="text-xs text-slate-deep space-y-1">
              <p className="font-bold text-sm">Delete this expense?</p>
              <p className="text-slate-muted">
                Are you sure you want to delete{' '}
                <strong>"{expenseToDelete?.title}"</strong> for{' '}
                <strong>
                  ৳{expenseToDelete?.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </strong>
                ?
              </p>
              <p className="text-slate-muted">
                This will immediately remove it from all mess financial calculations and restore the correct meal rate and member balances.
              </p>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setExpenseToDelete(null)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="primary"
              onClick={handleDeleteExpense}
              isLoading={isDeleting}
              className="bg-status-error hover:bg-red-700 text-white border-transparent"
            >
              Confirm Delete
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
