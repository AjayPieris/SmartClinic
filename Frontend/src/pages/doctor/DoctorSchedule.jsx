import { useState, useEffect } from 'react';
import { getMyScheduleApi, updateAppointmentStatusApi } from '../../api/appointmentsApi';
import { useAuth } from '../../context/AuthContext';
import { Link } from 'react-router-dom';
import styles from './DoctorSchedule.module.css';

export default function DoctorSchedule() {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [isLoading,    setIsLoading]    = useState(true);
  const [error,        setError]        = useState('');

  useEffect(() => {
    // Only fetch if logged in as a doctor
    if (!user || user.role !== 'Doctor') return;

    getMyScheduleApi()
      .then(setAppointments)
      .catch((err) => setError(err.response?.data?.message || 'Could not load your schedule.'))
      .finally(() => setIsLoading(false));
  }, [user]);

  const handleStatusChange = async (appointmentId, newStatus) => {
    try {
      const updated = await updateAppointmentStatusApi(appointmentId, newStatus);
      // Update local state without full refetch
      setAppointments((prev) =>
        prev.map((a) => (a.id === appointmentId ? { ...a, status: updated.status } : a))
      );
    } catch (err) {
      alert('Failed to update status.');
    }
  };

  if (isLoading) {
    return (
      <div className={styles.page}>
        <div className="skeleton" style={{ width: 180, height: 28, marginBottom: 'var(--space-6)' }} />
        <div className={styles.grid}>
          {[1, 2, 3].map(i => (
            <div key={i} className={`card ${styles.apptCard}`}>
              <div className="skeleton-text medium" />
              <div className="skeleton-text short" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <h1 className="page-title">Upcoming schedule</h1>

      {error && (
        <div className="error-banner">
          <span>{error}</span>
          <button onClick={() => setError('')}>×</button>
        </div>
      )}

      {appointments.length === 0 && !error ? (
        <div className="empty-state card">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5m-2.25-6.5h.008v.008H18.75V10.5Z" />
          </svg>
          <p>You have no upcoming appointments.</p>
        </div>
      ) : (
        <div className={styles.grid}>
          {appointments.map((appt) => (
            <div key={appt.id} className={`card ${styles.apptCard}`}>
              <div className={styles.header}>
                <div>
                  <h3 className={styles.patientName}>{appt.patientFullName}</h3>
                  <p className={styles.timeLine}>
                    {new Date(appt.startTimeUtc).toLocaleString(undefined, {
                      dateStyle: 'medium', timeStyle: 'short',
                    })}
                  </p>
                </div>
                <span className={`status-pill ${appt.status.toLowerCase()}`}>
                  {appt.status}
                </span>
              </div>

              {appt.patientReason && (
                <div className={styles.reasonBlock}>
                  <strong>Reason: </strong> {appt.patientReason}
                </div>
              )}

              <div className={styles.actions}>
                {/* Chat and Notes usually available unless Cancelled */}
                {appt.status !== 'Cancelled' && (
                  <div className={styles.primaryActions}>
                    <Link to={`/doctor/chat/${appt.id}`} className="btn-primary" style={{ flex: 1 }}>
                      Chat
                    </Link>
                    <Link to={`/doctor/notes/${appt.id}`} className="btn-secondary" style={{ flex: 1 }}>
                      Notes
                    </Link>
                  </div>
                )}

                {/* Status transitions */}
                {appt.status === 'Pending' && (
                  <div className={styles.statusActions}>
                    <button onClick={() => handleStatusChange(appt.id, 'Confirmed')} className={styles.btnApprove}>
                      Approve request
                    </button>
                    <button onClick={() => handleStatusChange(appt.id, 'Cancelled')} className={styles.btnCancel}>
                      Cancel
                    </button>
                  </div>
                )}

                {appt.status === 'Confirmed' && (
                  <div className={styles.statusActions}>
                    <button onClick={() => handleStatusChange(appt.id, 'Completed')} className={styles.btnComplete}>
                      Mark as Completed
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}