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
      await axiosInstance.patch(`/appointments/${id}/notes`, { notes });
      setAppointment(prev => ({ ...prev, doctorNotes: notes }));
      showMessage('Medical notes saved securely.', 'success');
    } catch (err) {
      showMessage(err.response?.data?.message || 'Failed to save notes.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className={styles.pageWrap}>
        <div className="skeleton" style={{ width: '40%', height: 28, marginBottom: 16 }} />
        <div className="skeleton" style={{ height: 300, borderRadius: 28 }} />
      </div>
    );
  }

  if (!appointment) {
    return (
      <div className={styles.pageWrap}>
         <div className={styles.errorCard}>
           <span>{message.text}</span>
           <button className={styles.backBtn} onClick={() => navigate(-1)}>
             ← Return to Schedule
           </button>
         </div>
      </div>
    );
  }

  return (
    <div className={styles.pageWrap}>
      
      <div className={styles.pageHeader}>
        <button onClick={() => navigate(-1)} className={styles.backBtn}>
          ← Back to Schedule
        </button>
      </div>

      {message.text && (
        <div className={`${styles.toast} ${styles[message.type]}`}>
          {message.text}
        </div>
      )}

      <div className={styles.layout}>
        
        {/* Left Column: Context Card */}
        <div className={styles.leftCol}>
          <div className={styles.glassCard}>
            <div className={styles.cardHeader}>
              <div className={styles.headerIcon}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline></svg>
              </div>
              <h2 className={styles.cardTitle}>Consultation</h2>
            </div>
            
            <div className={styles.contextGrid}>
              <div className={styles.contextRow}>
                <span className={styles.contextLabel}>Patient</span>
                <div className={styles.patientRow}>
                  <div className={styles.avatarMini}>
                    {appointment.patientProfilePictureUrl ? (
                      <img src={appointment.patientProfilePictureUrl} alt="" />
                    ) : (
                      <span>{appointment.patientFullName?.charAt(0) ?? '?'}</span>
                    )}
                  </div>
                  <span className={styles.contextValue}>{appointment.patientFullName}</span>
                </div>
              </div>

              <div className={styles.contextRow}>
                <span className={styles.contextLabel}>Date & Time</span>
                <span className={styles.contextValue}>
                  {new Date(appointment.startTimeUtc).toLocaleString(undefined, {
                    dateStyle: 'full', timeStyle: 'short'
                  })}
                </span>
              </div>

              <div className={styles.contextRow}>
                <span className={styles.contextLabel}>Reported Reason</span>
                <div className={styles.reasonBox}>
                  {appointment.patientReason || 'No reason provided by patient.'}
                </div>
              </div>

              <div className={styles.contextRow}>
                <span className={styles.contextLabel}>Status</span>
                <span className={`${styles.statusBadge} ${styles[appointment.status.toLowerCase()]}`}>
                  {appointment.status}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Editor */}
        <div className={styles.rightCol}>
          <form onSubmit={handleSave} className={`${styles.glassCard} ${styles.editorCard}`}>
            <div className={styles.editorHeader}>
              <h2 className={styles.cardTitle}>Clinical Notes</h2>
              <span className={styles.encryptionBadge}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                Secure Environment
              </span>
            </div>

            <div className={styles.editorWrapper}>
              <textarea
                className={styles.notesArea}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Type examination findings, diagnosis, and prescription details here..."
                required
                spellCheck="false"
              />
            </div>

            <div className={styles.editorFooter}>
              <button type="submit" className={styles.saveBtn} disabled={isSaving}>
                {isSaving ? (
                  <span className={styles.saveSpinner}></span>
                ) : (
                  <>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path><polyline points="17 21 17 13 7 13 7 21"></polyline><polyline points="7 3 7 8 15 8"></polyline></svg>
                    Save Notes securely
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

      </div>
    </div>
  );
}