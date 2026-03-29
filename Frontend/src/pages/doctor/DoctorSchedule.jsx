// =============================================================================
// src/pages/doctor/DoctorSchedule.jsx — The full schedule page.
//
// Layout: DateStrip (full width) → two-column grid below
//   Left (65%):  DaySummary stats + ScheduleTimeline
//   Right (35%): AppointmentDetailCard
//
// The page is purely an orchestrator — all state lives in useDoctorSchedule.
// =============================================================================

import useDoctorSchedule from '../../hooks/useDoctorSchedule';
import DateStrip              from '../../components/schedule/DateStrip';
import DaySummary             from '../../components/schedule/DaySummary';
import ScheduleTimeline       from '../../components/schedule/ScheduleTimeline';
import AppointmentDetailCard  from '../../components/schedule/AppointmentDetailCard';
import styles from './DoctorSchedule.module.css';

export default function DoctorSchedule() {
  const schedule = useDoctorSchedule();

  return (
    <div className={styles.page}>

      {/* Page heading */}
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>My schedule</h1>
        {schedule.error && (
          <div className={styles.errorBanner} role="alert">
            <span>{schedule.error}</span>
            <button
              onClick={() => schedule.setError('')}
              className={styles.errorDismiss}
            >
              ×
            </button>
          </div>
        )}
      </div>

      {/* Date navigation strip — full width */}
      <DateStrip
        weekDates={schedule.weekDates}
        selectedDate={schedule.selectedDate}
        onDateSelect={schedule.handleDateSelect}
        onPrevWeek={schedule.goToPrevWeek}
        onNextWeek={schedule.goToNextWeek}
        allAppointments={schedule.allAppointments}
      />

      {/* Two-column layout: timeline left, detail card right */}
      <div className={styles.columns}>

        {/* Left column */}
        <div className={styles.leftCol}>
          <DaySummary
            appointments={schedule.appointments}
            selectedDate={schedule.selectedDate}
          />
          <ScheduleTimeline
            appointments={schedule.appointments}
            selectedDate={schedule.selectedDate}
            selectedApptId={schedule.selectedAppt?.id}
            isLoading={schedule.isLoading}
            onAppointmentClick={schedule.setSelectedAppt}
          />
        </div>

        {/* Right column */}
        <div className={styles.rightCol}>
          <AppointmentDetailCard
            appointment={schedule.selectedAppt}
            onStatusUpdate={schedule.handleStatusUpdate}
          />
        </div>

      </div>
    </div>
  );
}