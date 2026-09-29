import { MealSession } from '../types';
import type { DiningConfigDto, SessionConfigDto } from '../types';

export interface ActiveSessionMeta {
  id: MealSession;
  session: MealSession;
  label: string;
  timeRange: string;
  iconText: string;
  unitValue: number;
  cutoffTime: string;
  servingStartTime?: string | null;
  servingEndTime?: string | null;
}

export const BASE_SESSIONS: Record<
  MealSession,
  {
    label: string;
    defaultTime: string;
    iconText: string;
    defaultCutoff: string;
    defaultUnit: number;
  }
> = {
  [MealSession.BREAKFAST]: {
    label: 'Breakfast',
    defaultTime: '07:30 AM – 09:30 AM',
    iconText: '🌅',
    defaultCutoff: '07:00',
    defaultUnit: 0.5,
  },
  [MealSession.LUNCH]: {
    label: 'Lunch',
    defaultTime: '01:00 PM – 02:30 PM',
    iconText: '☀️',
    defaultCutoff: '11:30',
    defaultUnit: 1.0,
  },
  [MealSession.DINNER]: {
    label: 'Dinner',
    defaultTime: '08:30 PM – 10:00 PM',
    iconText: '🌙',
    defaultCutoff: '19:00',
    defaultUnit: 1.0,
  },
};

export function formatTo12Hour(timeStr?: string | null): string {
  if (!timeStr) return '';
  const [hStr, mStr] = timeStr.split(':');
  const h = parseInt(hStr, 10);
  const m = parseInt(mStr || '0', 10);
  if (isNaN(h)) return timeStr;
  const period = h >= 12 ? 'PM' : 'AM';
  const hour12 = h % 12 || 12;
  const minute = String(m).padStart(2, '0');
  return `${hour12}:${minute} ${period}`;
}

export function formatServingWindow(
  startTime?: string | null,
  endTime?: string | null,
  fallback = ''
): string {
  if (!startTime && !endTime) return fallback;
  if (startTime && endTime) {
    return `${formatTo12Hour(startTime)} – ${formatTo12Hour(endTime)}`;
  }
  if (startTime) return `Starts at ${formatTo12Hour(startTime)}`;
  return `Ends at ${formatTo12Hour(endTime)}`;
}

/**
 * Returns strictly the active enabled dining sessions based on mess configuration.
 * Disabled sessions (e.g. Breakfast off) are excluded completely.
 */
export function getActiveSessionList(
  diningConfig: DiningConfigDto | null | undefined,
  backendActiveSessions?: MealSession[] | null
): ActiveSessionMeta[] {
  // If backend provided an explicit list of active sessions (e.g. via WeeklyMenuDto)
  const serverActiveSet = backendActiveSessions && backendActiveSessions.length > 0
    ? new Set(backendActiveSessions)
    : null;

  const configs: SessionConfigDto[] = diningConfig?.sessions || diningConfig?.sessionConfigs || [];

  const allOrder = [MealSession.BREAKFAST, MealSession.LUNCH, MealSession.DINNER];

  return allOrder
    .filter((session) => {
      // 1. Explicit SessionConfig match from dining_configurations
      const cfg = configs.find((c) => c.session === session);
      if (cfg !== undefined) {
        const isEnabled = (cfg as any).isEnabled ?? (cfg as any).enabled;
        if (isEnabled !== undefined) {
          return isEnabled === true;
        }
      }

      // 2. Explicit server active sessions list from weeklyMenu
      if (serverActiveSet !== null) {
        return serverActiveSet.has(session);
      }

      // 3. Top-level default flags from DiningConfig
      if (diningConfig) {
        if (session === MealSession.BREAKFAST) return diningConfig.defaultBreakfastOn === true;
        if (session === MealSession.LUNCH) return diningConfig.defaultLunchOn === true;
        if (session === MealSession.DINNER) return diningConfig.defaultDinnerOn === true;
        return false;
      }

      // If nothing has loaded yet or no config exists, default to active
      return true;
    })
    .map((session) => {
      const cfg = configs.find((c) => c.session === session);
      const base = BASE_SESSIONS[session];

      return {
        id: session,
        session: session,
        label: base.label,
        timeRange: formatServingWindow(cfg?.servingStartTime, cfg?.servingEndTime, base.defaultTime),
        iconText: base.iconText,
        unitValue: cfg?.unitValue ?? base.defaultUnit,
        cutoffTime: cfg?.cutoffTime ?? base.defaultCutoff,
        servingStartTime: cfg?.servingStartTime,
        servingEndTime: cfg?.servingEndTime,
      };
    });
}

/**
 * Checks whether the booking/cutoff time for a meal session has passed.
 * Date format: YYYY-MM-DD (defaults to today in Asia/Dhaka).
 * Cutoff time format: HH:mm (24-hour).
 */
export function isSessionCutoffPassed(
  cutoffTimeStr?: string | null,
  dateStr?: string | null
): boolean {
  if (!cutoffTimeStr) return false;

  let todayStr: string;
  let currentHours: number;
  let currentMinutes: number;

  try {
    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Dhaka',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
    const parts = formatter.formatToParts(new Date());
    const partMap: Record<string, string> = {};
    parts.forEach((p) => { partMap[p.type] = p.value; });
    todayStr = `${partMap.year}-${partMap.month}-${partMap.day}`;
    currentHours = parseInt(partMap.hour, 10);
    currentMinutes = parseInt(partMap.minute, 10);
  } catch {
    const now = new Date();
    todayStr = now.toISOString().split('T')[0];
    currentHours = now.getHours();
    currentMinutes = now.getMinutes();
  }

  const targetDateStr = dateStr || todayStr;
  if (targetDateStr < todayStr) return true;
  if (targetDateStr > todayStr) return false;

  const [cutoffHours, cutoffMinutes] = cutoffTimeStr.split(':').map((p) => parseInt(p, 10));
  if (isNaN(cutoffHours)) return false;

  if (currentHours > cutoffHours) return true;
  if (currentHours === cutoffHours && currentMinutes >= (cutoffMinutes || 0)) return true;

  return false;
}

