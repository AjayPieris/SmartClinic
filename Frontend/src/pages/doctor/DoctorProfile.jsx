import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Link } from 'react-router-dom';
import { getMyDoctorProfileApi, submitVerificationDocumentApi } from '../../api/doctorsApi';
import { validateImageFile } from '../../utils/fileValidation';
import styles from './DoctorProfile.module.css';

// ── Inline mini ProfilePicture (left column) ───────────────────────────────
function AvatarColumn() {
  const { user, updateUser } = useAuth();
  const [isUploading, setIsUploading] = useState(false);
  const [progress,    setProgress]    = useState(0);
  const [localUrl,    setLocalUrl]    = useState(null);
  const [error,       setError]       = useState('');
  const inputRef = useRef(null);

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    const { valid, error: validErr } = validateImageFile(file);
    if (!valid) { setError(validErr); return; }

    setError('');
    const blobUrl = URL.createObjectURL(file);
    setLocalUrl(blobUrl);

    const formData = new FormData();
    formData.append('file', file);
    setIsUploading(true);
    setProgress(0);

    const xhr = new XMLHttpRequest();
    const apiBase = import.meta.env.VITE_API_BASE_URL;
    const token   = localStorage.getItem('sc_token');

    xhr.upload.onprogress = (ev) => {
      if (ev.lengthComputable) setProgress(Math.round((ev.loaded / ev.total) * 90));
    };

    xhr.onload = () => {
      setProgress(100);
      setIsUploading(false);
      if (xhr.status === 200) {
        try {
          const { profilePictureUrl } = JSON.parse(xhr.responseText);
          updateUser({ profilePictureUrl });
          setLocalUrl(null);
        } catch {
          setError('Upload succeeded but could not update preview.');
        }
      } else {
        setLocalUrl(null);
        try {
          const body = JSON.parse(xhr.responseText);
          setError(body.message ?? 'Upload failed.');
        } catch {
          setError('Upload failed. Please try again.');
        }
      }
    };

    xhr.onerror = () => {
      setIsUploading(false);
      setLocalUrl(null);
      setError('Network error. Please try again.');
    };

    xhr.open('POST', `${apiBase}/documents/profile-picture`);
    xhr.setRequestHeader('Authorization', `Bearer ${token}`);
    xhr.send(formData);
  };

  const displaySrc = localUrl ?? user?.profilePictureUrl;

  return (
    <div className={styles.avatarCol}>
      <button
        className={styles.avatarBtn}
        onClick={() => inputRef.current?.click()}
        disabled={isUploading}
        aria-label="Change profile picture"
        type="button"
      >
        {displaySrc ? (
          <img src={displaySrc} alt="Profile" className={styles.avatarImg} />
        ) : (
          <div className={styles.avatarFallback}>
            {user?.firstName?.[0]}{user?.lastName?.[0]}
          </div>
        )}

        {/* Camera overlay */}
        <div className={styles.avatarOverlay} aria-hidden="true">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
            stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
            <circle cx="12" cy="13" r="4"/>
          </svg>
        </div>

        {/* Progress ring */}
        {isUploading && (
          <div className={styles.progressRing}>
            <svg viewBox="0 0 44 44" className={styles.ringsvg}>
              <circle className={styles.ringTrack} cx="22" cy="22" r="20"/>
              <circle
                className={styles.ringBar}
                cx="22" cy="22" r="20"
                strokeDasharray={`${2 * Math.PI * 20}`}
                strokeDashoffset={`${2 * Math.PI * 20 * (1 - progress / 100)}`}
              />
            </svg>
          </div>
        )}
      </button>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        onChange={handleFileChange}
        disabled={isUploading}
        style={{ display: 'none' }}
        aria-hidden="true"
      />

      <button
        className={styles.updatePicBtn}
        onClick={() => inputRef.current?.click()}
        disabled={isUploading}
        type="button"
      >
        {isUploading ? `Uploading… ${progress}%` : 'Update Picture'}
      </button>
      <p className={styles.avatarHint}>JPG or PNG · Max size 5MB</p>
      {error && <p className={styles.avatarError} role="alert">{error}</p>}
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────
export default function DoctorProfile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const [certUrl,      setCertUrl]      = useState('');
  const [submitting,   setSubmitting]   = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState('');

  useEffect(() => { fetchProfile(); }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const data = await getMyDoctorProfileApi();
      setProfile(data);
      if (data.verificationDocumentUrl) setCertUrl(data.verificationDocumentUrl);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDocumentSubmit = async (e) => {
    e.preventDefault();
    if (!certUrl.trim() || !certUrl.startsWith('http')) {
      alert('Please enter a valid URL including http:// or https://');
      return;
    }
    try {
      setSubmitting(true);
      setSubmitSuccess('');
      await submitVerificationDocumentApi(certUrl);
      setSubmitSuccess('Document successfully submitted for review!');
      await fetchProfile();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to submit document. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading && !profile) {
    return (
      <div className={styles.page}>
        <div className="skeleton" style={{ width: 160, height: 30, marginBottom: 8  }} />
        <div className="skeleton" style={{ width: 280, height: 20, marginBottom: 32 }} />
        <div className="skeleton card" style={{ height: 500 }} />
      </div>
    );
  }

  const isVerified = profile?.verificationStatus === 'Approved';

  // Format last-updated date
  const lastUpdated = profile?.verificationDocumentUpdatedAt
    ? new Date(profile.verificationDocumentUpdatedAt).toLocaleDateString('en-US', {
        month: 'short', day: 'numeric', year: 'numeric'
      })
    : null;

  return (
    <div className={styles.page}>

      {/* ── Page header ── */}
      <header className={styles.header}>
        <div>
          <h1 className={styles.pageTitle}>My profile</h1>
          <p className={styles.pageSubtitle}>Manage your clinical credentials and public presence.</p>
        </div>
        {isVerified && (
          <span className={styles.verifiedBadgeHeader}>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
              <path fillRule="evenodd" d="M8.603 3.799A4.49 4.49 0 0112 2.25c1.357 0 2.573.6 3.397 1.549a4.49 4.49 0 013.498 1.307 4.491 4.491 0 011.307 3.497A4.49 4.49 0 0121.75 12a4.49 4.49 0 01-1.549 3.397 4.491 4.491 0 01-1.307 3.497 4.491 4.491 0 01-3.497 1.307A4.49 4.49 0 0112 21.75a4.49 4.49 0 01-3.397-1.549 4.49 4.49 0 01-3.498-1.306 4.491 4.491 0 01-1.307-3.498A4.49 4.49 0 012.25 12c0-1.357.6-2.573 1.549-3.397a4.49 4.49 0 011.307-3.497 4.49 4.49 0 013.497-1.307zm7.007 6.387a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z" clipRule="evenodd" />
            </svg>
            Verified Doctor
          </span>
        )}
      </header>

      {/* ── Body: avatar column + right panel ── */}
      <div className={styles.body}>

        {/* Left: Avatar */}
        <AvatarColumn />

        {/* Right: cards */}
        <div className={styles.rightCol}>

          {/* Identity Verification card */}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <div>
                <h2 className={styles.cardTitle}>Identity Verification</h2>
                <p className={styles.cardSubtitle}>Keep your documents updated to maintain your verified status.</p>
              </div>
              {isVerified ? (
                <span className={styles.verifiedPill}>VERIFIED</span>
              ) : profile?.verificationStatus === 'Pending' ? (
                <span className={styles.pendingPill}>PENDING</span>
              ) : (
                <span className={styles.rejectedPill}>ACTION NEEDED</span>
              )}
            </div>

            {/* Document input — always shown so doctor can update */}
            <form onSubmit={handleDocumentSubmit} className={styles.docForm}>
              <label className={styles.docLabel}>DOCUMENT URL</label>
              <div className={styles.docRow}>
                <div className={styles.docInputWrap}>
                  <svg className={styles.docIcon} xmlns="http://www.w3.org/2000/svg" fill="none"
                    viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round"
                      d="M13.19 8.688a4.5 4.5 0 0 1 1.242 7.244l-4.5 4.5a4.5 4.5 0 0 1-6.364-6.364l1.757-1.757m13.35-.622 1.757-1.757a4.5 4.5 0 0 0-6.364-6.364l-4.5 4.5a4.5 4.5 0 0 0 1.242 7.244" />
                  </svg>
                  <input
                    type="url"
                    placeholder="https://secure-storage.com/doc-v4.pdf"
                    className={styles.docInput}
                    value={certUrl}
                    onChange={e => setCertUrl(e.target.value)}
                    required
                  />
                </div>
                <button type="submit" className={styles.submitBtn} disabled={submitting}>
                  {submitting ? 'Saving…' : 'Submit'}
                </button>
              </div>
            </form>

            {submitSuccess && (
              <p className={styles.successMsg}>✓ {submitSuccess}</p>
            )}

            {/* View document link */}
            {profile?.verificationDocumentUrl && (
              <div className={styles.docMeta}>
                <a
                  href={profile.verificationDocumentUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.viewDocLink}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
                    strokeWidth={1.8} stroke="currentColor" width="15" height="15">
                    <path strokeLinecap="round" strokeLinejoin="round"
                      d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                  </svg>
                  View Submitted Document
                </a>
                {lastUpdated && (
                  <span className={styles.docMetaDivider}>•</span>
                )}
                {lastUpdated && (
                  <span className={styles.docMetaDate}>Last updated: {lastUpdated}</span>
                )}
              </div>
            )}

            {/* Rejected reason */}
            {profile?.verificationStatus === 'Rejected' && profile?.rejectionReason && (
              <p className={styles.rejectedNote}>
                ⚠ Rejection reason: {profile.rejectionReason}
              </p>
            )}
          </div>

          {/* Info grid */}
          <div className={styles.infoGrid}>
            <div className={styles.infoCell}>
              <span className={styles.infoLabel}>FULL NAME</span>
              <span className={styles.infoValue}>Dr. {user?.firstName} {user?.lastName}</span>
            </div>
            <div className={styles.infoCell}>
              <span className={styles.infoLabel}>EMAIL ADDRESS</span>
              <span className={styles.infoValue}>{user?.email}</span>
            </div>
            <div className={styles.infoCell}>
              <span className={styles.infoLabel}>SPECIALIZATION</span>
              <span className={styles.infoValue}>{profile?.specialization || '—'}</span>
            </div>
            <div className={styles.infoCell}>
              <span className={styles.infoLabel}>LICENSE NUMBER</span>
              <span className={styles.infoValue}>{profile?.licenseNumber || '—'}</span>
            </div>
            <div className={`${styles.infoCell} ${styles.roleCell}`}>
              <div>
                <span className={styles.infoLabel}>CLINICAL ROLE</span>
                <span className={styles.infoValue}>{profile?.clinicalRole || user?.role || '—'}</span>
              </div>
              {user?.role?.toLowerCase() === 'admin' && (
                <span className={styles.adminBadge}>ADMIN ACCESS</span>
              )}
            </div>
          </div>

        </div>{/* /rightCol */}
      </div>{/* /body */}

      {/* ── Availability CTA ── */}
      <Link
        to="/doctor/availability"
        className={styles.availCta}
        style={{ opacity: isVerified ? 1 : 0.55, pointerEvents: isVerified ? 'auto' : 'none' }}
      >
        <div className={styles.availCtaText}>
          <h3 className={styles.availCtaTitle}>
            Manage your availability schedule
            {!isVerified && ' (Verified Doctors Only)'}
          </h3>
          <p className={styles.availCtaDesc}>
            Update your consulting hours, block personal time, and sync your external medical calendar.
          </p>
        </div>
        <div className={styles.availCtaBtn}>
          Open Calendar&nbsp;→
        </div>
      </Link>

    </div>
  );
}