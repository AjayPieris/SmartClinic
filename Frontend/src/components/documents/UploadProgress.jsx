// =============================================================================
// src/components/documents/UploadProgress.jsx
//
// Animated progress bar shown while isUploading is true.
// The bar fills to 85% at upload speed, then ticks slowly to 99%
// while the server processes the Cloudinary upload + DB write.
// Jumps to 100% when the API returns 201.
//
// Also renders an animated pulsing label that changes text at milestones.
// =============================================================================

import styles from './UploadProgress.module.css';

function getProgressLabel(pct) {
  if (pct < 30)  return 'Uploading file…';
  if (pct < 85)  return 'Sending to server…';
  if (pct < 99)  return 'Processing with Cloudinary…';
  if (pct < 100) return 'Saving to your records…';
  return 'Upload complete!';
}

export default function UploadProgress({ progress, isUploading }) {
  if (!isUploading && progress === 0) return null;

  const isDone = progress >= 100;

  return (
    <div
      className={`${styles.wrap} ${isDone ? styles.done : ''}`}
      role="status"
      aria-label={`Upload progress: ${progress}%`}
    >
      {/* Label row */}
      <div className={styles.labelRow}>
        <span className={styles.label}>{getProgressLabel(progress)}</span>
        <span className={styles.pct}>{progress}%</span>
      </div>

      {/* Track */}
      <div className={styles.track}>
        <div
          className={`${styles.bar} ${isDone ? styles.barDone : ''}`}
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}