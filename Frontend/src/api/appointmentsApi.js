// =============================================================================
// src/api/appointmentsApi.js — Appointment-related API calls.
// =============================================================================

import axiosInstance from './axiosInstance';

/** Patient: fetch their own upcoming and past appointments */
export const getMyAppointmentsApi = async () => {
  const response = await axiosInstance.get('/appointments/my-appointments');
  return response.data;
};

/** Doctor: fetch their own schedule (today onwards) */
export const getMyScheduleApi = async () => {
  const response = await axiosInstance.get('/appointments/my-schedule');
  return response.data;
};

/**
 * Patient: book a new appointment.
 * @param {{ doctorProfileId, startTimeUtc, patientReason?, isTelehealth }} data
 */
export const bookAppointmentApi = async (data) => {
  const response = await axiosInstance.post('/appointments', data);
  return response.data;
};

/**
 * Update appointment status (Confirm, Cancel, Complete).
 * @param {string} appointmentId
 * @param {string} status — 'Confirmed' | 'Cancelled' | 'Completed'
 */
export const updateAppointmentStatusApi = async (appointmentId, status) => {
  const response = await axiosInstance.patch(
    `/appointments/${appointmentId}/status`,
    { status }
  );
  return response.data;
};

export const getDoctorsApi = async () => {
  const response = await axiosInstance.get('/doctors');
  return response.data;
};

/**
 * Fetch booked (non-cancelled) appointments for a specific doctor on a date.
 * Used by generateSlots() to subtract already-booked windows from availability.
 * @param {string} doctorProfileId
 * @param {string} dateIso — "YYYY-MM-DD" in local time, converted to UTC range server-side
 * @returns {Promise<AppointmentResponseDto[]>}
 */
export const getDoctorBookedSlotsApi = async (doctorProfileId, dateIso) => {
  const response = await axiosInstance.get(
    `/doctors/${doctorProfileId}/booked-slots`,
    { params: { date: dateIso } }
  );
  return response.data;
};