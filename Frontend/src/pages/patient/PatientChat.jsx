

import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getMyAppointmentsApi } from '../../api/appointmentsApi';
import ChatBox from '../../components/chat/ChatBox';
import styles from './PatientChat.module.css';

export default function PatientChat() {
  const { appointmentId } = useParams();

  const [appointment, setAppointment] = useState(null);
  const [isLoading,   setIsLoading]   = useState(true);

  useEffect(() => {
    const loadAppointment = async () => {
      try {
        // Fetch the full list and find this specific appointment.
        // In a larger app you'd have a GET /appointments/:id endpoint.
        const all = await getMyAppointmentsApi();
        const found = all.find((a) => a.id === appointmentId);
        setAppointment(found ?? null);
      } catch {
        // ChatBox has its own error handling — no need to duplicate here
      } finally {
        setIsLoading(false);
      }
    };

    loadAppointment();
  }, [appointmentId]);

  if (isLoading) {
    return (
      <div className="screen-center">
        <div className="spinner" />
      </div>
    );
  }

  if (!appointment) {
    return (
      <div className={styles.notFound}>
        <p>Appointment not found.</p>
        <Link to="/patient/appointments">← Back to appointments</Link>
      </div>
    );
  }

  return (
    <div className={styles.chatPage}>

      {/* Breadcrumb / context header */}
      <div className={styles.pageHeader}>
        <Link to="/patient/appointments" className={styles.backLink}>
          ← My appointments
        </Link>
        <div className={styles.apptInfo}>
          <h1 className={styles.pageTitle}>
            Chat with Dr. {appointment.doctorFullName}
          </h1>
          <p className={styles.apptMeta}>
            {appointment.doctorSpecialization} ·{' '}
            {new Date(appointment.startTimeUtc).toLocaleString(undefined, {
              dateStyle: 'medium',
              timeStyle: 'short',
            })}
          </p>
        </div>
      </div>

      {/* The ChatBox — full height within the page layout */}
      <ChatBox
        appointmentId={appointmentId}
        appointmentStatus={appointment.status}
      />

    </div>
  );
}