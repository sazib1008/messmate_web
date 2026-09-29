// ─────────────────────────────────────────────────────────────────────────────
// Domain Enums
// ─────────────────────────────────────────────────────────────────────────────

/** Roles within a Meal membership */
export type UserRole = 'OWNER' | 'PRIMARY_MANAGER' | 'MANAGER' | 'MEMBER' | 'STUDENT' | 'CHEF';

export type MembershipStatus = 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'LEFT';

export type JoinRequestStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export type MealSession = 'BREAKFAST' | 'LUNCH' | 'DINNER';
export const MealSession = {
  BREAKFAST: 'BREAKFAST' as const,
  LUNCH: 'LUNCH' as const,
  DINNER: 'DINNER' as const,
} as const;

export type MealStatus = 'ON' | 'OFF';

export type PaymentMethod = 'CASH' | 'BKASH' | 'NAGAD' | 'BANK_TRANSFER' | 'OTHER';

export type DepositStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export type ExpenseCategory =
  | 'MEAL_VARIABLE'
  | 'FIXED_OVERHEAD'
  | 'INDIVIDUAL_DIRECT'
  | 'AD_HOC_SPECIAL'
  | 'OTHER';

// ─────────────────────────────────────────────────────────────────────────────
// Auth & User
// ─────────────────────────────────────────────────────────────────────────────

export interface User {
  id: string;
  email: string;
  fullName: string;
  phone?: string;
  avatarUrl?: string;
  studentId?: string;
  department?: string;
  university?: string;
  roomNumber?: string;
  isProfileComplete: boolean;
  profileComplete?: boolean;
}

export interface MessMembership {
  id: string;
  messId: string;
  mealId: string;    // alias of messId (backend sends mealId)
  messName?: string;
  mealName?: string; // alias of messName
  mealCode?: string;
  code?: string;     // alias of mealCode
  role: UserRole;
  status: MembershipStatus;
  joinDate?: string;
}

/** A pending join request returned from backend on login/me */
export interface PendingJoinRequest {
  id: string;
  mealId: string;
  mealName: string;
  mealCode: string;
  ownerName: string;
  status: JoinRequestStatus;
  requestNotes?: string;
  createdAt: string;
}

export interface AuthResponse {
  token: string;
  user: User;
  activeMembership?: MessMembership;
  pendingJoinRequest?: PendingJoinRequest;
}

// ─────────────────────────────────────────────────────────────────────────────
// Meal & Membership DTOs
// ─────────────────────────────────────────────────────────────────────────────

export interface MealDto {
  id: string;
  name: string;
  code: string;
  address?: string;
  createdById: string;
  memberCount: number;
  currentCycleNumber: number;
  currentCycleStatus: string;
}

export interface MealCodeVerificationResponse {
  mealId: string;
  name: string;
  code: string;
  address?: string;
  ownerName: string;
  memberCount: number;
  currentCycleNumber: number;
  currentCycleStatus: string;
}

export interface MealJoinRequestDto {
  id: string;
  mealId: string;
  mealName: string;
  userId: string;
  userName: string;
  userEmail: string;
  userPhone?: string;
  studentId?: string;
  department?: string;
  roomNumber?: string;
  status: JoinRequestStatus;
  requestNotes?: string;
  reviewedByName?: string;
  reviewedAt?: string;
  createdAt: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Meal Sessions & Daily Status
// ─────────────────────────────────────────────────────────────────────────────

export interface DailyMealStatusDto {
  id: string;
  userId: string;
  date: string; // YYYY-MM-DD
  session: MealSession;
  status: MealStatus;
  unitValue: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// Menu
// ─────────────────────────────────────────────────────────────────────────────

export interface MenuItemDto {
  id: string;
  dayOfWeek: number;
  session: MealSession;
  itemName: string;
  description?: string;
  category?: string;
  dietaryTags: string[];
}

export interface WeeklyMenuDto {
  id: string;
  title: string;
  effectiveFrom: string;
  items: MenuItemDto[];
  activeSessions?: MealSession[];
}

export interface CreateMenuItemRequest {
  messId: string;
  dayOfWeek: number;
  session: MealSession;
  itemName: string;
  description?: string;
  category?: string;
  dietaryTags: string[];
}

// ─────────────────────────────────────────────────────────────────────────────
// Deposits & Expenses
// ─────────────────────────────────────────────────────────────────────────────

export interface DepositDto {
  id: string;
  cycleId: string;
  messId: string;
  userId: string;
  userFullName: string;
  roomNumber?: string;
  amount: number;
  depositDate: string;
  paymentMethod: PaymentMethod;
  transactionRef?: string;
  status: DepositStatus;
  approvedById?: string;
  approvedByName?: string;
  notes?: string;
  createdAt: string;
}

export interface ReviewDepositRequest {
  approved: boolean;
  rejectionReason?: string;
}

export interface ExpenseDto {
  id: string;
  category: ExpenseCategory;
  title: string;
  amount: number;
  expenseDate: string;
  receiptUrl?: string | null;
  recordedByName: string;
  notes?: string | null;
  targetMemberId?: string | null;
  targetMemberName?: string | null;
  participantIds?: string[];
}

export interface CreateExpenseRequest {
  category: ExpenseCategory;
  title: string;
  amount: number;
  expenseDate: string;
  receiptUrl?: string;
  notes?: string;
  targetMemberId?: string | null;
  participantIds?: string[];
}

// ─────────────────────────────────────────────────────────────────────────────
// Members
// ─────────────────────────────────────────────────────────────────────────────

export interface MemberDto {
  id: string;
  userId: string;
  fullName: string;
  email: string;
  phone?: string;
  studentId?: string;
  department?: string;
  university?: string;
  roomNumber?: string;
  role: UserRole;
  status: MembershipStatus;
  joinDate: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Dining Configuration
// ─────────────────────────────────────────────────────────────────────────────

export interface SessionConfigDto {
  session: MealSession;
  unitValue: number;
  cutoffTime: string;
  isEnabled: boolean;
  enabled?: boolean;
  servingStartTime?: string;
  servingEndTime?: string;
}

export interface DiningConfigDto {
  defaultCarryForward: boolean;
  defaultBreakfastOn: boolean;
  defaultLunchOn: boolean;
  defaultDinnerOn: boolean;
  currency: string;
  sessions: SessionConfigDto[];
  sessionConfigs?: SessionConfigDto[];
}

// ─────────────────────────────────────────────────────────────────────────────
// Cycles & Calculations
// ─────────────────────────────────────────────────────────────────────────────

export interface MemberSummaryDto {
  userId: string;
  fullName: string;
  activeDays: number;
  proratedJoinDate?: string;
  proratedLeaveDate?: string;
  totalMemberUnits: number;
  totalGuestUnits: number;
  mealCost: number;
  guestCost: number;
  fixedOverheadCost?: number;
  individualDirectCost?: number;
  adHocSpecialCost?: number;
  totalCost: number;
  totalDeposits: number;
  netBalance: number;
  hasNegativeBalance: boolean;
  prorated: boolean;
}

export interface CalculationPreviewDto {
  totalExpenses: number;
  mealVariableExpenses?: number;
  fixedOverheadExpenses?: number;
  individualDirectExpenses?: number;
  adHocSpecialExpenses?: number;
  totalMemberUnits: number;
  totalGuestUnits: number;
  totalCountedUnits: number;
  mealRate: number;
  memberSummaries: MemberSummaryDto[];
  final: boolean;
  isRateVolatile?: boolean;
  volatilityReason?: string;
}

export interface ActiveCycleDto {
  id: string;
  messId: string;
  cycleNumber: number;
  startDate: string;
  targetActiveDays: number;
  countedActiveDays: number;
  scheduledEndDate: string;
  status: string;
  pausedDays: Array<{
    id?: string;
    date: string;
    session?: MealSession | null;
    reason: string;
  }>;
}

// ─────────────────────────────────────────────────────────────────────────────
// Chef
// ─────────────────────────────────────────────────────────────────────────────

export interface ChefSessionHeadcount {
  session: MealSession;
  studentOnCount: number;
  guestMealCount: number;
  totalHeadcount: number;
  menuItemName?: string | null;
  dietaryTags: string[];
  notes: string[];
  isEnabled?: boolean;
  servingStartTime?: string | null;
  servingEndTime?: string | null;
}

export interface ChefDailyHeadcountResponse {
  messId: string;
  messName: string;
  date: string;
  sessions: ChefSessionHeadcount[];
  isPaused?: boolean;
  pauseReason?: string | null;
}
