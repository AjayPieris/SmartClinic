import axiosInstance from './axiosInstance';

export const uploadDocumentApi = async (formData) => {
  const response = await axiosInstance.post('/documents/upload', formData);
  return response.data;
};

export const getMyDocumentsApi = async () => {
  const response = await axiosInstance.get('/documents/my-documents');
  return response.data;
};

export const deleteDocumentApi = async (documentId) => {
  await axiosInstance.delete(`/documents/${documentId}`);
};

export const uploadProfilePictureApi = async (formData) => {
  const response = await axiosInstance.post('/documents/profile-picture', formData);
  return response.data;
};