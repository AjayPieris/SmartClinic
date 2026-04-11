import { useState, useEffect } from 'react';
import { startOfWeek, addDays, subWeeks, addWeeks, isSameDay } from 'date-fns';
import { getMyScheduleApi, updateAppointmentStatusApi } from '../../api/appointmentsApi';
import { getMyDoctorProfileApi } from '../../api/doctorsApi';
import { useAuth } from '../../context/AuthContext';
import DateStrip from '../../components/schedule/DateStrip';
import DaySummary from '../../components/schedule/DaySummary';
import ScheduleTimeline from '../../components/schedule/ScheduleTimeline';
import AppointmentDetailCard from '../../components/schedule/AppointmentDetailCard';
import styles from './DoctorSchedule.module.css';

export default function DoctorSchedule() {
  const { user } = useAuth();
  
  // Data state
  const [appointments, setAppointments] = useState([]);
  const [availability, setAvailability] = useState([]);
  const [verificationStatus, setVerificationStatus] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // UI state
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [weekStart, setWeekStart] = useState(startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [selectedApptId, setSelectedApptId] = useState(null);

  // Generate 7 days starting from weekStart
  const weekDates = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  useEffect(() => {
    if (!user || user.role !== 'Doctor') return;

    Promise.all([
      getMyDoctorProfileApi(),
      getMyScheduleApi()
    ])
    .then(([profile, schedule]) => {
      setVerificationStatus(profile.verificationStatus);
      setAvailability(JSON.parse(profile.availabilityJson || '[]'));
      setAppointments(schedule);
    })
    .catch((err) => setError(err.response?.data?.message || 'Could not load your schedule.'))
    .finally(() => setIsLoading(false));
  }, [user]);

  const handleStatusChange = async (appointmentId, newStatus) => {
    try {
      const updated = await updateAppointmentStatusApi(appointmentId, newStatus);
      setAppointments((prev) =>
        prev.map((a) => (a.id === appointmentId ? { ...a, status: updated.status } : a))
      );
    } catch (err) {
      alert('Failed to update status.');
    }
  };

  const handlePrevWeek = () => setWeekStart((prev) => subWeeks(prev, 1));
  const handleNextWeek = () => setWeekStart((prev) => addWeeks(prev, 1));

  const appointmentsForSelectedDate = appointments.filter((a) => 
    isSameDay(new Date(a.startTimeUtc), selectedDate)
  );

  const selectedAppointment = appointments.find((a) => a.id === selectedApptId);

  if (isLoading) {
    return (
      <div className={styles.page}>
         <div className="skeleton" style={{ width: 180, height: 28, marginBottom: 24 }} />
         <div className="skeleton" style={{ height: 500 }} />
      </div>
    );
  }

  if (verificationStatus !== 'Approved') {
    return (
      <div className={styles.page}>
        <div className="card" style={{ padding: '24px', border: '1px solid var(--color-warning)', background: '#fffbeb' }}>
          <h3 style={{ color: '#b45309', margin: '0 0 8px 0' }}>Account Not Verified</h3>
          <p style={{ margin: 0, color: 'var(--color-text-muted)' }}>
            Your account must be verified by an administrator before you can receive and manage appointments.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      
      {error && (
        <div className="error-banner">
          <span>{error}</span>
          <button onClick={() => setError('')}>×</button>
        </div>
      )}

      {/* Main Glassmorphism Layout */}
      <div className={styles.layoutBoard}>
        
        {/* Top Strip */}
        <div className={styles.topSection}>
          <DateStrip 
            weekDates={weekDates}
            selectedDate={selectedDate}
            onDateSelect={(date) => { setSelectedDate(date); setSelectedApptId(null); }}
            onPrevWeek={handlePrevWeek}
            onNextWeek={handleNextWeek}
            allAppointments={appointments}
          />
        </div>

        {/* Content Columns */}
        <div className={styles.contentColumns}>
          
          {/* Left Column: Summary + Timeline */}
          <div className={styles.leftCol}>
            <DaySummary 
              appointments={appointmentsForSelectedDate} 
              selectedDate={selectedDate} 
            />
            <ScheduleTimeline 
              appointments={appointmentsForSelectedDate}
              availability={availability}
              selectedDate={selectedDate}
              selectedApptId={selectedApptId}
              isLoading={isLoading}
              onAppointmentClick={(appt) => setSelectedApptId(appt.id)}
            />
          </div>

          {/* Right Column: Appointment Details */}
          <div className={styles.rightCol}>
            <AppointmentDetailCard 
              appointment={selectedAppointment}
              onStatusUpdate={handleStatusChange}
            />
          </div>
          
        </div>

      </div>

    </div>
  );
}