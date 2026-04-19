

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

import MockAdapter from 'axios-mock-adapter';
import { mockUsers, mockAppointments, mockDoctors, mockAvailability } from './mockData';

// ─── MOCK ADAPTER ────────────────────────────────────────────────────────────
// If VITE_MOCK_MODE is true, we intercept API calls and return local dummy data.
if (import.meta.env.VITE_MOCK_MODE === 'true') {
  console.log('Mock mode enabled: intercepting API calls');
  const mock = new MockAdapter(axiosInstance, { delayResponse: 500 });
  
  // Auth
  mock.onPost('/auth/login').reply((config) => {
    const data = JSON.parse(config.data);
    if (data.email.startsWith('patient')) return [200, mockUsers.patient];
    if (data.email.startsWith('doctor')) return [200, mockUsers.doctor];
    if (data.email.startsWith('admin')) return [200, mockUsers.admin];
    return [200, mockUsers.patient]; // default fallback
  });
  mock.onPost('/auth/register').reply(200, mockUsers.patient);
  
  // Appointments
  mock.onGet(/^\/appointments/).reply(200, mockAppointments);
  mock.onPost('/appointments').reply(200, { ...mockAppointments[0], appointmentId: 'apt-new' });
  mock.onPut(new RegExp('/appointments/.+')).reply(200, {});
  
  // Doctors
  mock.onGet('/doctors').reply(200, Object.values(mockDoctors));
  mock.onGet(new RegExp('/doctors/.+/availability')).reply(200, mockAvailability);
  
  // Admin
  mock.onGet('/admin/users').reply(200, [mockUsers.patient, mockUsers.doctor, mockUsers.admin]);
  mock.onGet('/admin/doctors').reply(200, mockDoctors);
  
  // Notifications
  mock.onGet('/notifications').reply(200, []);
  
  // Default passthrough for any unmatched mock routes
  mock.onAny().reply(404, { message: 'Mock route not configured' });
}

export default axiosInstance;