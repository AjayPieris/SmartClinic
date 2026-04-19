

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

// ── Storage keys — namespaced to avoid collisions with other apps ─────────
const TOKEN_KEY = 'sc_token';
const USER_KEY  = 'sc_user';

// ── Context shape (used by useAuth consumers) ─────────────────────────────
const AuthContext = createContext(null);

// =============================================================================
// AuthProvider — wrap this around the entire <RouterProvider> / <App>
// =============================================================================
export function AuthProvider({ children }) {
  // null  = not logged in
  // {...} = logged-in user object
  const [user, setUser]         = useState(null);
  const [token, setToken]       = useState(null);

  // isLoading is true during the initial localStorage hydration.
  // ProtectedRoute shows a spinner while this is true so there's no
  // flash of the login page before the stored token is read.
  const [isLoading, setIsLoading] = useState(true);

  const navigate = useNavigate();

  // ─── Hydrate from localStorage on first mount ──────────────────────────
  useEffect(() => {
    try {
      const storedToken = localStorage.getItem(TOKEN_KEY);
      const storedUser  = localStorage.getItem(USER_KEY);

      if (storedToken && storedUser) {
        const parsedUser = JSON.parse(storedUser);

        // Optional: check token expiry before hydrating.
        // JWT payload is base64url — decode the middle segment to get claims.
        const payload = JSON.parse(atob(storedToken.split('.')[1]));
        const isExpired = payload.exp * 1000 < Date.now();

        if (isExpired) {
          // Token expired while the user was away — clear everything
          localStorage.removeItem(TOKEN_KEY);
          localStorage.removeItem(USER_KEY);
        } else {
          setToken(storedToken);
          setUser(parsedUser);
        }
      }
    } catch {
      // Malformed localStorage data — clear and start fresh
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
    } finally {
      // Always flip isLoading to false after the check, regardless of outcome
      setIsLoading(false);
    }
  }, []);

  // ─── login() — called after successful API response ────────────────────
  // Accepts the AuthResponseDto returned by the backend
  const login = useCallback((authResponse) => {
    const userObject = {
      userId:            authResponse.userId,
      email:             authResponse.email,
      firstName:         authResponse.firstName,
      lastName:          authResponse.lastName,
      role:              authResponse.role,           // "Patient" | "Doctor" | "Admin"
      profilePictureUrl: authResponse.profilePictureUrl ?? null,
    };

    // Persist to storage BEFORE updating state to avoid any timing gap
    localStorage.setItem(TOKEN_KEY, authResponse.token);
    localStorage.setItem(USER_KEY,  JSON.stringify(userObject));

    setToken(authResponse.token);
    setUser(userObject);

    // Role-based redirect after login
    // Each role lands on their own dashboard
    const roleRoutes = {
      Patient: '/patient/appointments',
      Doctor:  '/doctor/schedule',
      Admin:   '/admin/users',
    };

    navigate(roleRoutes[authResponse.role] ?? '/', { replace: true });
  }, [navigate]);

  // ─── logout() — clears everything and sends user to /login ─────────────
  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setToken(null);
    setUser(null);
    navigate('/login', { replace: true });
  }, [navigate]);

  // ─── updateUser() — partial update without re-logging in ───────────────
  // Used after profile picture upload: updates the avatar URL in context
  // so the NavBar reflects the new picture immediately without a full refresh.
  const updateUser = useCallback((partial) => {
    setUser((prev) => {
      if (!prev) return prev;
      const updated = { ...prev, ...partial };
      // Keep localStorage in sync
      localStorage.setItem(USER_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  // ─── Context value — memoised object shared to all consumers ───────────
  const value = {
    user,
    token,
    isLoading,
    isAuthenticated: !!user && !!token,
    login,
    logout,
    updateUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// =============================================================================
// useAuth — the hook every component uses to access auth state.
//
// Usage:
//   const { user, isAuthenticated, login, logout } = useAuth();
//
// Throws if used outside an AuthProvider — this surfaces mis-usage early
// rather than silently returning undefined values.
// =============================================================================
export function useAuth() {
  const context = useContext(AuthContext);

  if (context === null) {
    throw new Error('useAuth must be used inside an <AuthProvider>. ' +
      'Wrap your app root with <AuthProvider>.');
  }

  return context;
}