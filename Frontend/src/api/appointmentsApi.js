import axiosInstance from './axiosInstance';

export const getMyAppointmentsApi = async () => {
  const response = await axiosInstance.get('/appointments/my-appointments');
  return response.data;
};

export const getMyScheduleApi = async () => {
  const response = await axiosInstance.get('/appointments/my-schedule');
  return response.data;
};

export const bookAppointmentApi = async (data) => {
  const response = await axiosInstance.post('/appointments', data);
  return response.data;
};

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

export const getDoctorBookedSlotsApi = async (doctorProfileId, dateIso) => {
  const response = await axiosInstance.get(
    `/doctors/${doctorProfileId}/booked-slots`,
    { params: { date: dateIso } }
  );
  return response.data;
};