// =============================================================================
// src/pages/patient/BookAppointment.jsx — The full 4-step booking wizard.
//
// This page is just an orchestrator — it renders the correct step component
// based on useBookingFlow().step, passing only the props each step needs.
// No state lives here — it all lives in useBookingFlow.
// =============================================================================

// Removed unused imports
import useBookingFlow from '../../hooks/useBookingFlow';
import BookingProgress from '../../components/booking/BookingProgress';
import DoctorPicker    from '../../components/booking/DoctorPicker';
import CalendarPicker  from '../../components/booking/CalendarPicker';
import SlotPicker      from '../../components/booking/SlotPicker';
import BookingConfirm  from '../../components/booking/BookingConfirm';
import styles from './BookAppointment.module.css';

export default function BookAppointment() {
  const flow = useBookingFlow();

  // Step label map for the page heading
  const stepHeadings = {
    doctor:  'Choose your doctor',
    date:    `Availability for Dr. ${flow.selectedDoctor?.fullName ?? ''}`,
    slot:    'Choose a time',
    confirm: 'Review & confirm',
  };

  return (
    <div className={styles.page}>

      {/* Page heading */}
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>Book an appointment</h1>
        <p className={styles.pageSubtitle}>{stepHeadings[flow.step]}</p>
      </div>

      {/* Step progress indicator */}
      <BookingProgress stepIndex={flow.stepIndex} />

      {/* Global error banner */}
      {flow.error && (
        <div className={styles.errorBanner} role="alert">
          <span>{flow.error}</span>
          <button onClick={() => flow.setError('')} className={styles.errorDismiss}>×</button>
        </div>
      )}

      {/* Step content */}
      <div className={styles.stepContent}>

        {flow.step === 'doctor' && (
          <DoctorPicker
            doctors={flow.doctors}
            isLoading={flow.isDoctorsLoading}
            onSelect={flow.handleDoctorSelect}
          />
        )}

        {flow.step === 'date' && (
          <div className={styles.dateSlotLayout}>
            <CalendarPicker
              selectedDate={flow.selectedDate}
              currentMonth={flow.currentMonth}
              onDateSelect={flow.handleDateSelect}
              onMonthChange={flow.setCurrentMonth}
              availabilityJson={flow.selectedDoctor?.availabilityJson ?? '[]'}
            />
          </div>
        )}

        {flow.step === 'slot' && (
          <SlotPicker
            slots={flow.slots}
            selectedSlot={flow.selectedSlot}
            isLoading={flow.isSlotsLoading}
            selectedDate={flow.selectedDate}
            onSlotSelect={flow.handleSlotSelect}
          />
        )}

        {flow.step === 'confirm' && (
          <BookingConfirm
            doctor={flow.selectedDoctor}
            selectedDate={flow.selectedDate}
            selectedSlot={flow.selectedSlot}
            patientReason={flow.patientReason}
            isTelehealth={flow.isTelehealth}
            isSubmitting={flow.isSubmitting}
            onReasonChange={flow.setPatientReason}
            onTelehealthChange={flow.setIsTelehealth}
            onConfirm={flow.handleConfirm}
          />
        )}

      </div>

      {/* Back button — not shown on step 1 */}
      {flow.stepIndex > 0 && (
        <button
          className={styles.backBtn}
          onClick={flow.goBack}
          disabled={flow.isSubmitting}
        >
          ← Back
        </button>
      )}

    </div>
  );
}