

/**
 * @typedef {Object} AvailabilityWindow
 * @property {number} dayOfWeek   — 0=Sunday … 6=Saturday (matches JS Date.getDay())
 * @property {string} startTime   — "HH:MM" in UTC (e.g. "09:00")
 * @property {string} endTime     — "HH:MM" in UTC (e.g. "17:00")
 */

/**
 * @typedef {Object} BookedSlot
 * @property {string} startTimeUtc — ISO 8601 UTC string
 * @property {string} endTimeUtc   — ISO 8601 UTC string
 */

/**
 * @typedef {Object} SlotOption
 * @property {string} startUtc     — ISO 8601 UTC string (send this to the API)
 * @property {string} endUtc       — ISO 8601 UTC string
 * @property {string} label        — Human-readable local time "9:00 AM – 9:30 AM"
 * @property {boolean} available   — false if the slot is already booked
 */

/**
 * Generate time slots for a doctor on a specific date.
 *
 * @param {Date}               selectedDate          — the calendar date chosen by the patient
 * @param {string}             availabilityJson      — JSON string from DoctorProfile.AvailabilityJson
 * @param {BookedSlot[]}       bookedSlots           — already-booked windows for this date
 * @param {number}             durationMinutes       — doctor's ConsultationDurationMinutes
 * @returns {SlotOption[]}
 */
export function generateSlots(
  selectedDate,
  availabilityJson,
  bookedSlots,
  durationMinutes
) {
  // ── 1. Parse the availability JSON ───────────────────────────────────────
  let availability = [];
  try {
    availability = JSON.parse(availabilityJson);
  } catch {
    console.error('[generateSlots] Invalid availabilityJson:', availabilityJson);
    return [];
  }

  if (!Array.isArray(availability) || availability.length === 0) return [];

  // ── 2. Find the availability window for this day of week ─────────────────
  // Date.getDay() returns 0 (Sun) – 6 (Sat), matching our DayOfWeek field
  const dayOfWeek = selectedDate.getDay();
  const window = availability.find((w) => w.DayOfWeek === dayOfWeek);

  // Doctor doesn't work on this day
  if (!window) return [];

  // ── 3. Parse window start/end as UTC times on the selected date ───────────
  // availabilityJson stores times as "HH:MM" strings in UTC.
  // We construct full UTC Date objects by combining with the selected date.
  const [startHour, startMin] = window.StartTime.split(':').map(Number);
  const [endHour,   endMin  ] = window.EndTime.split(':').map(Number);

  // Build UTC timestamps for the window boundaries on the selected date
  const windowStart = new Date(Date.UTC(
    selectedDate.getUTCFullYear(),
    selectedDate.getUTCMonth(),
    selectedDate.getUTCDate(),
    startHour, startMin, 0, 0
  ));

  const windowEnd = new Date(Date.UTC(
    selectedDate.getUTCFullYear(),
    selectedDate.getUTCMonth(),
    selectedDate.getUTCDate(),
    endHour, endMin, 0, 0
  ));

  // ── 4. Pre-process booked slots into Date objects (avoid parsing in loop) ─
  const bookedRanges = bookedSlots.map((slot) => ({
    start: new Date(slot.startTimeUtc),
    end:   new Date(slot.endTimeUtc),
  }));

  const now = new Date();

  // ── 5. Walk the window in durationMinutes steps ───────────────────────────
  const slots = [];
  let cursor = new Date(windowStart);

  while (cursor.getTime() + durationMinutes * 60_000 <= windowEnd.getTime()) {
    const slotStart = new Date(cursor);
    const slotEnd   = new Date(cursor.getTime() + durationMinutes * 60_000);

    // Filter 1: Can't book a slot that has already started
    const isPast = slotStart <= now;

    // Filter 2: Check overlap with any booked appointment
    // Overlap condition: bookedStart < slotEnd AND bookedEnd > slotStart
    const isBooked = bookedRanges.some(
      (range) => range.start < slotEnd && range.end > slotStart
    );

    const available = !isPast && !isBooked;

    slots.push({
      startUtc: slotStart.toISOString(),
      endUtc:   slotEnd.toISOString(),
      // Format in the patient's LOCAL timezone for display
      label: formatSlotLabel(slotStart, slotEnd),
      available,
    });

    // Advance cursor by one slot duration
    cursor = new Date(cursor.getTime() + durationMinutes * 60_000);
  }

  return slots;
}

// ── Private helpers ───────────────────────────────────────────────────────────

/**
 * Format a slot as a human-readable local-time label.
 * e.g. "9:00 AM – 9:30 AM"
 * Uses the browser's locale and timezone automatically via Intl.
 */
function formatSlotLabel(startUtc, endUtc) {
  const fmt = new Intl.DateTimeFormat(undefined, {
    hour:   'numeric',
    minute: '2-digit',
    hour12: true,
  });
  return `${fmt.format(startUtc)} – ${fmt.format(endUtc)}`;
}

/**
 * Check if a given Date has at least one available slot.
 * Used by the CalendarPicker to grey out days with no availability.
 *
 * @param {Date}   date
 * @param {string} availabilityJson
 * @param {BookedSlot[]} bookedSlots  — pass [] if not yet loaded for this date
 * @param {number} durationMinutes
 * @returns {boolean}
 */
export function hasAvailableSlots(date, availabilityJson, bookedSlots, durationMinutes) {
  const slots = generateSlots(date, availabilityJson, bookedSlots, durationMinutes);
  return slots.some((s) => s.available);
}