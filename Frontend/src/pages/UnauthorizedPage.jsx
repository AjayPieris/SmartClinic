// Simple 403 page — shown when a user tries to access the wrong role's routes
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function UnauthorizedPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const dashboardPath = {
    Patient: '/patient/appointments',
    Doctor:  '/doctor/schedule',
    Admin:   '/admin/users',
  }[user?.role] ?? '/login';

  return (
    <div style={{ textAlign: 'center', padding: '4rem 2rem' }}>
      <h1 className="brand-heading" style={{ fontSize: '3rem', color: 'var(--color-danger)' }}>
        403
      </h1>
      <h2 style={{ marginBottom: '1rem' }}>Access denied</h2>
      <p style={{ color: 'var(--color-text-muted)', marginBottom: '2rem' }}>
        You don't have permission to view this page.
      </p>
      <button
        onClick={() => navigate(dashboardPath, { replace: true })}
        style={{
          padding: '0.75rem 1.5rem',
          background: 'var(--color-primary)',
          color: '#fff',
          borderRadius: 'var(--radius-md)',
          fontWeight: 600,
        }}
      >
        Go to my dashboard
      </button>
    </div>
  );
}