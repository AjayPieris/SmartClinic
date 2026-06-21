import axiosInstance from './axiosInstance';

export const getAllUsersApi = async (filters = {}) => {
  const params = new URLSearchParams();
  if (filters.role) params.append('role', filters.role);
  if (filters.status) params.append('status', filters.status);
  if (filters.search) params.append('search', filters.search);

  const response = await axiosInstance.get(`/admin/users?${params.toString()}`);
  return response.data;
};

export const blockUserApi = async (userId) => {
  const response = await axiosInstance.patch(`/admin/users/${userId}/block`);
  return response.data;
};

export const unblockUserApi = async (userId) => {
  const response = await axiosInstance.patch(`/admin/users/${userId}/unblock`);
  return response.data;
};

export const getAllDoctorsApi = async (verificationStatus = '') => {
  const url = verificationStatus
    ? `/admin/doctors?verificationStatus=${verificationStatus}`
    : '/admin/doctors';

  const response = await axiosInstance.get(url);
  return response.data;
};

export const getPendingDoctorsApi = async () => {
  const response = await axiosInstance.get('/admin/doctors/pending');
  return response.data;
};

export const approveDoctorApi = async (doctorProfileId) => {
  const response = await axiosInstance.patch(`/admin/doctors/${doctorProfileId}/approve`);
  return response.data;
};

export const rejectDoctorApi = async (doctorProfileId, reason) => {
  const response = await axiosInstance.patch(`/admin/doctors/${doctorProfileId}/reject`, {
    rejectionReason: reason
  });
  return response.data;
};

export const getAdminStatsApi = async () => {
  const response = await axiosInstance.get('/admin/stats');
  return response.data;
};
