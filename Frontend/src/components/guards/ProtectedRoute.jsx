// =============================================================================
// src/components/guards/ProtectedRoute.jsx
//
// Gate 1: Is the user authenticated at all?
//
// Three states:
//   isLoading = true  → show spinner (localStorage hydration in progress)
//   user = null       → redirect to /login, preserving intended destination
//   user exists       → render children
//
// The `state={{ from: location }}` on the Navigate is picked up by the
// LoginPage to redirect back after successful login (deep-link preservation).
// =============================================================================

import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function ProtectedRoute({ children }) {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  // While localStorage is being read on mount, show a centered spinner.
  // Without this check, users would see a flash of the login page before
  // their stored token is loaded — poor UX and confusing.
  if (isLoading) {
    return (
      <div className="screen-center">
        <div className="spinner" role="status" aria-label="Loading..." />
      </div>
    );
  }

  // Not authenticated — redirect to login.
  // Pass the current path as `from` so LoginPage can redirect back after login.
  if (!isAuthenticated) {
    return (
      <Navigate
        to="/login"
        state={{ from: location }}
        replace // replace so hitting Back doesn't loop back to the protected page
      />
    );
  }

  // Authenticated — render the requested page
  return children;
}