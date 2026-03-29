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