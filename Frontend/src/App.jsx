import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

import ProtectedRoute from './components/guards/ProtectedRoute';
import RoleGuard from './components/guards/RoleGuard';

// Public pages
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import UnauthorizedPage from './pages/UnauthorizedPage';
import NotFoundPage from './pages/NotFoundPage';

// ── Lazy-loaded layouts ───────────────────────────────────────────
const PatientLayout = lazy(() => import('./layouts/PatientLayout'));
const DoctorLayout  = lazy(() => import('./layouts/DoctorLayout'));
const AdminLayout   = lazy(() => import('./layouts/AdminLayout'));

// ── Patient pages ─────────────────────────────────────────────────
const PatientAppointments = lazy(() => import('./pages/patient/PatientAppointments'));
const BookAppointment     = lazy(() => import('./pages/patient/BookAppointment'));
const PatientChat         = lazy(() => import('./pages/patient/PatientChat'));
const PatientDocuments    = lazy(() => import('./pages/patient/PatientDocuments'));
const PatientProfile      = lazy(() => import('./pages/patient/PatientProfile'));

// ── Doctor pages ──────────────────────────────────────────────────
const DoctorSchedule     = lazy(() => import('./pages/doctor/DoctorSchedule'));
const DoctorAvailability = lazy(() => import('./pages/doctor/DoctorAvailability')); // ✅ ADDED
const DoctorChat         = lazy(() => import('./pages/doctor/DoctorChat'));
const DoctorNotes        = lazy(() => import('./pages/doctor/DoctorNotes'));
const DoctorProfile      = lazy(() => import('./pages/doctor/DoctorProfile'));

// ── Admin pages ───────────────────────────────────────────────────
const AdminUsers    = lazy(() => import('./pages/admin/AdminUsers'));
const AdminSettings = lazy(() => import('./pages/admin/AdminSettings'));

// ── Loading Spinner ───────────────────────────────────────────────
function SuspenseFallback() {
  return (
    <div className="screen-center">
      <div className="spinner" role="status" aria-label="Loading page..." />
    </div>
  );
}

// =============================================================================
export default function App() {
  return (
    <Suspense fallback={<SuspenseFallback />}>
      <Routes>

        {/* ── Public routes ───────────────────────────────────────── */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/unauthorized" element={<UnauthorizedPage />} />

        {/* Root redirect */}
        <Route path="/" element={<Navigate to="/login" replace />} />

        {/* ── Patient routes ─────────────────────────────────────── */}
        <Route
          path="/patient"
          element={
            <ProtectedRoute>
              <RoleGuard allowedRoles={['Patient']}>
                <PatientLayout />
              </RoleGuard>
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="appointments" replace />} />
          <Route path="appointments" element={<PatientAppointments />} />
          <Route path="book" element={<BookAppointment />} />
          <Route path="chat/:appointmentId" element={<PatientChat />} />
          <Route path="documents" element={<PatientDocuments />} />
          <Route path="profile" element={<PatientProfile />} />
        </Route>

        {/* ── Doctor routes ─────────────────────────────────────── */}
        <Route
          path="/doctor"
          element={
            <ProtectedRoute>
              <RoleGuard allowedRoles={['Doctor']}>
                <DoctorLayout />
              </RoleGuard>
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="schedule" replace />} />
          <Route path="schedule" element={<DoctorSchedule />} />
          <Route path="availability" element={<DoctorAvailability />} /> {/* ✅ ADDED */}
          <Route path="chat/:appointmentId" element={<DoctorChat />} />
          <Route path="notes/:appointmentId" element={<DoctorNotes />} />
          <Route path="profile" element={<DoctorProfile />} />
        </Route>

        {/* ── Admin routes ──────────────────────────────────────── */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute>
              <RoleGuard allowedRoles={['Admin']}>
                <AdminLayout />
              </RoleGuard>
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="users" replace />} />
          <Route path="users" element={<AdminUsers />} />
          <Route path="settings" element={<AdminSettings />} />
        </Route>

        {/* ── 404 ───────────────────────────────────────────────── */}
        <Route path="*" element={<NotFoundPage />} />

      </Routes>
    </Suspense>
  );
}