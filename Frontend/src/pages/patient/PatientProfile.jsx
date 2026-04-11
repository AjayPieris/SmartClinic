// =============================================================================
// src/pages/patient/PatientProfile.jsx
// Redesigned to match the split-panel mockup:
//   Left  — avatar column (inline uploader)
//   Right — info card with Patient badge, name/email grid, secure-profile notice
//           + action row (deactivate | cancel | save)
//   Bottom — stats strip (Medical History, Emergency Contact, Insurance Policy)
// =============================================================================

import { useState, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { validateImageFile } from '../../utils/fileValidation';
import styles from './PatientProfile.module.css';

// ── Inline avatar uploader (same logic as ProfilePictureUploader) ──────────
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

  // "Patient since …" — use account creation year if available
  const since = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    : null;

  return (
    <div className={styles.avatarCol}>
      {/* Avatar button */}
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

        {/* Camera badge — always visible, bottom-right */}
        <span className={styles.cameraBadge} aria-hidden="true">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
            stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
            <circle cx="12" cy="13" r="4"/>
          </svg>
        </span>

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

      {/* Name + since */}
      <p className={styles.avatarName}>
        {user?.firstName} {user?.lastName}
      </p>
      {since && (
        <p className={styles.avatarSince}>Patient since {since}</p>
      )}
      {error && <p className={styles.avatarError} role="alert">{error}</p>}
    </div>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────
export default function PatientProfile() {
  const { user } = useAuth();
  const [saving, setSaving] = useState(false);
  const [saved,  setSaved]  = useState(false);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    // Placeholder — wire to your PATCH /patients/me endpoint
    await new Promise(r => setTimeout(r, 800));
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className={styles.page}>

      {/* ── Page header ── */}
      <header className={styles.header}>
        <div>
          <h1 className={styles.pageTitle}>My profile</h1>
          <p className={styles.pageSubtitle}>
            Manage your personal information and clinical identity within the SmartClinic system.
          </p>
        </div>
        <span className={styles.patientBadgeHeader}>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="15" height="15">
            <path fillRule="evenodd" d="M7.5 6a4.5 4.5 0 1 1 9 0 4.5 4.5 0 0 1-9 0ZM3.751 20.105a8.25 8.25 0 0 1 16.498 0 .75.75 0 0 1-.437.695A18.683 18.683 0 0 1 12 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 0 1-.437-.695Z" clipRule="evenodd" />
          </svg>
          Patient
        </span>
      </header>

      {/* ── Body: avatar left + card right ── */}
      <div className={styles.body}>

        {/* Left — avatar */}
        <AvatarColumn />

        {/* Right — info card */}
        <form className={styles.card} onSubmit={handleSave}>

          {/* Name + Email — 2‑col input grid */}
          <div className={styles.fieldGrid}>
            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel}>FULL NAME</label>
              <div className={styles.fieldInputWrap}>
                <svg className={styles.fieldIcon} xmlns="http://www.w3.org/2000/svg" fill="none"
                  viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round"
                    d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
                </svg>
                <input
                  type="text"
                  className={styles.fieldInput}
                  defaultValue={`${user?.firstName ?? ''} ${user?.lastName ?? ''}`.trim()}
                  readOnly
                  aria-label="Full name"
                />
              </div>
            </div>

            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel}>EMAIL ADDRESS</label>
              <div className={styles.fieldInputWrap}>
                <svg className={styles.fieldIcon} xmlns="http://www.w3.org/2000/svg" fill="none"
                  viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round"
                    d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
                </svg>
                <input
                  type="email"
                  className={styles.fieldInput}
                  defaultValue={user?.email ?? ''}
                  readOnly
                  aria-label="Email address"
                />
              </div>
            </div>
          </div>

          {/* Secure profile notice */}
          <div className={styles.secureNotice}>
            <span className={styles.secureIcon}>
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
                strokeWidth={1.8} stroke="currentColor" width="20" height="20">
                <path strokeLinecap="round" strokeLinejoin="round"
                  d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
              </svg>
            </span>
            <div>
              <p className={styles.secureTitle}>Secure Profile</p>
              <p className={styles.secureText}>
                Your profile information is encrypted and only visible to your assigned primary care physician and medical board.
              </p>
            </div>
          </div>

          {/* Divider */}
          <div className={styles.divider} />

          {/* Action row */}
          <div className={styles.actionRow}>
            <button type="button" className={styles.deactivateBtn}>
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
                strokeWidth={1.8} stroke="currentColor" width="15" height="15">
                <path strokeLinecap="round" strokeLinejoin="round"
                  d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
              </svg>
              Deactivate account
            </button>

            <div className={styles.actionRight}>
              <button type="button" className={styles.cancelBtn}>Cancel</button>
              <button type="submit" className={styles.saveBtn} disabled={saving}>
                {saving ? 'Saving…' : saved ? '✓ Saved' : 'Save Changes'}
              </button>
            </div>
          </div>

        </form>
      </div>

      {/* ── Stats strip ── */}
      <div className={styles.statsStrip}>

        <div className={styles.statCard}>
          <span className={styles.statIcon}>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
              strokeWidth={1.6} stroke="currentColor" width="28" height="28">
              <path strokeLinecap="round" strokeLinejoin="round"
                d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" />
            </svg>
          </span>
          <p className={styles.statTitle}>Medical History</p>
          <p className={styles.statSub}>4 active records found</p>
          <button className={styles.statLink} type="button">View Records</button>
        </div>

        <div className={styles.statCard}>
          <span className={styles.statIcon}>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
              strokeWidth={1.6} stroke="currentColor" width="28" height="28">
              <path strokeLinecap="round" strokeLinejoin="round"
                d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 0 1 6 18.719m12 0a5.971 5.971 0 0 0-.941-3.197m0 0A5.995 5.995 0 0 0 12 12.75a5.995 5.995 0 0 0-5.058 2.772m0 0a3 3 0 0 0-4.681 2.72 8.986 8.986 0 0 0 3.74.477m.94-3.197a5.971 5.971 0 0 0-.94 3.197M15 6.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm6 3a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Zm-13.5 0a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Z" />
            </svg>
          </span>
          <p className={styles.statTitle}>Emergency Contact</p>
          <p className={styles.statSub}>John Rossi (Husband)</p>
          <button className={styles.statLink} type="button">Manage Contacts</button>
        </div>

        <div className={styles.statCard}>
          <span className={styles.statIcon}>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
              strokeWidth={1.6} stroke="currentColor" width="28" height="28">
              <path strokeLinecap="round" strokeLinejoin="round"
                d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
            </svg>
          </span>
          <p className={styles.statTitle}>Insurance Policy</p>
          <p className={styles.statSub}>Aetna Gold · Active</p>
          <button className={styles.statLink} type="button">View Policy</button>
        </div>

      </div>

    </div>
  );
}