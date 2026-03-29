// =============================================================================
// src/components/booking/BookingConfirm.jsx — Step 4: review and confirm.
//
// Shows a summary card of everything selected. The patient can add a brief
// reason for the visit and toggle telehealth vs in-person before confirming.
// =============================================================================

import { format } from 'date-fns';
import styles from './BookingConfirm.module.css';

export default function BookingConfirm({
  doctor,
  selectedDate,
  selectedSlot,
  patientReason,
  isTelehealth,
  isSubmitting,
  onReasonChange,
  onTelehealthChange,
  onConfirm,
}) {
  return (
    <div className={styles.wrap}>

      {/* Summary card */}
      <div className={styles.summaryCard}>
        <h3 className={styles.summaryTitle}>Appointment summary</h3>

        <div className={styles.summaryRow}>
          <span className={styles.summaryLabel}>Doctor</span>
          <span className={styles.summaryValue}>Dr. {doctor.fullName}</span>
        </div>
        <div className={styles.summaryRow}>
          <span className={styles.summaryLabel}>Specialization</span>
          <span className={styles.summaryValue}>{doctor.specialization}</span>
        </div>
        <div className={styles.summaryRow}>
          <span className={styles.summaryLabel}>Date</span>
          <span className={styles.summaryValue}>
            {selectedDate && format(selectedDate, 'EEEE, MMMM d, yyyy')}
          </span>
        </div>
        <div className={styles.summaryRow}>
          <span className={styles.summaryLabel}>Time</span>
          <span className={styles.summaryValue}>{selectedSlot?.label}</span>
        </div>
        <div className={styles.summaryRow}>
          <span className={styles.summaryLabel}>Duration</span>
          <span className={styles.summaryValue}>
            {doctor.consultationDurationMinutes} minutes
          </span>
        </div>
      </div>

      {/* Visit type toggle */}
      <div className={styles.formGroup}>
        <p className={styles.fieldLabel}>Visit type</p>
        <div className={styles.toggleGroup}>
          <button
            type="button"
            className={`${styles.toggleBtn} ${isTelehealth ? styles.toggleActive : ''}`}
            onClick={() => onTelehealthChange(true)}
          >
            Telehealth (video)
          </button>
          <button
            type="button"
            className={`${styles.toggleBtn} ${!isTelehealth ? styles.toggleActive : ''}`}
            onClick={() => onTelehealthChange(false)}
          >
            In-person
          </button>
        </div>
      </div>

      {/* Reason for visit */}
      <div className={styles.formGroup}>
        <label htmlFor="reason" className={styles.fieldLabel}>
          Reason for visit <span className={styles.optional}>(optional)</span>
        </label>
        <textarea
          id="reason"
          className={styles.textarea}
          value={patientReason}
          onChange={(e) => onReasonChange(e.target.value)}
          placeholder="Briefly describe your symptoms or reason for visiting…"
          rows={3}
          maxLength={500}
        />
        <p className={styles.charCount}>{patientReason.length}/500</p>
      </div>

      {/* Confirm button */}
      <button
        className={styles.confirmBtn}
        onClick={onConfirm}
        disabled={isSubmitting}
      >
        {isSubmitting ? (
          <>
            <span className={styles.btnSpinner} aria-hidden="true" />
            Booking…
          </>
        ) : (
          'Confirm booking'
        )}
      </button>

      <p className={styles.disclaimer}>
        You can cancel or reschedule up to 24 hours before your appointment.
      </p>

    </div>
  );
}