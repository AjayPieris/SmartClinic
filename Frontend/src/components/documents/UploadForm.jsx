// =============================================================================
// src/components/documents/UploadForm.jsx
//
// Composes FileDropZone + the document name field + optional appointment link
// + the UploadProgress bar into a single self-contained upload panel.
//
// Props:
//   onUploadSuccess  — called with the new MedicalDocumentDto after 201
//   appointments     — list of AppointmentResponseDto for the link dropdown
//   isUploading, uploadProgress — passed through from useDocuments
// =============================================================================

import { useState } from 'react';
import FileDropZone    from './FileDropZone';
import UploadProgress  from './UploadProgress';
import styles from './UploadForm.module.css';

export default function UploadForm({
  onSubmit,       // (file, name, appointmentId?) → Promise
  isUploading,
  uploadProgress,
  appointments,   // for the optional appointment link selector
  error,
}) {
  const [file,          setFile]          = useState(null);
  const [documentName,  setDocumentName]  = useState('');
  const [appointmentId, setAppointmentId] = useState('');
  const [localError,    setLocalError]    = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalError('');

    // Guard: both file and name are required
    if (!file) {
      setLocalError('Please select a file to upload.');
      return;
    }
    if (!documentName.trim()) {
      setLocalError('Please enter a name for this document.');
      return;
    }

    try {
      await onSubmit(
        file,
        documentName.trim(),
        appointmentId || null
      );
      // Reset form on success
      setFile(null);
      setDocumentName('');
      setAppointmentId('');
    } catch {
      // Error is handled in useDocuments and displayed via the error prop
    }
  };

  // Pre-fill document name from file name (strip extension)
  const handleFileSelect = (selectedFile) => {
    setFile(selectedFile);
    if (selectedFile && !documentName) {
      // Strip extension: "blood-test.pdf" → "blood-test"
      const nameWithoutExt = selectedFile.name.replace(/\.[^/.]+$/, '');
      setDocumentName(nameWithoutExt);
    }
  };

  const displayError = localError || error;

  return (
    <form onSubmit={handleSubmit} className={styles.form} noValidate>

      <h2 className={styles.panelTitle}>Upload document</h2>

      {/* Drop zone */}
      <FileDropZone
        onFileSelect={handleFileSelect}
        disabled={isUploading}
      />

      {/* Document name */}
      <div className={styles.formGroup}>
        <label htmlFor="docName" className={styles.label}>
          Document name <span className={styles.required}>*</span>
        </label>
        <input
          id="docName"
          type="text"
          className={styles.input}
          value={documentName}
          onChange={(e) => setDocumentName(e.target.value)}
          placeholder="e.g. Blood test results — March 2025"
          maxLength={500}
          disabled={isUploading}
          required
        />
      </div>

      {/* Optional appointment link */}
      {appointments && appointments.length > 0 && (
        <div className={styles.formGroup}>
          <label htmlFor="apptLink" className={styles.label}>
            Link to appointment{' '}
            <span className={styles.optional}>(optional)</span>
          </label>
          <select
            id="apptLink"
            className={styles.select}
            value={appointmentId}
            onChange={(e) => setAppointmentId(e.target.value)}
            disabled={isUploading}
          >
            <option value="">— Not linked to an appointment —</option>
            {appointments.map((a) => (
              <option key={a.id} value={a.id}>
                Dr. {a.doctorFullName} ·{' '}
                {new Date(a.startTimeUtc).toLocaleDateString(undefined, {
                  dateStyle: 'medium',
                })}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Error */}
      {displayError && (
        <p className={styles.error} role="alert">{displayError}</p>
      )}

      {/* Progress bar */}
      <UploadProgress
        progress={uploadProgress}
        isUploading={isUploading}
      />

      {/* Submit */}
      <button
        type="submit"
        className={styles.uploadBtn}
        disabled={isUploading || !file}
      >
        {isUploading ? (
          <>
            <span className={styles.btnSpinner} aria-hidden="true" />
            Uploading…
          </>
        ) : (
          <>
            {/* Upload icon */}
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2.5"
              strokeLinecap="round" strokeLinejoin="round">
              <polyline points="16 16 12 12 8 16"/>
              <line x1="12" y1="12" x2="12" y2="21"/>
              <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"/>
            </svg>
            Upload document
          </>
        )}
      </button>

    </form>
  );
}