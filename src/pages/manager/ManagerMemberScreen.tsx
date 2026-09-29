import React, { useState, useEffect } from 'react';
import {
  Users,
  Search,
  AlertTriangle,
  UserX,
  RefreshCw,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../api/client';
import type {
  MemberDto,
  CalculationPreviewDto,
  MemberSummaryDto,
} from '../../types';
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

export const ManagerMemberScreen: React.FC = () => {
  const { activeMembership, user } = useAuth();
  const [members, setMembers] = useState<MemberDto[]>([]);
  const [calculation, setCalculation] = useState<CalculationPreviewDto | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<'name' | 'room' | 'balance'>('name');

  // Room editing states
  const [editingRoomMember, setEditingRoomMember] = useState<MemberDto | null>(null);
  const [roomInput, setRoomInput] = useState('');
  const [isSavingRoom, setIsSavingRoom] = useState(false);

  // Action states
  const [actionMember, setActionMember] = useState<MemberDto | null>(null);
  const [actionType, setActionType] = useState<'promote' | 'demote' | 'remove' | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [feedback, setFeedback] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  useEffect(() => {
    fetchMembersAndFinancials();
  }, [activeMembership?.messId]);

  const fetchMembersAndFinancials = async () => {
    if (!activeMembership?.messId) return;
    setIsLoading(true);
    try {
      // 1. Fetch mess members
      const membersData = await api.get<MemberDto[]>(
        `/messes/${activeMembership.messId}/members`
      );
      setMembers(membersData);

      // 2. Fetch calculation preview for running balances
      const calcData = await api.get<CalculationPreviewDto>(
        `/calculations/preview?messId=${activeMembership.messId}`
      );
      setCalculation(calcData);
    } catch (err: any) {
      console.error('Failed to load members:', err);
      setFeedback({
        type: 'error',
        message: err.message || 'Unable to fetch members list',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleExecuteRoleChange = async () => {
    if (!actionMember || !actionType || !activeMembership?.messId) return;

    setIsProcessing(true);
    setFeedback(null);
    try {
      if (actionType === 'promote') {
        await api.put(
          `/messes/${activeMembership.messId}/members/${actionMember.id}/role`,
          { role: 'MANAGER' }
        );
        setFeedback({
          type: 'success',
          message: `Successfully promoted ${actionMember.fullName} to Manager.`,
        });
      } else if (actionType === 'demote') {
        await api.put(
          `/messes/${activeMembership.messId}/members/${actionMember.id}/role`,
          { role: 'STUDENT' }
        );
        setFeedback({
          type: 'success',
          message: `Reassigned ${actionMember.fullName} to Student role.`,
        });
      } else if (actionType === 'remove') {
        await api.delete(
          `/messes/${activeMembership.messId}/members/${actionMember.id}`
        );
        setFeedback({
          type: 'success',
          message: `Marked ${actionMember.fullName} as inactive/left for mid-cycle prorating.`,
        });
      }

      setActionMember(null);
      setActionType(null);
      await fetchMembersAndFinancials();
    } catch (err: any) {
      console.error('Action failed:', err);
      setFeedback({
        type: 'error',
        message: err.message || 'Operation failed. Check permissions.',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSaveRoom = async () => {
    if (!editingRoomMember || !activeMembership?.messId) return;
    setIsSavingRoom(true);
    setFeedback(null);
    try {
      await api.put(
        `/messes/${activeMembership.messId}/members/${editingRoomMember.id}/room`,
        { roomNumber: roomInput.trim() || null }
      );
      setFeedback({
        type: 'success',
        message: `Updated room number for ${editingRoomMember.fullName} to "${roomInput.trim() || 'Unassigned'}".`,
      });
      setEditingRoomMember(null);
      await fetchMembersAndFinancials();
    } catch (err: any) {
      console.error('Failed to update room number:', err);
      setFeedback({
        type: 'error',
        message: err.message || 'Failed to update room number',
      });
    } finally {
      setIsSavingRoom(false);
    }
  };

  // Map user summaries by userId
  const memberFinancialMap = React.useMemo(() => {
    const map = new Map<string, MemberSummaryDto>();
    if (calculation?.memberSummaries) {
      calculation.memberSummaries.forEach((s) => {
        map.set(s.userId, s);
      });
    }
    return map;
  }, [calculation]);

  // Filtered and sorted members
  const filteredMembers = React.useMemo(() => {
    const list = members.filter((m) => {
      const matchRole =
        roleFilter === 'ALL' ||
        (roleFilter === 'DELINQUENT'
          ? memberFinancialMap.get(m.userId)?.hasNegativeBalance
          : m.role === roleFilter);

      const matchSearch =
        searchQuery === '' ||
        m.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (m.roomNumber && m.roomNumber.toLowerCase().includes(searchQuery.toLowerCase())) ||
        m.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (m.phone && m.phone.toLowerCase().includes(searchQuery.toLowerCase()));

      return matchRole && matchSearch;
    });

    return [...list].sort((a, b) => {
      if (sortBy === 'room') {
        const roomA = a.roomNumber || '';
        const roomB = b.roomNumber || '';
        if (!roomA && !roomB) return a.fullName.localeCompare(b.fullName);
        if (!roomA) return 1;
        if (!roomB) return -1;
        return roomA.localeCompare(roomB, undefined, { numeric: true, sensitivity: 'base' });
      }
      if (sortBy === 'balance') {
        const balA = memberFinancialMap.get(a.userId)?.netBalance ?? 0;
        const balB = memberFinancialMap.get(b.userId)?.netBalance ?? 0;
        return balA - balB;
      }
      return a.fullName.localeCompare(b.fullName);
    });
  }, [members, roleFilter, searchQuery, sortBy, memberFinancialMap]);

  const delinquentCount = Array.from(memberFinancialMap.values()).filter(
    (s) => s.hasNegativeBalance
  ).length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-card border border-slate-border shadow-subtle">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-terracotta">
            <Users className="w-4 h-4" />
            <span>Community Roster</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-display font-extrabold text-slate-deep mt-1">
            Mess Members & Roles
          </h1>
          <p className="text-xs sm:text-sm text-slate-muted mt-0.5">
            Manage student dining memberships, delegate manager roles, and monitor running financial balances.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={fetchMembersAndFinancials}
          isLoading={isLoading}
        >
          <RefreshCw className="w-4 h-4 mr-1.5" />
          Refresh List
        </Button>
      </div>

      {feedback && (
        <Alert
          type={feedback.type}
          title={feedback.type === 'success' ? 'Roster Updated' : 'Operation Failed'}
          onDismiss={() => setFeedback(null)}
        >
          {feedback.message}
        </Alert>
      )}

      {/* Delinquent Warning Banner */}
      {delinquentCount > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-card p-4 flex items-center justify-between gap-4 shadow-subtle">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-button bg-red-100 flex items-center justify-center text-red-700 shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-red-900">
                {delinquentCount} Member{delinquentCount > 1 ? 's' : ''} have Negative Net Balances
              </h4>
              <p className="text-xs text-red-700 mt-0.5">
                Their cumulative meal deductions exceed approved advance deposits. Request immediate deposit top-ups.
              </p>
            </div>
          </div>
          <button
            onClick={() => setRoleFilter('DELINQUENT')}
            className="px-3 py-1.5 rounded-button bg-red-700 text-white text-xs font-bold hover:bg-red-800 transition-colors shrink-0"
          >
            Filter Delinquent ({delinquentCount})
          </button>
        </div>
      )}

      {/* Search & Filter Bar */}
      <Card className="p-4 border border-slate-border shadow-subtle space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            <button
              onClick={() => setRoleFilter('ALL')}
              className={clsx(
                'px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all tactile-btn',
                roleFilter === 'ALL'
                  ? 'bg-slate-deep text-white shadow-subtle'
                  : 'bg-slate-100 text-slate-muted hover:bg-slate-200'
              )}
            >
              All Members ({members.length})
            </button>
            <button
              onClick={() => setRoleFilter('STUDENT')}
              className={clsx(
                'px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all tactile-btn',
                roleFilter === 'STUDENT'
                  ? 'bg-terracotta text-white shadow-subtle'
                  : 'bg-canvas-tint text-slate-muted hover:bg-canvas-tint/80 border border-slate-border/60'
              )}
            >
              Students ({members.filter((m) => m.role === 'STUDENT').length})
            </button>
            <button
              onClick={() => setRoleFilter('MANAGER')}
              className={clsx(
                'px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all tactile-btn',
                roleFilter === 'MANAGER'
                  ? 'bg-terracotta text-white shadow-subtle'
                  : 'bg-canvas-tint text-slate-muted hover:bg-canvas-tint/80 border border-slate-border/60'
              )}
            >
              Managers ({members.filter((m) => m.role === 'MANAGER').length})
            </button>
            <button
              onClick={() => setRoleFilter('PRIMARY_MANAGER')}
              className={clsx(
                'px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all tactile-btn',
                roleFilter === 'PRIMARY_MANAGER'
                  ? 'bg-terracotta text-white shadow-subtle'
                  : 'bg-canvas-tint text-slate-muted hover:bg-canvas-tint/80 border border-slate-border/60'
              )}
            >
              Primary
            </button>
            {delinquentCount > 0 && (
              <button
                onClick={() => setRoleFilter('DELINQUENT')}
                className={clsx(
                  'px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all tactile-btn',
                  roleFilter === 'DELINQUENT'
                    ? 'bg-red-600 text-white shadow-subtle'
                    : 'bg-red-50 text-red-700 hover:bg-red-100 border border-red-200'
                )}
              >
                Delinquent ({delinquentCount})
              </button>
            )}
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 w-full sm:w-auto">
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-xs text-slate-muted whitespace-nowrap font-medium">Sort:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="text-xs px-2.5 py-2 rounded-input bg-canvas-tint border border-slate-border text-slate-deep focus:outline-none focus:ring-1 focus:ring-terracotta"
              >
                <option value="name">Name (A-Z)</option>
                <option value="room">Room Number</option>
                <option value="balance">Net Balance</option>
              </select>
            </div>

            <div className="w-full sm:w-64">
              <Input
                placeholder="Search member, room, phone..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                leftIcon={<Search className="w-4 h-4 text-slate-muted" />}
              />
            </div>
          </div>
        </div>

        {/* Member Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-canvas-tint/90 border-b border-slate-border text-slate-deep">
                <th className="p-3 font-display font-bold">Member Name & Contact</th>
                <th className="p-3 font-display font-bold">Role</th>
                <th className="p-3 font-display font-bold">Membership Status</th>
                <th className="p-3 font-display font-bold">Meal Units</th>
                <th className="p-3 font-display font-bold">Deposits</th>
                <th className="p-3 font-display font-bold">Net Balance</th>
                <th className="p-3 font-display font-bold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-border">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center">
                    <Skeleton className="h-6 w-full mb-2" />
                    <Skeleton className="h-6 w-3/4 mx-auto" />
                  </td>
                </tr>
              ) : filteredMembers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-12 text-center text-slate-muted">
                    <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-2 text-slate-400">
                      <Users className="w-6 h-6" />
                    </div>
                    <p className="font-bold text-sm text-slate-deep">No members found</p>
                  </td>
                </tr>
              ) : (
                filteredMembers.map((m) => {
                  const fin = memberFinancialMap.get(m.userId);
                  const isDelinquent = fin?.hasNegativeBalance || false;
                  const isPrimary = m.role === 'PRIMARY_MANAGER';
                  const isSelf = m.email === user?.email;

                  return (
                    <tr
                      key={m.id}
                      className={clsx(
                        'hover:bg-canvas-tint/40 transition-colors',
                        isDelinquent && 'bg-red-50/40'
                      )}
                    >
                      <td className="p-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-terracotta-container/60 text-terracotta font-bold text-xs flex items-center justify-center shrink-0">
                            {m.fullName?.charAt(0) || 'U'}
                          </div>
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-bold text-slate-deep text-sm">
                                {m.fullName} — Room {m.roomNumber || 'N/A'}
                              </span>
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingRoomMember(m);
                                  setRoomInput(m.roomNumber || '');
                                }}
                                className="text-[10px] text-terracotta hover:underline font-semibold bg-terracotta/10 hover:bg-terracotta/20 px-1.5 py-0.5 rounded transition-colors"
                                title="Edit room number"
                              >
                                Edit Room
                              </button>
                            </div>
                            <div className="flex items-center gap-2 text-[11px] text-slate-muted mt-0.5">
                              <span>{m.email}</span>
                              {m.phone && <span>• {m.phone}</span>}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="p-3 whitespace-nowrap">
                        <Badge
                          variant={
                            isPrimary
                              ? 'manager'
                              : m.role === 'MANAGER'
                              ? 'chef'
                              : 'student'
                          }
                          size="sm"
                        >
                          {m.role}
                        </Badge>
                      </td>
                      <td className="p-3 whitespace-nowrap">
                        <Badge
                          variant={m.status === 'ACTIVE' ? 'success' : 'neutral'}
                          size="sm"
                        >
                          {m.status}
                        </Badge>
                        {fin?.prorated && (
                          <span className="text-[10px] text-amber-700 bg-amber-100 px-1.5 py-0.2 rounded ml-1 font-bold">
                            Prorated
                          </span>
                        )}
                      </td>
                      <td className="p-3 whitespace-nowrap">
                        {fin ? (
                          <div>
                            <span className="font-bold text-slate-deep">
                              {fin.totalMemberUnits.toFixed(1)} units
                            </span>
                            {fin.totalGuestUnits > 0 && (
                              <span className="text-[10px] text-slate-muted block">
                                +{fin.totalGuestUnits} guest
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-muted">—</span>
                        )}
                      </td>
                      <td className="p-3 whitespace-nowrap font-bold text-slate-deep">
                        {fin ? (
                          `৳${fin.totalDeposits.toLocaleString('en-US', { minimumFractionDigits: 0 })}`
                        ) : (
                          '—'
                        )}
                      </td>
                      <td className="p-3 whitespace-nowrap">
                        {fin ? (
                          <span
                            className={clsx(
                              'font-display font-extrabold text-sm px-2 py-0.5 rounded-full inline-block',
                              isDelinquent
                                ? 'bg-red-100 text-status-error font-bold'
                                : 'text-emerald-700 bg-emerald-50'
                            )}
                          >
                            {fin.netBalance >= 0 ? '+' : ''}
                            ৳{fin.netBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                          </span>
                        ) : (
                          <span className="text-slate-muted">—</span>
                        )}
                      </td>
                      <td className="p-3 text-right whitespace-nowrap">
                        {isPrimary ? (
                          <span className="text-[11px] text-slate-muted italic">
                            Primary Authority
                          </span>
                        ) : isSelf ? (
                          <span className="text-[11px] text-slate-muted italic">
                            Your Account
                          </span>
                        ) : (
                          <div className="flex items-center justify-end gap-1.5">
                            {m.role === 'STUDENT' ? (
                              <button
                                onClick={() => {
                                  setActionMember(m);
                                  setActionType('promote');
                                }}
                                title="Promote to Manager"
                                className="p-1.5 rounded-button text-xs font-semibold bg-terracotta-container/40 text-terracotta hover:bg-terracotta hover:text-white transition-colors"
                              >
                                Promote
                              </button>
                            ) : (
                              <button
                                onClick={() => {
                                  setActionMember(m);
                                  setActionType('demote');
                                }}
                                title="Demote to Student"
                                className="p-1.5 rounded-button text-xs font-semibold bg-slate-100 text-slate-muted hover:bg-slate-200 transition-colors"
                              >
                                Demote
                              </button>
                            )}
                            {m.status === 'ACTIVE' && (
                              <button
                                onClick={() => {
                                  setActionMember(m);
                                  setActionType('remove');
                                }}
                                title="Mark Left / Prorate"
                                className="p-1.5 rounded-button text-xs text-red-600 hover:bg-red-50 transition-colors"
                              >
                                <UserX className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Confirmation Modal */}
      <Modal
        isOpen={!!actionMember && !!actionType}
        onClose={() => {
          setActionMember(null);
          setActionType(null);
        }}
        title={
          actionType === 'promote'
            ? 'Promote Member to Manager'
            : actionType === 'demote'
            ? 'Demote Manager to Student'
            : 'Remove Member from Active Cycle'
        }
        maxWidth="sm"
      >
        <div className="space-y-4">
          <p className="text-xs text-slate-deep leading-relaxed">
            {actionType === 'promote' && (
              <>
                Are you sure you want to promote{' '}
                <strong>{actionMember?.fullName}</strong> to the{' '}
                <strong>Manager</strong> role? They will have full access to record
                expenses, review student deposits, and edit weekly menus.
              </>
            )}
            {actionType === 'demote' && (
              <>
                Are you sure you want to revert{' '}
                <strong>{actionMember?.fullName}</strong> back to a regular{' '}
                <strong>Student</strong> role? They will lose access to managerial
                tools.
              </>
            )}
            {actionType === 'remove' && (
              <>
                Are you sure you want to mark{' '}
                <strong>{actionMember?.fullName}</strong> as having left the mess?
                Their dining costs for this cycle will be prorated up to today.
              </>
            )}
          </p>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-border">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setActionMember(null);
                setActionType(null);
              }}
              disabled={isProcessing}
            >
              Cancel
            </Button>
            <Button
              variant={actionType === 'remove' ? 'danger' : 'primary'}
              size="sm"
              onClick={handleExecuteRoleChange}
              isLoading={isProcessing}
            >
              Confirm Action
            </Button>
          </div>
        </div>
      </Modal>

      {/* Edit Room Number Modal */}
      <Modal
        isOpen={!!editingRoomMember}
        onClose={() => setEditingRoomMember(null)}
        title="Edit Member Room Number"
        maxWidth="sm"
      >
        <div className="space-y-4">
          <p className="text-xs text-slate-deep leading-relaxed">
            Assign or update the room/seat number for <strong>{editingRoomMember?.fullName}</strong>.
            This ensures unambiguous identification for INDIVIDUAL_DIRECT charges and ledger accounting.
          </p>

          <div>
            <label className="block text-xs font-bold text-slate-deep mb-1">
              Room / Seat Number
            </label>
            <Input
              value={roomInput}
              onChange={(e) => setRoomInput(e.target.value)}
              placeholder="e.g. 204 or Seat 3B"
              autoFocus
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-border">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setEditingRoomMember(null)}
              disabled={isSavingRoom}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleSaveRoom}
              isLoading={isSavingRoom}
            >
              Save Room Number
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
