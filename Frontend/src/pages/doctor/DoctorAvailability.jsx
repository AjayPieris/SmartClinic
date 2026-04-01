// =============================================================================
// src/pages/doctor/DoctorAvailability.jsx — The full availability editor.
//
// Two-column layout:
//   Left  (60%): WeekGrid (duration selector + 7 DayRows)
//   Right (40%): AvailabilityPreview (live stats)
//
// The UnsavedChangesBanner is rendered full-width above the columns when
// isDirty is true — it sticks below the NavBar as the user scrolls.
// =============================================================================

import useAvailabilityEditor   from '../../hooks/useAvailabilityEditor';
import WeekGrid                from '../../components/availability/WeekGrid';
import AvailabilityPreview     from '../../components/availability/AvailabilityPreview';
import UnsavedChangesBanner    from '../../components/availability/UnsavedChangesBanner';
import styles from './DoctorAvailability.module.css';

export default function DoctorAvailability() {
  const editor = useAvailabilityEditor();

  if (editor.isLoading) {
    return (
      <div className="screen-center">
        <div className="spinner" role="status" aria-label="Loading your schedule…" />
      </div>
    );
  }

  return (
    <div className={styles.page}>

      {/* Page heading */}
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>Availability</h1>
          <p className={styles.pageSubtitle}>
            Set the days and hours when patients can book appointments with you.
          </p>
        </div>
      </div>

      {/* Success banner */}
      {editor.successMsg && (
        <div className={styles.successBanner} role="status">
          <span>{editor.successMsg}</span>
          <button onClick={() => editor.setError('')}>×</button>
        </div>
      )}

      {/* Error banner */}
      {editor.error && (
        <div className={styles.errorBanner} role="alert">
          <span>{editor.error}</span>
          <button onClick={() => editor.setError('')}>×</button>
        </div>
      )}

      {/* Unsaved changes sticky banner */}
      {editor.isDirty && (
        <UnsavedChangesBanner
          isSaving={editor.isSaving}
          onSave={editor.save}
          onDiscard={editor.resetToSaved}
        />
      )}

      {/* Two-column layout */}
      <div className={styles.columns}>

        {/* Left: weekly schedule grid */}
        <div className={styles.leftCol}>
          <WeekGrid
            schedule={editor.schedule}
            consultationDuration={editor.consultationDuration}
            onDurationChange={editor.setConsultationDuration}
            onToggleDay={editor.toggleDay}
            onTimeChange={editor.setDayTime}
          />
        </div>

        {/* Right: live preview */}
        <aside className={styles.rightCol}>
          <AvailabilityPreview
            schedule={editor.schedule}
            consultationDuration={editor.consultationDuration}
          />

          {/* Save button also lives here for easy access below preview */}
          <button
            className={styles.saveBtnBottom}
            onClick={editor.save}
            disabled={editor.isSaving || !editor.isDirty}
          >
            {editor.isSaving ? (
              <>
                <span className={styles.saveBtnSpinner} aria-hidden="true" />
                Saving…
              </>
            ) : (
              'Save schedule'
            )}
          </button>

          {!editor.isDirty && (
            <p className={styles.savedNote}>
              All changes saved.
            </p>
          )}
        </aside>

      </div>

    </div>
  );
}