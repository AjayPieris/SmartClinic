// =============================================================================
// src/utils/availabilityUtils.js
//
// Pure utility functions used by the AvailabilityPreview panel.
// No API calls, no React — just data transformations.
// =============================================================================

/**
 * Count how many slots fit in a given time window at a given duration.
 * e.g. 09:00–17:00 at 30 min = 16 slots.
 *
 * @param {string} startTime  — "HH:MM"
 * @param {string} endTime    — "HH:MM"
 * @param {number} durationMinutes
 * @returns {number}
 */
export function countSlots(startTime, endTime, durationMinutes) {
  const [sh, sm] = startTime.split(':').map(Number);
  const [eh, em] = endTime.split(':').map(Number);

  const startMinutes = sh * 60 + sm;
  const endMinutes   = eh * 60 + em;
  const windowMinutes = endMinutes - startMinutes;

  if (windowMinutes <= 0 || durationMinutes <= 0) return 0;
  return Math.floor(windowMinutes / durationMinutes);
}

/**
 * Calculate total weekly working hours from a schedule array.
 *
 * @param {AvailabilityWindow[]} schedule
 * @returns {number} — decimal hours e.g. 37.5
 */
export function totalWeeklyHours(schedule) {
  return schedule.reduce((sum, w) => {
    const [sh, sm] = w.startTime.split(':').map(Number);
    const [eh, em] = w.endTime.split(':').map(Number);
    const minutes = (eh * 60 + em) - (sh * 60 + sm);
    return sum + Math.max(0, minutes / 60);
  }, 0);
}

/**
 * Generate a human-readable time label from an "HH:MM" UTC string.
 * Displayed in the preview panel as local time.
 * e.g. "09:00" → "9:00 AM"
 *
 * @param {string} timeStr  — "HH:MM"
 * @returns {string}
 */
export function formatTimeLabel(timeStr) {
  const [h, m] = timeStr.split(':').map(Number);
  const ampm = h < 12 ? 'AM' : 'PM';
  const h12  = h % 12 || 12;
  return `${h12}:${String(m).padStart(2, '0')} ${ampm}`;
}

/**
 * Build the list of time options for the start/end time dropdowns.
 * Steps from 00:00 to 23:30 in 30-minute increments.
 * @returns {{ value: string, label: string }[]}
 */
export function buildTimeOptions() {
  const options = [];
  for (let h = 0; h < 24; h++) {
    for (let m = 0; m < 60; m += 30) {
      const value = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
      options.push({ value, label: formatTimeLabel(value) });
    }
  }
  return options;
}

// Named day labels — index matches Date.getDay() (0 = Sunday)
export const DAY_NAMES = [
  'Sunday', 'Monday', 'Tuesday', 'Wednesday',
  'Thursday', 'Friday', 'Saturday',
];

export const DAY_ABBR = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];