// =============================================================================
// src/api/chatApi.js — Chat-related API calls.
// Note: real-time delivery is via Pusher (pusher-js), NOT via polling this API.
// This API is only used to: (a) send a message, (b) load chat history.
// =============================================================================

import axiosInstance from './axiosInstance';

/**
 * Send a chat message.
 * Triggers a Pusher event server-side — both participants receive it instantly.
 * @param {{ appointmentId, messageText }} data
 * @returns {Promise<ChatMessageDto>}
 */
export const sendMessageApi = async (data) => {
  const response = await axiosInstance.post('/chat/send', data);
  return response.data;
};

/**
 * Load paginated chat history for an appointment.
 * @param {string} appointmentId
 * @param {{ pageSize?, olderThan? }} params — cursor-based pagination
 * @returns {Promise<ChatMessageDto[]>}
 */
export const getChatHistoryApi = async (appointmentId, params = {}) => {
  const response = await axiosInstance.get(
    `/chat/${appointmentId}/history`,
    { params }
  );
  return response.data;
};