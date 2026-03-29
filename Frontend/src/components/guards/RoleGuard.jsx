// =============================================================================
// src/components/guards/RoleGuard.jsx
//
// Gate 2: Does the authenticated user have the correct role?
//
// Used INSIDE ProtectedRoute — so by the time RoleGuard runs, we know
// the user is already authenticated. We only need to check the role.
//
// Usage:
//   <ProtectedRoute>
//     <RoleGuard allowedRoles={['Doctor']}>
//       <DoctorDashboard />
//     </RoleGuard>
//   </ProtectedRoute>
//
// allowedRoles is an array to support multi-role access in the future
// (e.g. both Doctor AND Admin can access a specific route).
// =============================================================================

import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function RoleGuard({ allowedRoles, children }) {
  const { user } = useAuth();

  // user.role is the string claim embedded in the JWT: "Patient" | "Doctor" | "Admin"
  const hasPermission = allowedRoles.includes(user?.role);

  if (!hasPermission) {
    // Redirect to a neutral /unauthorized page rather than crashing.
    // This page explains the access restriction without exposing route details.
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
}