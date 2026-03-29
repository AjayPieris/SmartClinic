// =============================================================================
// src/components/schedule/AppointmentDetailCard.jsx
//
// Shows full information about the appointment selected in the timeline.
// Three action zones:
//   1. Status buttons — Confirm / Complete / Cancel (role-appropriate transitions)
//   2. Navigation links — Open chat · Write notes
//   3. Patient info — name, reason, telehealth indicator
//
// Null state (no appointment selected) renders a prompt.
// =============================================================================

import { format } from 'date-fns';
import { Link } from 'react-router-dom';
import styles from './AppointmentDetailCard.module.css';

// Define which status transitions are valid from each current status.
// Doctors can confirm pending, complete confirmed, or cancel either.
const STATUS_TRANSITIONS = {
  Pending:   ['Confirmed', 'Cancelled'],
  Confirmed: ['Completed', 'Cancelled'],
  Completed: [],  // Terminal state — no further transitions
  Cancelled: [],  // Terminal state
};

// Label and colour for each action button
const ACTION_META = {
  Confirmed: { label: 'Confirm',  className: 'btnConfirm'  },
  Completed: { label: 'Complete', className: 'btnComplete' },
  Cancelled: { label: 'Cancel',   className: 'btnCancel'   },
};

export default function AppointmentDetailCard({
  appointment,
  onStatusUpdate,
}) {
  // Null state
  if (!appointment) {
    return (
      <div className={styles.emptyCard}>
        <div className={styles.emptyIcon} aria-hidden="true">
          {/* Calendar check icon */}
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="1.5"
            strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8"  y1="2" x2="8"  y2="6" />
            <line x1="3"  y1="10" x2="21" y2="10" />
            <polyline points="9 16 11 18 15 14" />
          </svg>
        </div>
        <p className={styles.emptyTitle}>No appointment selected</p>
        <p className={styles.emptyHint}>Click any appointment block on the timeline.</p>
      </div>
    );
  }

  const startLocal = new Date(appointment.startTimeUtc);
  const endLocal   = new Date(appointment.endTimeUtc);
  const transitions = STATUS_TRANSITIONS[appointment.status] ?? [];

  return (
    <div className={styles.card}>

      {/* Patient info header */}
      <div className={styles.cardHeader}>
        <div className={styles.patientAvatar}>
          {appointment.patientProfilePictureUrl ? (
            <img
              src={appointment.patientProfilePictureUrl}
              alt={appointment.patientFullName}
              className={styles.avatarImg}
            />
          ) : (
            <div className={styles.avatarFallback}>
              {appointment.patientFullName?.charAt(0) ?? '?'}
            </div>
          )}
        </div>

        <div className={styles.patientInfo}>
          <p className={styles.patientName}>{appointment.patientFullName}</p>
          <div className={styles.statusRow}>
            <span className={`${styles.statusPill} ${styles[`status${appointment.status}`]}`}>
              {appointment.status}
            </span>
            {appointment.isTelehealth && (
              <span className={styles.telehealthTag}>
                {/* Video icon */}
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" strokeWidth="2.5"
                  strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="23 7 16 12 23 17 23 7" />
                  <rect x="1" y="5" width="15" height="14" rx="2" />
                </svg>
                Telehealth
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Time block */}
      <div className={styles.timeBlock}>
        <p className={styles.timeDate}>{format(startLocal, 'EEEE, MMMM d, yyyy')}</p>
        <p className={styles.timeRange}>
          {format(startLocal, 'h:mm a')} — {format(endLocal, 'h:mm a')}
          <span className={styles.duration}>
            ({Math.round((endLocal - startLocal) / 60_000)} min)
          </span>
        </p>
      </div>

      {/* Patient reason */}
      {appointment.patientReason && (
        <div className={styles.reasonBlock}>
          <p className={styles.reasonLabel}>Reason for visit</p>
          <p className={styles.reasonText}>{appointment.patientReason}</p>
        </div>
      )}

      {/* Doctor notes (if any already written) */}
      {appointment.doctorNotes && (
        <div className={styles.notesBlock}>
          <p className={styles.notesLabel}>Your notes</p>
          <p className={styles.notesText}>{appointment.doctorNotes}</p>
        </div>
      )}

      {/* ── Action buttons ──────────────────────────────────────────────── */}

      {/* Status transitions */}
      {transitions.length > 0 && (
        <div className={styles.statusActions}>
          <p className={styles.actionLabel}>Update status</p>
          <div className={styles.btnRow}>
            {transitions.map((status) => {
              const meta = ACTION_META[status];
              return (
                <button
                  key={status}
                  className={`${styles.actionBtn} ${styles[meta.className]}`}
                  onClick={() => onStatusUpdate(appointment.id, status)}
                >
                  {meta.label}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Navigation links */}
      <div className={styles.navActions}>
        {['Pending', 'Confirmed'].includes(appointment.status) && (
          <Link
            to={`/doctor/chat/${appointment.id}`}
            className={`${styles.actionBtn} ${styles.btnChat}`}
          >
            {/* Chat icon */}
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2.5"
              strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
            Open chat
          </Link>
        )}

        <Link
          to={`/doctor/notes/${appointment.id}`}
          className={`${styles.actionBtn} ${styles.btnNotes}`}
        >
          {/* File icon */}
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2.5"
            strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="16" y1="13" x2="8" y2="13" />
            <line x1="16" y1="17" x2="8" y2="17" />
          </svg>
          {appointment.doctorNotes ? 'Edit notes' : 'Write notes'}
        </Link>
      </div>

    </div>
  );
}