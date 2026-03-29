// =============================================================================
// src/components/documents/ProfilePictureUploader.jsx
//
// A compact avatar upload widget shown at the top of the profile page.
// Clicking the avatar or the "Change photo" button opens a file picker.
// On selection: client validates → XHR POST → updates AuthContext.user
// so the NavBar avatar refreshes instantly with no page reload.
// =============================================================================

import { useState, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { validateImageFile } from '../../utils/fileValidation';
import styles from './ProfilePictureUploader.module.css';

export default function ProfilePictureUploader() {
  const { user, updateUser } = useAuth();
  const [isUploading, setIsUploading] = useState(false);
  const [progress,    setProgress]    = useState(0);
  const [error,       setError]       = useState('');
  const [localUrl,    setLocalUrl]    = useState(null); // blob preview before upload confirms
  const inputRef = useRef(null);

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = ''; // allow re-selecting same file
    if (!file) return;

    const { valid, error: validErr } = validateImageFile(file);
    if (!valid) { setError(validErr); return; }

    setError('');

    // Show a local blob preview immediately — UX feels instant
    const blobUrl = URL.createObjectURL(file);
    setLocalUrl(blobUrl);

    // XHR upload with progress
    const formData = new FormData();
    formData.append('file', file);

    setIsUploading(true);
    setProgress(0);

    const xhr = new XMLHttpRequest();
    const apiBase = import.meta.env.VITE_API_BASE_URL;
    const token   = localStorage.getItem('sc_token');

    xhr.upload.onprogress = (ev) => {
      if (ev.lengthComputable)
        setProgress(Math.round((ev.loaded / ev.total) * 90));
    };

    xhr.onload = () => {
      setProgress(100);
      setIsUploading(false);
      if (xhr.status === 200) {
        try {
          const { profilePictureUrl } = JSON.parse(xhr.responseText);
          // Update AuthContext → NavBar re-renders with new avatar
          updateUser({ profilePictureUrl });
          setLocalUrl(null); // let the context URL take over
        } catch {
          setError('Upload succeeded but could not update preview.');
        }
      } else {
        setLocalUrl(null); // revert preview
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
    <div className={styles.wrap}>
      {/* Avatar — click to open picker */}
      <button
        className={styles.avatarBtn}
        onClick={() => inputRef.current?.click()}
        disabled={isUploading}
        aria-label="Change profile picture"
        type="button"
      >
        {displaySrc ? (
          <img
            src={displaySrc}
            alt="Your profile picture"
            className={styles.avatar}
          />
        ) : (
          <div className={styles.avatarFallback}>
            {user?.firstName?.[0]}{user?.lastName?.[0]}
          </div>
        )}

        {/* Camera overlay on hover */}
        <div className={styles.overlay} aria-hidden="true">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
            stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
            <circle cx="12" cy="13" r="4"/>
          </svg>
        </div>

        {/* In-progress ring */}
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

      {/* Hidden input */}
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        onChange={handleFileChange}
        disabled={isUploading}
        style={{ display: 'none' }}
        aria-hidden="true"
      />

      {/* Change photo text link */}
      <div className={styles.meta}>
        <button
          className={styles.changeLink}
          onClick={() => inputRef.current?.click()}
          disabled={isUploading}
          type="button"
        >
          {isUploading ? `Uploading… ${progress}%` : 'Change photo'}
        </button>
        <p className={styles.hint}>JPG, PNG, WebP · Max 5 MB</p>
        {error && <p className={styles.error} role="alert">{error}</p>}
      </div>
    </div>
  );
}