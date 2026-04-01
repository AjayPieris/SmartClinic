// =============================================================================
// src/api/adminApi.js — Admin-specific API calls.
// =============================================================================

import axiosInstance from './axiosInstance';

/**
 * Fetch all users with optional role and status filters
 * @param {Object} filters - { role: 'Patient'|'Doctor'|'Admin', status: 'active'|'blocked', search: string }
 */
export const getAllUsersApi = async (filters = {}) => {
  const params = new URLSearchParams();
  if (filters.role) params.append('role', filters.role);
  if (filters.status) params.append('status', filters.status);
  if (filters.search) params.append('search', filters.search);

  const response = await axiosInstance.get(`/admin/users?${params.toString()}`);
  return response.data;
};

/**
 * Block a user (patient or doctor)
 */
export const blockUserApi = async (userId) => {
  const response = await axiosInstance.patch(`/admin/users/${userId}/block`);
  return response.data;
};

/**
 * Unblock a user
 */
export const unblockUserApi = async (userId) => {
  const response = await axiosInstance.patch(`/admin/users/${userId}/unblock`);
  return response.data;
};

/**
 * Fetch all doctors with verification info
 * @param {string} verificationStatus - Optional filter ('Pending', 'Approved', 'Rejected')
 */
export const getAllDoctorsApi = async (verificationStatus = '') => {
  const url = verificationStatus 
    ? `/admin/doctors?verificationStatus=${verificationStatus}`
    : '/admin/doctors';
  
  const response = await axiosInstance.get(url);
  return response.data;
};

/**
 * Fetch only doctors awaiting approval
 */
export const getPendingDoctorsApi = async () => {
  const response = await axiosInstance.get('/admin/doctors/pending');
  return response.data;
};

/**
 * Approve a doctor
 */
export const approveDoctorApi = async (doctorProfileId) => {
  const response = await axiosInstance.patch(`/admin/doctors/${doctorProfileId}/approve`);
  return response.data;
};

/**
 * Reject a doctor with optional reason
 */
export const rejectDoctorApi = async (doctorProfileId, reason) => {
  const response = await axiosInstance.patch(`/admin/doctors/${doctorProfileId}/reject`, {
    rejectionReason: reason
  });
  return response.data;
};

/**
 * Get dashboard stats
 */
export const getAdminStatsApi = async () => {
  const response = await axiosInstance.get('/admin/stats');
  return response.data;
};
