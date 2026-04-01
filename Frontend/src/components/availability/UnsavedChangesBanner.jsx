// =============================================================================
// src/components/availability/UnsavedChangesBanner.jsx
//
// A sticky warning strip shown when isDirty is true.
// Gives the doctor two quick actions: Save or Discard.
// Sticky positioning keeps it visible even when the schedule grid is long.
// =============================================================================

import styles from './UnsavedChangesBanner.module.css';

export default function UnsavedChangesBanner({ isSaving, onSave, onDiscard }) {
  return (
    <div className={styles.banner} role="status">
      <div className={styles.left}>
        {/* Warning dot */}
        <span className={styles.dot} aria-hidden="true" />
        <span className={styles.message}>You have unsaved changes.</span>
      </div>
      <div className={styles.actions}>
        <button
          className={styles.discardBtn}
          onClick={onDiscard}
          disabled={isSaving}
        >
          Discard
        </button>
        <button
          className={styles.saveBtn}
          onClick={onSave}
          disabled={isSaving}
        >
          {isSaving ? (
            <>
              <span className={styles.spinner} aria-hidden="true" />
              Saving…
            </>
          ) : (
            'Save schedule'
          )}
        </button>
      </div>
    </div>
  );
}