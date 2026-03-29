

import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getMyScheduleApi } from '../../api/appointmentsApi';
import ChatBox from '../../components/chat/ChatBox';
import styles from '../patient/PatientChat.module.css'; // Reuse same styles

export default function DoctorChat() {
  const { appointmentId } = useParams();

  const [appointment, setAppointment] = useState(null);
  const [isLoading,   setIsLoading]   = useState(true);

  useEffect(() => {
    const loadAppointment = async () => {
      try {
        const all = await getMyScheduleApi();
        setAppointment(all.find((a) => a.id === appointmentId) ?? null);
      } catch {
        // silently handled — ChatBox shows its own errors
      } finally {
        setIsLoading(false);
      }
    };
    loadAppointment();
  }, [appointmentId]);

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
    <div className={styles.chatPage}>
      <div className={styles.pageHeader}>
        <Link to="/doctor/schedule" className={styles.backLink}>
          ← My schedule
        </Link>
        <div className={styles.apptInfo}>
          <h1 className={styles.pageTitle}>
            Chat with {appointment.patientFullName}
          </h1>
          <p className={styles.apptMeta}>
            {appointment.patientReason && `"${appointment.patientReason}" · `}
            {new Date(appointment.startTimeUtc).toLocaleString(undefined, {
              dateStyle: 'medium',
              timeStyle: 'short',
            })}
          </p>
        </div>
      </div>

      <ChatBox
        appointmentId={appointmentId}
        appointmentStatus={appointment.status}
      />
    </div>
  );
}