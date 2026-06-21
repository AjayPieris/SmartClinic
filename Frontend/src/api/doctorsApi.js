import axiosInstance from './axiosInstance';

export const getMyDoctorProfileApi = async () => {
  const response = await axiosInstance.get('/doctors/me');
  return response.data;
};

export const saveAvailabilityApi = async (
  availabilityJson,
  consultationDurationMinutes
) => {
  await axiosInstance.patch('/doctors/availability', {
    availabilityJson,
    consultationDurationMinutes,
  });
};

export const submitVerificationDocumentApi = async (documentUrl) => {
  const response = await axiosInstance.patch('/doctors/me/verification-document', {
    documentUrl
  });
  return response.data;
};