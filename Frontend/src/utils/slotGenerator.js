
/**
 * @typedef {Object} AvailabilityWindow
 * @property {number} DayOfWeek   — 0=Sunday … 6=Saturday (matches JS Date.getDay())
 * @property {string} StartTime   — "HH:MM" in LOCAL time as entered by the doctor
 * @property {string} EndTime     — "HH:MM" in LOCAL time as entered by the doctor
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
 * KEY DESIGN DECISIONS
 * --------------------
 * 1. The doctor enters times in their LOCAL timezone via the browser's <input type="time">.
 *    Those strings ("09:00", "17:00") are stored as-is — they are NOT UTC.
 *
 * 2. selectedDate is a Date object set to LOCAL midnight by CalendarPicker
 *    (e.g. new Date(year, month, day) — no UTC offset applied).
 *    We must use .getFullYear()/.getMonth()/.getDate() (local accessors) to
 *    build slot boundary dates so we don't drift into the wrong calendar day.
 *
 * 3. We construct window boundaries with `new Date(year, month, day, h, m)`
 *    (local-time constructor) so the resulting Date is in the doctor's timezone.
 *    These are then converted to UTC automatically when sent to the backend.
 *
 * @param {Date}               selectedDate          — local-midnight Date for chosen day
 * @param {string}             availabilityJson      — JSON string from DoctorProfile.AvailabilityJson
 * @param {BookedSlot[]}       bookedSlots           — already-booked windows for this date (UTC strings)
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

  // ── 2. Find the window for this day of week ───────────────────────────────
  // Use LOCAL day (.getDay()) because selectedDate is local-midnight.
  const dayOfWeek = selectedDate.getDay();
  const window = availability.find((w) => w.DayOfWeek === dayOfWeek);

  // Doctor doesn't work on this day
  if (!window) return [];

  // ── 3. Parse window start/end as LOCAL times on the selected date ─────────
  // Doctor entered "HH:MM" strings in their local browser timezone.
  // Build Date objects using the LOCAL-time constructor so they map to the
  // same wall-clock hour the doctor intended.
  const [startHour, startMin] = window.StartTime.split(':').map(Number);
  const [endHour,   endMin  ] = window.EndTime.split(':').map(Number);

  // Local-time year/month/date from selectedDate (avoids UTC day-drift bug)
  const y = selectedDate.getFullYear();
  const m = selectedDate.getMonth();
  const d = selectedDate.getDate();

  const windowStart = new Date(y, m, d, startHour, startMin, 0, 0);
  const windowEnd   = new Date(y, m, d, endHour,   endMin,   0, 0);

  if (windowEnd <= windowStart) {
    console.warn('[generateSlots] Window end is not after start — skipping day.', window);
    return [];
  }

  // ── 4. Pre-process booked slots into Date objects ─────────────────────────
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
    // Overlap: bookedStart < slotEnd AND bookedEnd > slotStart
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