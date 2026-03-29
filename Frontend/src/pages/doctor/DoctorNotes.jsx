// =============================================================================
// src/pages/doctor/DoctorNotes.jsx
//
// A focused notes editor for a single appointment.
// Auto-saves on a 2-second debounce after the doctor stops typing.
// Also has an explicit Save button for peace of mind.
//
// Route: /doctor/notes/:appointmentId
// =============================================================================

import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getMyScheduleApi, updateAppointmentStatusApi } from '../../api/appointmentsApi';
import axiosInstance from '../../api/axiosInstance';
import styles from './DoctorNotes.module.css';

export default function DoctorNotes() {
  const { appointmentId } = useParams();

  const [appointment, setAppointment] = useState(null);
  const [notes,       setNotes]       = useState('');
  const [isLoading,   setIsLoading]   = useState(true);
  const [isSaving,    setIsSaving]    = useState(false);
  const [lastSaved,   setLastSaved]   = useState(null);
  const [error,       setError]       = useState('');

  const debounceRef = useRef(null);

  // ── Load appointment ────────────────────────────────────────────────────
  useEffect(() => {
    const load = async () => {
      try {
        const all  = await getMyScheduleApi();
        const appt = all.find((a) => a.id === appointmentId);
        if (appt) {
          setAppointment(appt);
          setNotes(appt.doctorNotes ?? '');
        }
      } catch {
        setError('Could not load appointment.');
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [appointmentId]);

  // ── Save notes ──────────────────────────────────────────────────────────
  const saveNotes = useCallback(async (text) => {
    setIsSaving(true);
    setError('');
    try {
      // PATCH the doctor notes field on the appointment.
      // We add a dedicated endpoint here — add to AppointmentsController:
      //   PATCH /api/appointments/{id}/notes  body: { notes: string }
      await axiosInstance.patch(`/appointments/${appointmentId}/notes`, {
        notes: text,
      });
      setLastSaved(new Date());
    } catch {
      setError('Auto-save failed. Please save manually.');
    } finally {
      setIsSaving(false);
    }
  }, [appointmentId]);

  // ── Debounced auto-save ─────────────────────────────────────────────────
  const handleNotesChange = (e) => {
    const value = e.target.value;
    setNotes(value);

    // Clear any pending debounce timer
    if (debounceRef.current) clearTimeout(debounceRef.current);

    // Schedule auto-save 2 seconds after last keystroke
    debounceRef.current = setTimeout(() => {
      saveNotes(value);
    }, 2000);
  };

  // Cleanup debounce on unmount
  useEffect(() => () => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
  }, []);

  if (isLoading) {
    return <div className="screen-center"><div className="spinner" /></div>;
  }

  if (!appointment) {
    return (
      <div style={{ padding: '2rem', color: 'var(--color-text-muted)' }}>
        <p>Appointment not found.</p>
        <Link to="/doctor/schedule">← Back to schedule</Link>
      </div>
    );
  }

  return (
    <div className={styles.page}>

      {/* Header */}
      <div className={styles.header}>
        <Link to="/doctor/schedule" className={styles.backLink}>
          ← Back to schedule
        </Link>
        <div>
          <h1 className={styles.title}>Medical notes</h1>
          <p className={styles.subtitle}>
            {appointment.patientFullName} ·{' '}
            {new Date(appointment.startTimeUtc).toLocaleDateString(undefined, {
              dateStyle: 'medium',
            })}
          </p>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className={styles.errorBanner} role="alert">
          {error}
          <button onClick={() => setError('')} style={{ marginLeft: '1rem', opacity: 0.7 }}>×</button>
        </div>
      )}

      {/* Notes textarea */}
      <div className={styles.editorWrap}>
        <textarea
          className={styles.editor}
          value={notes}
          onChange={handleNotesChange}
          placeholder="Write your clinical notes here…&#10;&#10;• Chief complaint&#10;• Examination findings&#10;• Assessment&#10;• Plan"
          aria-label="Doctor notes"
          spellCheck
        />

        {/* Save status bar */}
        <div className={styles.saveBar}>
          <span className={styles.saveStatus}>
            {isSaving && 'Saving…'}
            {!isSaving && lastSaved && (
              `Saved at ${lastSaved.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
            )}
            {!isSaving && !lastSaved && 'Unsaved changes will auto-save'}
          </span>
          <button
            className={styles.saveBtn}
            onClick={() => saveNotes(notes)}
            disabled={isSaving}
          >
            {isSaving ? 'Saving…' : 'Save notes'}
          </button>
        </div>
      </div>

      {/* Quick patient summary sidebar info */}
      <div className={styles.patientMeta}>
        <p className={styles.metaLabel}>Reason for visit</p>
        <p className={styles.metaValue}>
          {appointment.patientReason || 'Not specified'}
        </p>
      </div>

    </div>
  );
}