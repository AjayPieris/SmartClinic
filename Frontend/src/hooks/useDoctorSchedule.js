

import { useState, useEffect, useCallback } from 'react';
import {
  startOfWeek, addDays, isSameDay, format,
} from 'date-fns';
import { getMyScheduleApi, updateAppointmentStatusApi } from '../api/appointmentsApi';

export default function useDoctorSchedule() {
  // Today is the default selected date on mount
  const [selectedDate,  setSelectedDate]  = useState(new Date());
  const [allAppointments, setAllAppointments] = useState([]); // full fetched list
  const [isLoading,     setIsLoading]     = useState(true);
  const [selectedAppt,  setSelectedAppt]  = useState(null);
  const [error,         setError]         = useState('');

  // ── Week strip dates ────────────────────────────────────────────────────
  // Always start the strip on the Monday of the selected date's week
  const [weekStart, setWeekStart] = useState(
    () => startOfWeek(new Date(), { weekStartsOn: 1 }) // 1 = Monday
  );

  const weekDates = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const goToPrevWeek = useCallback(() => {
    setWeekStart((prev) => addDays(prev, -7));
  }, []);

  const goToNextWeek = useCallback(() => {
    setWeekStart((prev) => addDays(prev, 7));
  }, []);

  // ── Fetch appointments ──────────────────────────────────────────────────
  // getMyScheduleApi returns all upcoming appointments for the doctor.
  // We filter client-side by selectedDate — avoids re-fetching on every
  // date click while the doctor scans the week.
  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    setSelectedAppt(null);
    setError('');

    const load = async () => {
      try {
        const data = await getMyScheduleApi();
        if (!cancelled) setAllAppointments(data);
      } catch {
        if (!cancelled) setError('Could not load schedule. Please refresh.');
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    load();
    return () => { cancelled = true; };
  }, []); // Fetch once — re-fetch manually after status changes if needed

  // ── Derive appointments for the selected date ───────────────────────────
  const appointments = allAppointments.filter((a) =>
    isSameDay(new Date(a.startTimeUtc), selectedDate)
  );

  // ── Handle date selection ───────────────────────────────────────────────
  const handleDateSelect = useCallback((date) => {
    setSelectedDate(date);
    setSelectedAppt(null); // Clear detail card when switching days
  }, []);

  // ── Optimistic status update ────────────────────────────────────────────
  const handleStatusUpdate = useCallback(async (appointmentId, newStatus) => {
    // 1. Capture the previous status for rollback
    const prevAppointments = allAppointments;

    // 2. Optimistic update — change status in local state immediately
    setAllAppointments((prev) =>
      prev.map((a) =>
        a.id === appointmentId ? { ...a, status: newStatus } : a
      )
    );

    // Also update the detail card if it's showing this appointment
    setSelectedAppt((prev) =>
      prev?.id === appointmentId ? { ...prev, status: newStatus } : prev
    );

    try {
      await updateAppointmentStatusApi(appointmentId, newStatus);
    } catch (err) {
      // Rollback on failure
      setAllAppointments(prevAppointments);
      setSelectedAppt((prev) =>
        prev?.id === appointmentId
          ? prevAppointments.find((a) => a.id === appointmentId) ?? prev
          : prev
      );
      setError(
        err.response?.data?.message ?? 'Status update failed. Please try again.'
      );
    }
  }, [allAppointments]);

  // ── Expose everything ───────────────────────────────────────────────────
  return {
    selectedDate,
    handleDateSelect,
    weekDates,
    weekStart,
    goToPrevWeek,
    goToNextWeek,
    appointments,       // Filtered to selectedDate
    allAppointments,    // Full list (for week-level dot indicators)
    isLoading,
    selectedAppt,
    setSelectedAppt,
    handleStatusUpdate,
    error,
    setError,
  };
}