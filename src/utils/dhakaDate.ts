/**
 * dhakaDate.ts — Asia/Dhaka-aware date utilities for MessMate.
 *
 * ROOT CAUSE OF THE BUG THIS FILE FIXES:
 * ─────────────────────────────────────────────────────────────────────────────
 * `new Date().toISOString().split('T')[0]`  →  gives UTC date, not Dhaka date.
 * Between local midnight (12:00 AM Dhaka) and 6:00 AM Dhaka time the UTC
 * calendar date is still the PREVIOUS day, causing every screen that computes
 * "today" this way to be one day behind during that 6-hour window.
 *
 * `new Date().getDay()` and `new Date().getHours()` also return UTC-local hybrid
 * values via the JS engine timezone, which may or may not match Dhaka depending
 * on the host OS configuration — NEVER reliable in a server-rendered or UTC-server
 * context.
 *
 * FIX APPLIED EVERYWHERE:
 * ─────────────────────────────────────────────────────────────────────────────
 * Use `Intl.DateTimeFormat` with `timeZone: 'Asia/Dhaka'` — the SAME pattern
 * already correctly used in `isSessionCutoffPassed()` in sessionUtils.ts.
 * This is spec-compliant, available in all modern browsers and Node 13+, and
 * guaranteed to return the Dhaka calendar date regardless of server/client TZ.
 */

const DHAKA_TZ = 'Asia/Dhaka';

/**
 * Returns the current Asia/Dhaka date components as separate numbers.
 * Avoids any UTC-vs-local ambiguity by going through Intl.DateTimeFormat.
 */
function getDhakaDateParts(): {
  year: number;
  month: number; // 1-based
  day: number;
  hour: number;
  minute: number;
  second: number;
  dayOfWeek: number; // 0 = Sunday … 6 = Saturday  (matches JS Date.getDay())
} {
  const now = new Date();
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: DHAKA_TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
    weekday: 'short', // 'Mon', 'Tue' etc.
  });

  const parts = formatter.formatToParts(now);
  const map: Record<string, string> = {};
  parts.forEach((p) => { map[p.type] = p.value; });

  // Map weekday short name → 0-based index (Sun=0 … Sat=6)
  const weekdayMap: Record<string, number> = {
    Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6,
  };

  return {
    year: parseInt(map.year, 10),
    month: parseInt(map.month, 10),
    day: parseInt(map.day, 10),
    hour: parseInt(map.hour, 10),
    minute: parseInt(map.minute, 10),
    second: parseInt(map.second, 10),
    dayOfWeek: weekdayMap[map.weekday] ?? new Date().getDay(), // safe fallback
  };
}

/**
 * Returns today's date in Asia/Dhaka as a YYYY-MM-DD string.
 * Use this everywhere `new Date().toISOString().split('T')[0]` was used.
 */
export function getTodayDhaka(): string {
  const { year, month, day } = getDhakaDateParts();
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

/**
 * Returns tomorrow's date in Asia/Dhaka as a YYYY-MM-DD string.
 */
export function getTomorrowDhaka(): string {
  return addDays(getTodayDhaka(), 1);
}

/**
 * Returns the current day-of-week index in Asia/Dhaka (0=Sun … 6=Sat).
 * Use this everywhere `new Date().getDay()` was used for menu/calendar logic.
 */
export function getDayOfWeekDhaka(): number {
  return getDhakaDateParts().dayOfWeek;
}

/**
 * Returns the current hour (0-23) in Asia/Dhaka time.
 * Use this for greeting messages etc.
 */
export function getCurrentHourDhaka(): number {
  return getDhakaDateParts().hour;
}

/**
 * Converts a YYYY-MM-DD string date to "one day later" by pure string/number
 * arithmetic — avoids the timezone-shifting trap of `new Date(dateStr).setDate(+1)`.
 * `new Date('2026-09-28')` is parsed as midnight UTC, so `.setDate()` shifts it
 * relative to UTC, not Dhaka.
 */
export function addDays(dateStr: string, delta: number): string {
  // Parse as local midnight by appending T00:00:00 (no Z) so the Date
  // is constructed in the engine's local time, then manipulate the date
  // component arithmetically.
  const [y, m, d] = dateStr.split('-').map(Number);
  const dt = new Date(y, m - 1, d + delta); // months are 0-based; addition is safe
  const year = dt.getFullYear();
  const month = String(dt.getMonth() + 1).padStart(2, '0');
  const day = String(dt.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Converts a JS `Date` object to a YYYY-MM-DD string in Asia/Dhaka timezone.
 * Replaces `d.toISOString().split('T')[0]` which gives the UTC date.
 */
export function formatDateToDhaka(date: Date): string {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: DHAKA_TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  const parts = formatter.formatToParts(date);
  const map: Record<string, string> = {};
  parts.forEach((p) => { map[p.type] = p.value; });
  return `${map.year}-${map.month}-${map.day}`;
}

/**
 * Returns true if `dateStr` (YYYY-MM-DD) is strictly before today in Dhaka.
 * Replaces `date < new Date()` comparisons done with UTC-based midnight.
 */
export function isBeforeTodayDhaka(dateStr: string): boolean {
  return dateStr < getTodayDhaka();
}

/**
 * Returns true if a Date object (any time) falls before today's
 * Dhaka midnight. Replaces `date < new Date().setHours(0,0,0,0)` calls.
 */
export function isDateObjectBeforeTodayDhaka(date: Date): boolean {
  return formatDateToDhaka(date) < getTodayDhaka();
}
