// =============================================================================
// src/components/documents/DeleteConfirmModal.jsx
//
// A lightweight modal that appears when the patient clicks the delete button
// on a DocumentCard. Uses a portal-free approach — the modal sits inside the
// page flow inside a full-viewport overlay div (not position:fixed, which
// breaks iframe-based environments).
//
// Pressing Escape or clicking the backdrop dismisses without deleting.
// =============================================================================

import { useEffect } from 'react';
import styles from './DeleteConfirmModal.module.css';

export default function DeleteConfirmModal({ document, onConfirm, onCancel }) {
  // Close on Escape key
  useEffect(() => {
    const handleKey = (e) => { if (e.key === 'Escape') onCancel(); };
    document && window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [document, onCancel]);

  if (!document) return null;

  return (
    /* Backdrop — clicking outside cancels */
    <div
      className={styles.backdrop}
      onClick={onCancel}
      role="dialog"
      aria-modal="true"
      aria-labelledby="deleteModalTitle"
    >
      {/* Modal box — stop click propagation so backdrop click doesn't fire */}
      <div
        className={styles.modal}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Warning icon */}
        <div className={styles.iconWrap} aria-hidden="true">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2"
            strokeLinecap="round" strokeLinejoin="round">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
            <line x1="12" y1="9" x2="12" y2="13"/>
            <line x1="12" y1="17" x2="12.01" y2="17"/>
          </svg>
        </div>

        <h2 id="deleteModalTitle" className={styles.title}>
          Delete document?
        </h2>

        <p className={styles.body}>
          <strong>{document.documentName}</strong> will be permanently removed
          from your records and cannot be recovered.
        </p>

        <div className={styles.btnRow}>
          <button
            className={styles.cancelBtn}
            onClick={onCancel}
            autoFocus
          >
            Keep document
          </button>
          <button
            className={styles.deleteBtn}
            onClick={onConfirm}
          >
            Yes, delete
          </button>
        </div>
      </div>
    </div>
  );
}