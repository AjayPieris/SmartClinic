import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Link } from 'react-router-dom';
import { getMyDoctorProfileApi, submitVerificationDocumentApi } from '../../api/doctorsApi';
import ProfilePictureUploader from '../../components/documents/ProfilePictureUploader';
import styles from './DoctorProfile.module.css';

export default function DoctorProfile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Submit document state
  const [certUrl, setCertUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState('');

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const data = await getMyDoctorProfileApi();
      setProfile(data);
      if (data.verificationDocumentUrl) {
        setCertUrl(data.verificationDocumentUrl);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDocumentSubmit = async (e) => {
    e.preventDefault();
    if (!certUrl.trim() || !certUrl.startsWith('http')) {
      alert("Please enter a valid URL including http:// or https://");
      return;
    }

    try {
      setSubmitting(true);
      setSubmitSuccess('');
      await submitVerificationDocumentApi(certUrl);
      setSubmitSuccess('Document successfully submitted for review!');
      await fetchProfile(); // Refresh to show pending status
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to submit document. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading && !profile) {
    return (
      <div className={styles.page}>
         <div className="skeleton" style={{ width: 140, height: 28, marginBottom: 16 }} />
         <div className="skeleton card" style={{ height: 400 }} />
      </div>
    );
  }

  const isVerified = profile?.verificationStatus === 'Approved';

  return (
    <div className={styles.page}>
      <header style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <h1 className="page-title" style={{ margin: 0 }}>My profile</h1>
        {isVerified && (
          <span style={{ 
            background: 'var(--color-primary)', 
            color: 'white', 
            display: 'inline-flex', 
            alignItems: 'center', 
            gap: '6px', 
            padding: '6px 14px', 
            borderRadius: '9999px', 
            fontWeight: '600', 
            fontSize: '0.85rem',
            boxShadow: '0 2px 4px rgba(79, 70, 229, 0.2)' 
          }}>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" style={{ width: 18, height: 18 }}>
              <path fillRule="evenodd" d="M8.603 3.799A4.49 4.49 0 0112 2.25c1.357 0 2.573.6 3.397 1.549a4.49 4.49 0 013.498 1.307 4.491 4.491 0 011.307 3.497A4.49 4.49 0 0121.75 12a4.49 4.49 0 01-1.549 3.397 4.491 4.491 0 01-1.307 3.497 4.491 4.491 0 01-3.497 1.307A4.49 4.49 0 0112 21.75a4.49 4.49 0 01-3.397-1.549 4.49 4.49 0 01-3.498-1.306 4.491 4.491 0 01-1.307-3.498A4.49 4.49 0 012.25 12c0-1.357.6-2.573 1.549-3.397a4.49 4.49 0 011.307-3.497 4.49 4.49 0 013.497-1.307zm7.007 6.387a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z" clipRule="evenodd" />
            </svg>
            Verified Doctor
          </span>
        )}
      </header>

      {/* Verification Status & Submission */}
      <div className={`card ${styles.section}`} style={{ border: profile?.verificationStatus === 'Rejected' ? '1px solid var(--color-danger)' : (isVerified ? '1px solid var(--color-border)' : '1px solid var(--color-warning)'), background: isVerified ? 'var(--color-surface)' : (profile?.verificationStatus === 'Rejected' ? '#fef2f2' : '#fffbeb') }}>
        <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
          <div style={{ background: 'white', padding: '8px', borderRadius: '50%', boxShadow: 'var(--shadow-sm)' }}>
            {isVerified ? '🛡️' : (profile?.verificationStatus === 'Pending' ? '⏳' : '❌')}
          </div>
          <div style={{ flex: 1 }}>
            <h3 style={{ margin: 0, fontSize: '1.05rem', color: isVerified ? 'var(--color-text)' : (profile?.verificationStatus === 'Rejected' ? 'var(--color-danger)' : '#b45309') }}>
              {isVerified ? 'Account Verified' : (profile?.verificationStatus === 'Pending' ? 'Account Pending Verification' : 'Verification Required')}
            </h3>
            <p style={{ margin: '4px 0 0 0', fontSize: '0.95rem', color: 'var(--color-text-muted)', lineHeight: '1.5' }}>
              {isVerified 
                ? 'Your account has been fully verified. You can now manage your availability and accept appointments.' 
                : (profile?.verificationStatus === 'Pending' 
                  ? 'Your account is under review by our administrators. Check back later.' 
                  : (profile?.verificationStatus === 'Rejected' 
                    ? `Your previous submission was rejected. Reason: ${profile?.rejectionReason || 'No reason provided.'} Please submit a new document link below.`
                    : 'To get verified and start receiving appointments, please submit a link to your medical license or certification.'))}
            </p>

            {/* Document Submission Form - Show unless Approved */}
            {!isVerified && (
              <form onSubmit={handleDocumentSubmit} className={styles.submitDocForm}>
                <input 
                  type="url" 
                  placeholder="https://drive.google.com/your-certificate-link" 
                  className={styles.docInput}
                  value={certUrl}
                  onChange={e => setCertUrl(e.target.value)}
                  required
                />
                <button type="submit" className={styles.submitBtn} disabled={submitting}>
                  {submitting ? 'Submitting...' : 'Submit / Update Link'}
                </button>
              </form>
            )}

            {submitSuccess && (
              <p style={{ color: 'var(--color-success)', marginTop: 'var(--space-2)', fontSize: '0.9rem', fontWeight: '500' }}>
                ✓ {submitSuccess}
              </p>
            )}
            
            {/* Show Current Document even if approved (just for reference) */}
            {isVerified && profile?.verificationDocumentUrl && (
              <a href={profile.verificationDocumentUrl} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '8px 12px', marginTop: 'var(--space-3)', borderRadius: 'var(--radius-md)', background: 'var(--color-bg)', color: 'var(--color-primary)', textDecoration: 'none', fontWeight: '500', border: '1px solid var(--color-border)' }}>
                 <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{width: 16, height: 16}}>
                   <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m3.75 9v6m3-3H9m1.5-12H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
                 </svg>
                 View Submitted Document
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Profile picture section */}
      <section className={`card ${styles.section}`}>
        <p className={styles.sectionLabel}>Profile photo</p>
        <ProfilePictureUploader />
      </section>

      {/* Account details */}
      <section className={`card ${styles.section}`}>
        <p className={styles.sectionLabel}>Account details</p>
        <div className={styles.infoGrid}>
          {[
            ['Full name', `${user?.firstName} ${user?.lastName}`],
            ['Email', user?.email],
            ['Specialization', profile?.specialization || 'N/A'],
            ['License Number', profile?.licenseNumber || 'N/A'],
            ['Role', null],
          ].map(([label, value]) => (
            <div key={label} className={styles.infoRow}>
              <span className={styles.infoLabel}>{label}</span>
              {label === 'Role' ? (
                <span className={`role-badge ${user?.role?.toLowerCase()}`}>
                  {user?.role}
                </span>
              ) : (
                <span className={styles.infoValue}>{value}</span>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Availability CTA */}
      <Link to="/doctor/availability" className={styles.availCta} style={{ opacity: isVerified ? 1 : 0.6, pointerEvents: isVerified ? 'auto' : 'none' }}>
        <span>Manage your availability schedule { !isVerified && '(Verified Doctors Only)'}</span>
        <span>→</span>
      </Link>
    </div>
  );
}