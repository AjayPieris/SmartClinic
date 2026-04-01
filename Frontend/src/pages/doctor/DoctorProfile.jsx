// src/pages/doctor/DoctorProfile.jsx
import { useAuth } from '../../context/AuthContext';
import { Link } from 'react-router-dom';
import ProfilePictureUploader from '../../components/documents/ProfilePictureUploader';

export default function DoctorProfile() {
  const { user } = useAuth();

  return (
    <div style={{ maxWidth: 640, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <h1 style={{ fontSize: '1.6rem', fontWeight: 800 }}>My profile</h1>

      <section style={{
        background: 'var(--color-surface)', border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-xl)', padding: '1.5rem',
        display: 'flex', flexDirection: 'column', gap: '1.5rem',
      }}>
        <p style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text-muted)',
          textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid var(--color-border)', paddingBottom: '0.75rem' }}>
          Profile photo
        </p>
        <ProfilePictureUploader />
      </section>

      <section style={{
        background: 'var(--color-surface)', border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-xl)', padding: '1.5rem',
        display: 'flex', flexDirection: 'column', gap: '1rem',
      }}>
        <p style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text-muted)',
          textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid var(--color-border)', paddingBottom: '0.75rem' }}>
          Account details
        </p>
        {[
          ['Full name',   `${user?.firstName} ${user?.lastName}`],
          ['Email',       user?.email],
          ['Role',        user?.role],
        ].map(([label, value]) => (
          <div key={label} style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>{label}</span>
            <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>{value}</span>
          </div>
        ))}
      </section>

      <Link to="/doctor/availability" style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '1rem 1.5rem',
        background: 'var(--color-primary-light)',
        border: '1px solid #c7d2fe',
        borderRadius: 'var(--radius-lg)',
        color: 'var(--color-primary)', fontWeight: 600, fontSize: '0.9rem',
        textDecoration: 'none',
      }}>
        <span>Manage your availability schedule</span>
        <span>→</span>
      </Link>
    </div>
  );
}