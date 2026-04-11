import { format } from 'date-fns';
import { Link } from 'react-router-dom';
import styles from './AppointmentDetailCard.module.css';

const STATUS_TRANSITIONS = {
  Pending:   ['Confirmed', 'Cancelled'],
  Confirmed: ['Completed', 'Cancelled'],
  Completed: [],
  Cancelled: [],
};

const ACTION_META = {
  Confirmed: { label: 'Confirm Appointment', className: 'btnConfirm', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg> },
  Completed: { label: 'Mark as Completed', className: 'btnComplete', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg> },
  Cancelled: { label: 'Cancel', className: 'btnCancel', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg> },
};

export default function AppointmentDetailCard({
  appointment,
  onStatusUpdate,
}) {
  if (!appointment) {
    return (
      <div className={styles.emptyCard}>
        <div className={styles.emptyIconWrap}>
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
            <circle cx="12" cy="15" r="2" />
          </svg>
        </div>
        <p className={styles.emptyTitle}>Select an appointment</p>
        <p className={styles.emptyHint}>Click any slot on the timeline to view details.</p>
      </div>
    );
  }

  const startLocal = new Date(appointment.startTimeUtc);
  const endLocal   = new Date(appointment.endTimeUtc);
  const transitions = STATUS_TRANSITIONS[appointment.status] ?? [];

  return (
    <div className={styles.card}>
      <div className={styles.patientProfilePlate}>
        <div className={styles.avatarGlowRing}>
          {appointment.patientProfilePictureUrl ? (
            <img src={appointment.patientProfilePictureUrl} alt={appointment.patientFullName} />
          ) : (
            <div className={styles.avatarFallback}>{appointment.patientFullName?.charAt(0) ?? '?'}</div>
          )}
        </div>
        
        <h3 className={styles.patientName}>{appointment.patientFullName}</h3>
        
        <div className={styles.statusRow}>
          <span className={`${styles.statusBadge} ${styles[`status${appointment.status}`]}`}>
            {appointment.status}
          </span>
        </div>
      </div>

      <div className={styles.cardBody}>
        {/* Time Data */}
        <div className={styles.infoRow}>
          <div className={styles.infoIcon}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
          </div>
          <div className={styles.infoContent}>
            <p className={styles.infoTitle}>{format(startLocal, 'EEEE, MMMM d, yyyy')}</p>
            <p className={styles.infoSub}>{format(startLocal, 'h:mm a')} — {format(endLocal, 'h:mm a')} ({Math.round((endLocal - startLocal) / 60_000)} min)</p>
          </div>
        </div>

        {/* Telehealth Data */}
        {appointment.isTelehealth && (
          <div className={styles.infoRow}>
             <div className={`${styles.infoIcon} ${styles.iconInfo}`}>
               <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="23 7 16 12 23 17 23 7"></polygon><rect x="1" y="5" width="15" height="14" rx="2" ry="2"></rect></svg>
             </div>
             <div className={styles.infoContent}>
               <p className={styles.infoTitle}>Telehealth Session</p>
               <p className={styles.infoSub}>Remote video consultation</p>
             </div>
          </div>
        )}

        {/* Reason Data */}
        {appointment.patientReason && (
          <div className={styles.infoRow}>
            <div className={styles.infoIcon}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
            </div>
            <div className={styles.infoContent}>
              <p className={styles.infoTitle}>Reason for visit</p>
              <p className={styles.infoSub}>{appointment.patientReason}</p>
            </div>
          </div>
        )}
      </div>

      <div className={styles.cardActions}>
        <div className={styles.mainTransitions}>
          {transitions.map((status) => {
            const meta = ACTION_META[status];
            return (
              <button
                key={status}
                className={`${styles.actionBtn} ${styles[meta.className]}`}
                onClick={() => onStatusUpdate(appointment.id, status)}
              >
                {meta.icon}
                {meta.label}
              </button>
            );
          })}
        </div>

        <div className={styles.secondaryLinks}>
          {['Pending', 'Confirmed'].includes(appointment.status) && (
            <Link to={`/doctor/chat/${appointment.id}`} className={`${styles.linkBtn} ${styles.btnChat}`}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
              Open Chat
            </Link>
          )}

          <Link to={`/doctor/notes/${appointment.id}`} className={`${styles.linkBtn} ${styles.btnNotes}`}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line></svg>
            Write Notes
          </Link>
        </div>
      </div>
    </div>
  );
}