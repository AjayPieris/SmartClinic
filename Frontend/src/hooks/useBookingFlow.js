

import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  getDoctorsApi,
  getDoctorBookedSlotsApi,
  bookAppointmentApi,
} from '../api/appointmentsApi';
import { generateSlots } from '../utils/slotGenerator';

// Step ordering — used for back/forward navigation
const STEPS = ['doctor', 'date', 'slot', 'confirm'];

export default function useBookingFlow() {
  const navigate = useNavigate();

  // ── Step tracking ───────────────────────────────────────────────────────
  const [step, setStep] = useState('doctor');

  // ── Step 1: Doctor selection ────────────────────────────────────────────
  const [doctors,          setDoctors]          = useState([]);
  const [isDoctorsLoading, setIsDoctorsLoading] = useState(true);
  const [selectedDoctor,   setSelectedDoctor]   = useState(null);

  // ── Step 2: Date selection ──────────────────────────────────────────────
  // currentMonth controls what the calendar renders (not necessarily selected)
  const [currentMonth,   setCurrentMonth]   = useState(new Date());
  const [selectedDate,   setSelectedDate]   = useState(null);

  // ── Step 3: Slot selection ──────────────────────────────────────────────
  const [slots,         setSlots]         = useState([]);
  const [isSlotsLoading, setIsSlotsLoading] = useState(false);
  const [selectedSlot,  setSelectedSlot]  = useState(null);

  // ── Step 4: Confirm ─────────────────────────────────────────────────────
  const [patientReason,  setPatientReason]  = useState('');
  const [isTelehealth,   setIsTelehealth]   = useState(true);
  const [isSubmitting,   setIsSubmitting]   = useState(false);

  // ── Global error ────────────────────────────────────────────────────────
  const [error, setError] = useState('');

  // ── Load doctors on mount ───────────────────────────────────────────────
  useEffect(() => {
    const load = async () => {
      try {
        const data = await getDoctorsApi();
        setDoctors(data);
      } catch {
        setError('Could not load doctors. Please refresh the page.');
      } finally {
        setIsDoctorsLoading(false);
      }
    };
    load();
  }, []);

  // ── Load booked slots whenever doctor + date both selected ───────────────
  useEffect(() => {
    if (!selectedDoctor || !selectedDate) return;

    const load = async () => {
      setIsSlotsLoading(true);
      setSelectedSlot(null); // Reset slot when date changes
      setError('');

      try {
        // Format date as YYYY-MM-DD using LOCAL date parts, NOT toISOString()
        // (toISOString converts to UTC first — in IST a local midnight becomes
        //  the previous UTC day, so the API would query the wrong date)
        const y   = selectedDate.getFullYear();
        const mo  = String(selectedDate.getMonth() + 1).padStart(2, '0');
        const day = String(selectedDate.getDate()).padStart(2, '0');
        const dateIso = `${y}-${mo}-${day}`;
        const booked  = await getDoctorBookedSlotsApi(selectedDoctor.id, dateIso);

        // Generate slots immediately after fetching booked data
        const generated = generateSlots(
          selectedDate,
          selectedDoctor.availabilityJson,
          booked,
          selectedDoctor.consultationDurationMinutes
        );
        setSlots(generated);
      } catch {
        setError('Could not load available slots. Please try again.');
        setSlots([]);
      } finally {
        setIsSlotsLoading(false);
      }
    };

    load();
  }, [selectedDoctor, selectedDate]);

  // ── Navigation helpers ──────────────────────────────────────────────────
  const goNext = useCallback(() => {
    const currentIndex = STEPS.indexOf(step);
    if (currentIndex < STEPS.length - 1) {
      setStep(STEPS[currentIndex + 1]);
      setError('');
    }
  }, [step]);

  const goBack = useCallback(() => {
    const currentIndex = STEPS.indexOf(step);
    if (currentIndex > 0) {
      setStep(STEPS[currentIndex - 1]);
      setError('');
    }
  }, [step]);

  // ── Step action handlers ────────────────────────────────────────────────
  const handleDoctorSelect = useCallback((doctor) => {
    setSelectedDoctor(doctor);
    setSelectedDate(null);    // Reset downstream selections
    setSelectedSlot(null);
    setSlots([]);
    goNext();
  }, [goNext]);

  const handleDateSelect = useCallback((date) => {
    setSelectedDate(date);
    setSelectedSlot(null);    // Reset slot when date changes
    goNext();
  }, [goNext]);

  const handleSlotSelect = useCallback((slot) => {
    if (!slot.available) return; // Ignore clicks on unavailable slots
    setSelectedSlot(slot);
    goNext();
  }, [goNext]);

  // ── Final submission ────────────────────────────────────────────────────
  const handleConfirm = useCallback(async () => {
    if (!selectedDoctor || !selectedSlot) return;

    setIsSubmitting(true);
    setError('');

    try {
      await bookAppointmentApi({
        doctorProfileId: selectedDoctor.id,
        startTimeUtc:    selectedSlot.startUtc,
        patientReason:   patientReason.trim() || undefined,
        isTelehealth,
      });

      // Success — navigate away with a success flag for the appointments page
      navigate('/patient/appointments', {
        state: { bookingSuccess: true },
        replace: true,
      });
    } catch (err) {
      const status = err.response?.status;

      if (status === 409) {
        // Double-booking — slot was grabbed by someone else between step 3 and now
        setError(
          'This slot was just booked by someone else. Please go back and choose a different time.'
        );
        // Take them back to slot selection automatically
        setStep('slot');
        setSelectedSlot(null);
      } else {
        setError(
          err.response?.data?.message ?? 'Booking failed. Please try again.'
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  }, [selectedDoctor, selectedSlot, patientReason, isTelehealth, navigate]);

  // ── Expose everything the UI needs ─────────────────────────────────────
  return {
    // Step tracking
    step,
    stepIndex: STEPS.indexOf(step),
    totalSteps: STEPS.length,
    goBack,

    // Step 1
    doctors, isDoctorsLoading, selectedDoctor, handleDoctorSelect,

    // Step 2
    currentMonth, setCurrentMonth, selectedDate, handleDateSelect,

    // Step 3
    slots, isSlotsLoading, selectedSlot, handleSlotSelect,

    // Step 4
    patientReason, setPatientReason,
    isTelehealth,  setIsTelehealth,
    isSubmitting,  handleConfirm,

    // Shared
    error, setError,
  };
}