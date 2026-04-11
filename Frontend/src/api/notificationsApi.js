import axiosInstance from './axiosInstance';

export const getMyNotificationsApi = async (unreadOnly = false) => {
  const response = await axiosInstance.get('/notifications', { params: { unreadOnly } });
  return response.data;
};

export const markNotificationAsReadApi = async (id) => {
  await axiosInstance.patch(`/notifications/${id}/read`);
};

export const markAllNotificationsAsReadApi = async () => {
  await axiosInstance.patch('/notifications/mark-all-read');
};
