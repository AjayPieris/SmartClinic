import axiosInstance from './axiosInstance';

export const sendMessageApi = async (data) => {
  const response = await axiosInstance.post('/chat/send', data);
  return response.data;
};

export const getChatHistoryApi = async (appointmentId, params = {}) => {
  const response = await axiosInstance.get(
    `/chat/${appointmentId}/history`,
    { params }
  );
  return response.data;
};