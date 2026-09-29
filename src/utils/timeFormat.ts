/**
 * Formats a 24-hour time string ("HH:mm") into 12-hour format ("hh:mm AM/PM").
 */
export const formatTime12h = (time24?: string | null): string => {
  if (!time24) return '';
  const parts = time24.split(':');
  if (parts.length < 2) return time24;
  const h = parseInt(parts[0], 10);
  const m = parts[1].padStart(2, '0');
  if (isNaN(h)) return time24;
  const ampm = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12.toString().padStart(2, '0')}:${m} ${ampm}`;
};

/**
 * Formats serving start and end times into a clean range string.
 * e.g. ("07:30", "09:30") => "07:30 AM – 09:30 AM"
 */
export const formatServingWindow = (
  startTime?: string | null,
  endTime?: string | null,
  fallback = 'Serving Window TBD'
): string => {
  if (!startTime && !endTime) return fallback;
  if (startTime && endTime) {
    return `${formatTime12h(startTime)} – ${formatTime12h(endTime)}`;
  }
  if (startTime) return `From ${formatTime12h(startTime)}`;
  return `Until ${formatTime12h(endTime)}`;
};
