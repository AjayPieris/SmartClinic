export function generateSlots(
  selectedDate,
  availabilityJson,
  bookedSlots,
  durationMinutes
) {
  let availability = [];
  try {
    availability = JSON.parse(availabilityJson);
  } catch {
    console.error('Invalid availabilityJson:', availabilityJson);
    return [];
  }

  if (!Array.isArray(availability) || availability.length === 0) return [];

  const dayOfWeek = selectedDate.getDay();
  const window = availability.find((w) => w.DayOfWeek === dayOfWeek);

  if (!window) return [];

  const [startHour, startMin] = window.StartTime.split(':').map(Number);
  const [endHour, endMin] = window.EndTime.split(':').map(Number);

  const y = selectedDate.getFullYear();
  const m = selectedDate.getMonth();
  const d = selectedDate.getDate();

  const windowStart = new Date(y, m, d, startHour, startMin, 0, 0);
  const windowEnd = new Date(y, m, d, endHour, endMin, 0, 0);

  if (windowEnd <= windowStart) {
    return [];
  }

  const bookedRanges = bookedSlots.map((slot) => ({
    start: new Date(slot.startTimeUtc),
    end: new Date(slot.endTimeUtc),
  }));

  const now = new Date();
  const slots = [];
  let cursor = new Date(windowStart);

  while (cursor.getTime() + durationMinutes * 60000 <= windowEnd.getTime()) {
    const slotStart = new Date(cursor);
    const slotEnd = new Date(cursor.getTime() + durationMinutes * 60000);

    const isPast = slotStart <= now;

    const isBooked = bookedRanges.some(
      (range) => range.start < slotEnd && range.end > slotStart
    );

    const available = !isPast && !isBooked;

    slots.push({
      startUtc: slotStart.toISOString(),
      endUtc: slotEnd.toISOString(),
      label: formatSlotLabel(slotStart, slotEnd),
      available,
    });

    cursor = new Date(cursor.getTime() + durationMinutes * 60000);
  }

  return slots;
}

function formatSlotLabel(startUtc, endUtc) {
  const fmt = new Intl.DateTimeFormat(undefined, {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
  return `${fmt.format(startUtc)} – ${fmt.format(endUtc)}`;
}

export function hasAvailableSlots(date, availabilityJson, bookedSlots, durationMinutes) {
  const slots = generateSlots(date, availabilityJson, bookedSlots, durationMinutes);
  return slots.some((s) => s.available);
}