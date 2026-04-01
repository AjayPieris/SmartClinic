import { useNavigate } from 'react-router-dom';

export default function NotFoundPage() {
  const navigate = useNavigate();

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
        {/* SVG icon */}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
          style={{ width: 56, height: 56, margin: '0 auto var(--space-4)', color: 'var(--color-text-subtle)', opacity: 0.5 }}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
        </svg>

        <h1 className="brand-heading" style={{
          fontSize: '3rem',
          color: 'var(--color-text-subtle)',
          marginBottom: 'var(--space-2)',
        }}>
          404
        </h1>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: 'var(--space-2)' }}>
          Page not found
        </h2>
        <p style={{
          color: 'var(--color-text-muted)',
          fontSize: '0.925rem',
          marginBottom: 'var(--space-8)',
        }}>
          The page you're looking for doesn't exist or has been moved.
        </p>
        <button onClick={() => navigate(-1)} className="btn-primary">
          ← Go back
        </button>
      </div>
    </div>
  );
}