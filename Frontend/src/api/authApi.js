// =============================================================================
// src/api/authApi.js — All authentication-related API calls.
// These are the only functions that talk to /api/auth/*.
// =============================================================================

import axiosInstance from './axiosInstance';

/**
 * Register a new user.
 * @param {{ firstName, lastName, email, password, role, specialization?, licenseNumber? }} data
 * @returns {Promise<AuthResponseDto>} JWT token + user metadata
 */
export const registerApi = async (data) => {
  const response = await axiosInstance.post('/auth/register', data);
  return response.data;
};

/**
 * Log in with email and password.
 * @param {{ email, password }} credentials
 * @returns {Promise<AuthResponseDto>} JWT token + user metadata
 */
export const loginApi = async (credentials) => {
  const response = await axiosInstance.post('/auth/login', credentials);
  return response.data;
};