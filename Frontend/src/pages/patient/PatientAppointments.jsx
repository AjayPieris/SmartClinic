// ADD this inside PatientAppointments.jsx (replace the stub):

import { useState, useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { getMyAppointmentsApi } from '../../api/appointmentsApi';

export default function PatientAppointments() {
  const location = useLocation();
  const [appointments, setAppointments] = useState([]);
  const [isLoading,    setIsLoading]    = useState(true);
  const [showSuccess,  setShowSuccess]  = useState(
    // Read the bookingSuccess flag set by useBookingFlow after confirm
    location.state?.bookingSuccess === true
  );

  useEffect(() => {
    getMyAppointmentsApi()
      .then(setAppointments)
      .finally(() => setIsLoading(false));
  }, []);

  // Auto-dismiss the success banner after 5 seconds
  useEffect(() => {
    if (!showSuccess) return;
    const timer = setTimeout(() => setShowSuccess(false), 5000);
    return () => clearTimeout(timer);
  }, [showSuccess]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

      {/* Success banner */}
      {showSuccess && (
        <div style={{
          background: '#d1fae5', border: '1px solid #6ee7b7',
          borderRadius: 'var(--radius-md)', padding: '1rem 1.5rem',
          color: '#065f46', fontWeight: 500, display: 'flex',
          justifyContent: 'space-between', alignItems: 'center',
        }}>
          <span>Your appointment has been booked successfully!</span>
          <button onClick={() => setShowSuccess(false)}
            style={{ fontSize: '1.2rem', color: '#065f46', opacity: 0.7 }}>×</button>
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ fontSize: '1.4rem', fontWeight: 700 }}>My appointments</h1>
        <Link to="/patient/book" style={{
          padding: '0.6rem 1.2rem', background: 'var(--color-primary)',
          color: '#fff', borderRadius: 'var(--radius-md)', fontWeight: 600,
          fontSize: '0.9rem',
        }}>
          + Book new
        </Link>
      </div>

      {isLoading ? (
        <div className="screen-center"><div className="spinner" /></div>
      ) : appointments.length === 0 ? (
        <p style={{ color: 'var(--color-text-muted)', textAlign: 'center', padding: '3rem' }}>
          No appointments yet.{' '}
          <Link to="/patient/book">Book your first visit →</Link>
        </p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {appointments.map((appt) => (
            <div key={appt.id} style={{
              background: 'var(--color-surface)', border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-lg)', padding: '1.25rem 1.5rem',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            }}>
              <div>
                <p style={{ fontWeight: 600, marginBottom: 2 }}>
                  Dr. {appt.doctorFullName}
                </p>
                <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>
                  {appt.doctorSpecialization} ·{' '}
                  {new Date(appt.startTimeUtc).toLocaleString(undefined, {
                    dateStyle: 'medium', timeStyle: 'short',
                  })}
                </p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <span className={`role-badge ${appt.status.toLowerCase()}`}
                  style={{ textTransform: 'capitalize' }}>
                  {appt.status}
                </span>
                {['Pending','Confirmed'].includes(appt.status) && (
                  <Link to={`/patient/chat/${appt.id}`}
                    style={{ fontSize: '0.875rem', color: 'var(--color-primary)', fontWeight: 500 }}>
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