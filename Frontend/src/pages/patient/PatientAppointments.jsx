import { useState, useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { getMyAppointmentsApi } from '../../api/appointmentsApi';
import styles from './PatientAppointments.module.css';

export default function PatientAppointments() {
  const location = useLocation();
  const [appointments, setAppointments] = useState([]);
  const [isLoading,    setIsLoading]    = useState(true);
  const [error,        setError]        = useState('');
  const [showSuccess,  setShowSuccess]  = useState(
    location.state?.bookingSuccess === true
  );

  useEffect(() => {
    getMyAppointmentsApi()
      .then(setAppointments)
      .catch(() => setError('Could not load your appointments.'))
      .finally(() => setIsLoading(false));
  }, []);

  useEffect(() => {
    if (!showSuccess) return;
    const timer = setTimeout(() => setShowSuccess(false), 5000);
    return () => clearTimeout(timer);
  }, [showSuccess]);

  // Skeleton loading
  if (isLoading) {
    return (
      <div className={styles.page}>
        <div className={styles.header}>
          <div className="skeleton" style={{ width: 200, height: 28 }} />
          <div className="skeleton" style={{ width: 120, height: 40, borderRadius: 'var(--radius-md)' }} />
        </div>
        <div className={styles.list}>
          {[1, 2, 3].map((i) => (
            <div key={i} className={`card ${styles.skeletonCard}`}>
              <div>
                <div className="skeleton-text medium" />
                <div className="skeleton-text short" />
              </div>
              <div className="skeleton" style={{ width: 80, height: 24, borderRadius: 'var(--radius-full)' }} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      {/* Success banner */}
      {showSuccess && (
        <div className="success-banner">
          <span>Your appointment has been booked successfully!</span>
          <button onClick={() => setShowSuccess(false)}>×</button>
        </div>
      )}

      {/* Error banner */}
      {error && (
        <div className="error-banner" role="alert">
          <span>{error}</span>
          <button onClick={() => setError('')}>×</button>
        </div>
      )}

      {/* Page header */}
      <div className={styles.header}>
        <h1 className="page-title">My appointments</h1>
        <Link to="/patient/book" className="btn-primary">
          + Book new
        </Link>
      </div>

      {/* Content */}
      {appointments.length === 0 ? (
        <div className="empty-state">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
          </svg>
          <p>No appointments yet.</p>
          <p><Link to="/patient/book">Book your first visit →</Link></p>
        </div>
      ) : (
        <div className={styles.list}>
          {appointments.map((appt) => (
            <div key={appt.id} className={`card ${styles.apptCard}`}>
              <div className={styles.apptInfo}>
                <p className={styles.doctorName}>
                  Dr. {appt.doctorFullName}
                </p>
                <p className={styles.apptMeta}>
                  {appt.doctorSpecialization} ·{' '}
                  {new Date(appt.startTimeUtc).toLocaleString(undefined, {
                    dateStyle: 'medium', timeStyle: 'short',
                  })}
                </p>
                {appt.patientReason && (
                  <p className={styles.reason}>"{appt.patientReason}"</p>
                )}
              </div>
              <div className={styles.apptActions}>
                <span className={`status-pill ${appt.status.toLowerCase()}`}>
                  {appt.status}
                </span>
                {['Pending', 'Confirmed'].includes(appt.status) && (
                  <Link to={`/patient/chat/${appt.id}`} className={styles.chatLink}>
                    Open chat →
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}