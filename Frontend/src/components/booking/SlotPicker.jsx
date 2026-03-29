// =============================================================================
// src/components/booking/SlotPicker.jsx — Step 3: pick a time slot.
//
// Renders the generated SlotOption[] as a grid of buttons.
// Available slots are clickable; booked/past slots are visually distinct
// and disabled so patients understand the slot is taken (not just absent).
// =============================================================================

import { format } from 'date-fns';
import styles from './SlotPicker.module.css';

export default function SlotPicker({
  slots,
  selectedSlot,
  isLoading,
  selectedDate,
  onSlotSelect,
}) {
  if (isLoading) {
    return (
      <div className={styles.skeletonGrid}>
        {[...Array(8)].map((_, i) => (
          <div key={i} className={styles.skeleton} />
        ))}
      </div>
    );
  }

  const availableSlots   = slots.filter((s) => s.available);
  const unavailableSlots = slots.filter((s) => !s.available);

  if (slots.length === 0) {
    return (
      <div className={styles.empty}>
        <p>No time slots available on this day.</p>
        <p className={styles.emptyHint}>
          Please go back and choose a different date.
        </p>
      </div>
    );
  }

  return (
    <div className={styles.wrap}>
      {/* Selected date sub-header */}
      <p className={styles.dateLabel}>
        {selectedDate && format(selectedDate, 'EEEE, MMMM d, yyyy')}
      </p>

      {/* Available slots */}
      {availableSlots.length > 0 && (
        <section>
          <p className={styles.sectionLabel}>Available</p>
          <div className={styles.grid}>
            {availableSlots.map((slot) => (
              <button
                key={slot.startUtc}
                className={`
                  ${styles.slot}
                  ${selectedSlot?.startUtc === slot.startUtc ? styles.slotSelected : ''}
                `}
                onClick={() => onSlotSelect(slot)}
                aria-pressed={selectedSlot?.startUtc === slot.startUtc}
                aria-label={`Book at ${slot.label}`}
              >
                {slot.label}
              </button>
            ))}
          </div>
        </section>
      )}

      {/* Unavailable slots — shown greyed out for transparency */}
      {unavailableSlots.length > 0 && (
        <section>
          <p className={styles.sectionLabel}>Already booked</p>
          <div className={styles.grid}>
            {unavailableSlots.map((slot) => (
              <div
                key={slot.startUtc}
                className={`${styles.slot} ${styles.slotUnavailable}`}
                aria-label={`${slot.label} — unavailable`}
              >
                {slot.label}
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}