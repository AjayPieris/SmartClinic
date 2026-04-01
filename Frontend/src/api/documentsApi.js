// =============================================================================
// src/api/documentsApi.js — Document and profile picture API calls.
// These endpoints use multipart/form-data — NOT JSON.
// We pass FormData objects and let Axios set the correct Content-Type boundary.
// =============================================================================

import axiosInstance from './axiosInstance';

/**
 * Upload a medical document.
 * @param {FormData} formData — must contain: file (File), documentName (string),
 *                              optionally appointmentId (string UUID)
 * @returns {Promise<MedicalDocumentDto>}
 */
export const uploadDocumentApi = async (formData) => {
  // Passing FormData — Axios detects this and sets multipart/form-data
  // with the correct boundary automatically. Do NOT manually set Content-Type.
  const response = await axiosInstance.post('/documents/upload', formData);
  return response.data;
};

/** Fetch the authenticated patient's document list */
export const getMyDocumentsApi = async () => {
  const response = await axiosInstance.get('/documents/my-documents');
  return response.data;
};

/** Delete a document by ID */
export const deleteDocumentApi = async (documentId) => {
  await axiosInstance.delete(`/documents/${documentId}`);
};

/**
 * Upload a new profile picture.
 * @param {FormData} formData — must contain: file (File/image)
 * @returns {Promise<{ profilePictureUrl: string }>}
 */
export const uploadProfilePictureApi = async (formData) => {
  // Let Axios set the Content-Type with correct boundary automatically
  const response = await axiosInstance.post('/documents/profile-picture', formData);
  return response.data;
};