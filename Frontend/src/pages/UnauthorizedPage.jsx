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
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 'var(--space-8)',
      background: 'var(--color-bg)',
    }}>
      <div className="card" style={{
        padding: 'var(--space-12) var(--space-8)',
        textAlign: 'center',
        maxWidth: 420,
        width: '100%',
      }}>
        {/* SVG shield icon */}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
          style={{ width: 56, height: 56, margin: '0 auto var(--space-4)', color: 'var(--color-danger)', opacity: 0.5 }}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
        </svg>

        <h1 className="brand-heading" style={{
          fontSize: '3rem',
          color: 'var(--color-danger)',
          marginBottom: 'var(--space-2)',
        }}>
          403
        </h1>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: 'var(--space-2)' }}>
          Access denied
        </h2>
        <p style={{
          color: 'var(--color-text-muted)',
          fontSize: '0.925rem',
          marginBottom: 'var(--space-8)',
        }}>
          You don't have permission to view this page.
        </p>
        <button
          onClick={() => navigate(dashboardPath, { replace: true })}
          className="btn-primary"
        >
          Go to my dashboard
        </button>
      </div>
    </div>
  );
}