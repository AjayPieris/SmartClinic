// =============================================================================
// src/api/axiosInstance.js — The single configured Axios client.
//
// Every API call in the app goes through this instance. Because of the
// request interceptor, NO component ever manually writes:
//   headers: { Authorization: `Bearer ${token}` }
// The interceptor handles it automatically for every outgoing request.
//
// The response interceptor handles 401s globally:
//   If any request comes back 401 (token expired or invalid), we clear
//   localStorage and redirect to /login. This prevents the user from
//   being stuck in a half-authenticated state.
// =============================================================================

import axios from 'axios';

const axiosInstance = axios.create({
  // VITE_API_BASE_URL comes from .env — no hardcoded localhost in components
  baseURL: import.meta.env.VITE_API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  // 10 second timeout — prevents requests hanging indefinitely
  timeout: 10_000,
});

// ─── REQUEST INTERCEPTOR ─────────────────────────────────────────────────────
// Runs before every outgoing request.
// Reads the JWT from localStorage and attaches it as a Bearer token.
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('sc_token'); // 'sc' = SmartClinic namespace

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// ─── RESPONSE INTERCEPTOR ────────────────────────────────────────────────────
// Runs after every response (success and error).
// Handles 401 Unauthorized globally — token expired or revoked.
axiosInstance.interceptors.response.use(
  // Pass through successful responses unchanged
  (response) => response,

  (error) => {
    if (error.response?.status === 401) {
      // Clear all auth state from storage
      localStorage.removeItem('sc_token');
      localStorage.removeItem('sc_user');

      // Hard redirect to login — the React Router history isn't accessible
      // here (we're outside component tree), so we use window.location.
      // AuthContext will detect the missing token on mount and stay logged out.
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }

    // Re-throw so individual catch blocks in components still work
    return Promise.reject(error);
  }
);

export default axiosInstance;