import axiosInstance from './axiosInstance';

export const registerApi = async (data) => {
  const response = await axiosInstance.post('/auth/register', data);
  return response.data;
};

export const loginApi = async (credentials) => {
  const response = await axiosInstance.post('/auth/login', credentials);
  return response.data;
};