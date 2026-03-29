// =============================================================================
// src/components/booking/BookingProgress.jsx — Visual step indicator.
// Shows the patient exactly where they are in the 4-step flow.
// =============================================================================

import styles from './BookingProgress.module.css';

const STEP_LABELS = ['Choose doctor', 'Choose date', 'Choose time', 'Confirm'];

export default function BookingProgress({ stepIndex }) {
  return (
    <nav className={styles.progress} aria-label="Booking steps">
      {STEP_LABELS.map((label, i) => {
        const isComplete = i < stepIndex;
        const isActive   = i === stepIndex;

        return (
          <div key={label} className={styles.stepWrap}>
            {/* Connector line between steps */}
            {i > 0 && (
              <div
                className={`${styles.connector} ${isComplete ? styles.connectorDone : ''}`}
              />
            )}

            <div
              className={`
                ${styles.step}
                ${isActive   ? styles.stepActive   : ''}
                ${isComplete ? styles.stepComplete  : ''}
              `}
              aria-current={isActive ? 'step' : undefined}
            >
              {/* Step number or checkmark */}
              <div className={styles.stepCircle}>
                {isComplete ? (
                  // Checkmark SVG — no icon library needed
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                    stroke="currentColor" strokeWidth="3"
                    strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                ) : (
                  <span>{i + 1}</span>
                )}
              </div>
              <span className={styles.stepLabel}>{label}</span>
            </div>
          </div>
        );
      })}
    </nav>
  );
}