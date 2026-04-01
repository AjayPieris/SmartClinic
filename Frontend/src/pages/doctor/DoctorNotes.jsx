import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getMyScheduleApi } from '../../api/appointmentsApi';
import { useAuth } from '../../context/AuthContext';
import axiosInstance from '../../api/axiosInstance';
import styles from './DoctorNotes.module.css';

export default function DoctorNotes() {
  const { appointmentId: id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [appointment, setAppointment] = useState(null);
  const [notes, setNotes] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });

  useEffect(() => {
    // 1. Fetch the appointment to verify ownership and load existing notes
    // In a real app we'd have a specific GET /appointments/{id} endpoint.
    // Here we reuse getMyScheduleApi and filter locally.
    getMyScheduleApi()
      .then((appts) => {
        const target = appts.find(a => a.id === id);
        if (target) {
          setAppointment(target);
          setNotes(target.doctorNotes || '');
        } else {
          setMessage({ text: 'Appointment not found or unauthorized.', type: 'error' });
        }
      })
      .catch(() => setMessage({ text: 'Could not load appointment details.', type: 'error' }))
      .finally(() => setIsLoading(false));
  }, [id, user.userId]);

  const showMessage = (text, type) => {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text: '', type: '' }), 4000);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setMessage({ text: '', type: '' });

    try {
      // Backend expects PATCH with { notes: "..." } and returns 204 NoContent
      await axiosInstance.patch(`/appointments/${id}/notes`, {
        notes: notes
      });
      setAppointment(prev => ({ ...prev, doctorNotes: notes }));
      showMessage('Medical notes saved successfully.', 'success');
    } catch (err) {
      showMessage(err.response?.data?.message || 'Failed to save notes.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className={styles.page}>
        <div className="skeleton" style={{ width: '40%', height: 28, marginBottom: 16 }} />
        <div className="skeleton card" style={{ height: 300 }} />
      </div>
    );
  }

  if (!appointment) {
    return (
      <div className={styles.page}>
         <div className="error-banner">
           <span>{message.text}</span>
         </div>
         <button className="btn-secondary" onClick={() => navigate(-1)} style={{ alignSelf: 'flex-start' }}>
           ← Go back
         </button>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <button onClick={() => navigate(-1)} className={styles.backBtn}>
          ← Back
        </button>
        <h1 className="page-title">Medical Notes</h1>
      </div>

      {message.text && (
        <div className={message.type === 'error' ? 'error-banner' : 'success-banner'}>
          {message.text}
        </div>
      )}

      <div className={`card ${styles.consultationContext}`}>
        <div className={styles.contextRow}>
          <span className={styles.contextLabel}>Patient</span>
          <span className={styles.contextValue}>{appointment.patientFullName}</span>
        </div>
        <div className={styles.contextRow}>
          <span className={styles.contextLabel}>Date</span>
          <span className={styles.contextValue}>
            {new Date(appointment.startTimeUtc).toLocaleString(undefined, {
              dateStyle: 'medium', timeStyle: 'short'
            })}
          </span>
        </div>
        <div className={styles.contextRow}>
          <span className={styles.contextLabel}>Patient Reason</span>
          <span className={styles.contextValue}>
            {appointment.patientReason || 'Not provided'}
          </span>
        </div>
      </div>

      <form onSubmit={handleSave} className={`card ${styles.notesForm}`}>
        <div className={styles.formGroup}>
          <label htmlFor="notesInput" className={styles.label}>
            Clinical notes
          </label>
          <textarea
            id="notesInput"
            className="input"
            rows={10}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Enter symptoms, diagnosis, prescription details, etc..."
            required
            spellCheck="false"
          />
        </div>

        <div className={styles.footer}>
          <button type="submit" className="btn-primary" disabled={isSaving}>
            {isSaving ? 'Saving...' : 'Save securely'}
          </button>
        </div>
      </form>
    </div>
  );
}