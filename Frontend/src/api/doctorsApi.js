

import axiosInstance from './axiosInstance';

/**
 * Fetch the authenticated doctor's own profile.
 * Used by the availability editor to load the current schedule on mount.
 * @returns {Promise<DoctorProfileDto>}
 */
export const getMyDoctorProfileApi = async () => {
  const response = await axiosInstance.get('/doctors/me');
  return response.data;
};

/**
 * Save the doctor's weekly availability schedule.
 * @param {string} availabilityJson  — JSON.stringify(AvailabilityWindow[])
 * @param {number} consultationDurationMinutes
 * @returns {Promise<void>}          — 204 No Content on success
 */
export const saveAvailabilityApi = async (
  availabilityJson,
  consultationDurationMinutes
) => {
  await axiosInstance.patch('/doctors/availability', {
    availabilityJson,
    consultationDurationMinutes,
  });
};

/**
 * Submit verification document URL.
 * @param {string} documentUrl 
 */
export const submitVerificationDocumentApi = async (documentUrl) => {
  const response = await axiosInstance.patch('/doctors/me/verification-document', {
    documentUrl
  });
  return response.data;
};