import { useNavigate } from 'react-router-dom';

export default function NotFoundPage() {
  const navigate = useNavigate();
  return (
    <div style={{ textAlign: 'center', padding: '4rem 2rem' }}>
      <h1 className="brand-heading" style={{ fontSize: '3rem', color: 'var(--color-text-subtle)' }}>
        404
      </h1>
      <h2 style={{ marginBottom: '1rem' }}>Page not found</h2>
      <p style={{ color: 'var(--color-text-muted)', marginBottom: '2rem' }}>
        The page you're looking for doesn't exist or has been moved.
      </p>
      <button
        onClick={() => navigate(-1)}
        style={{
          padding: '0.75rem 1.5rem',
          background: 'var(--color-primary)',
          color: '#fff',
          borderRadius: 'var(--radius-md)',
          fontWeight: 600,
        }}
      >
        Go back
      </button>
    </div>
  );
}