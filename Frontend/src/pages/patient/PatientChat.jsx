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
        const all = await getMyAppointmentsApi();
        const found = all.find((a) => a.id === appointmentId);
        setAppointment(found ?? null);
      } catch {
        // Error handling inside ChatBox
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
      <div className={styles.pageHeader}>
        <Link to="/patient/appointments" className={styles.backLink}>
          ← My appointments
        </Link>
        <div className={styles.infoCard}>
          <h1 className={styles.pageTitle}>
            Telehealth Session
          </h1>
          <p className={styles.apptMeta}>
            <span>{appointment.doctorSpecialization}</span>
            <span className={styles.metaDot}></span>
            <span>
              {new Date(appointment.startTimeUtc).toLocaleString(undefined, {
                dateStyle: 'medium',
                timeStyle: 'short',
              })}
            </span>
          </p>
        </div>
      </div>

      <ChatBox
        appointmentId={appointmentId}
        appointmentStatus={appointment.status}
        doctorName={appointment.doctorFullName}
        doctorAvatar={appointment.doctorProfilePictureUrl}
      />
    </div>
  );
}