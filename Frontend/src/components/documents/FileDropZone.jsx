// =============================================================================
// src/components/documents/FileDropZone.jsx
//
// A drag-and-drop upload area with a fallback file picker button.
//
// States:
//   idle      — default dashed border, upload icon, helper text
//   dragOver  — highlighted border + background when a file is dragged over
//   hasFile   — shows the selected file's name and size with a "change" option
//
// Accessibility:
//   The hidden <input type="file"> is triggered by clicking the zone or
//   pressing Enter/Space on the focusable zone div.
//   The drag-and-drop events are supplemented with keyboard equivalents.
// =============================================================================

import { useState, useRef, useCallback } from 'react';
import { validateDocumentFile, formatBytes } from '../../utils/fileValidation';
import styles from './FileDropZone.module.css';

export default function FileDropZone({ onFileSelect, disabled }) {
  const [isDragOver, setIsDragOver]   = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [validationError, setValidationError] = useState('');

  const inputRef = useRef(null);

  // ── Process a file (from drag-drop or picker) ───────────────────────────
  const processFile = useCallback((file) => {
    const { valid, error } = validateDocumentFile(file);
    if (!valid) {
      setValidationError(error);
      setSelectedFile(null);
      onFileSelect(null);
      return;
    }
    setValidationError('');
    setSelectedFile(file);
    onFileSelect(file);
  }, [onFileSelect]);

  // ── Drag event handlers ─────────────────────────────────────────────────
  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    if (disabled) return;

    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  };

  // ── Native file input change ────────────────────────────────────────────
  const handleInputChange = (e) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
    // Reset the input so re-selecting the same file triggers onChange again
    e.target.value = '';
  };

  // ── Keyboard accessibility ──────────────────────────────────────────────
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      inputRef.current?.click();
    }
  };

  const clearFile = (e) => {
    e.stopPropagation();
    setSelectedFile(null);
    setValidationError('');
    onFileSelect(null);
  };

  return (
    <div className={styles.wrap}>
      {/* Hidden native file input */}
      <input
        ref={inputRef}
        type="file"
        className={styles.hiddenInput}
        accept=".pdf,.jpg,.jpeg,.png,.webp,.tiff,.dcm"
        onChange={handleInputChange}
        disabled={disabled}
        aria-hidden="true"
        tabIndex={-1}
      />

      {/* Drop zone */}
      <div
        className={`
          ${styles.zone}
          ${isDragOver   ? styles.zoneDragOver  : ''}
          ${selectedFile ? styles.zoneHasFile   : ''}
          ${disabled     ? styles.zoneDisabled  : ''}
        `}
        onDragOver={handleDragOver}
        onDragEnter={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !disabled && inputRef.current?.click()}
        onKeyDown={handleKeyDown}
        role="button"
        tabIndex={disabled ? -1 : 0}
        aria-label="File upload area. Click or drag a file here."
        aria-disabled={disabled}
      >
        {selectedFile ? (
          /* ── Has file: show preview ──────────────────────────────────── */
          <div className={styles.filePreview}>
            {/* File type icon */}
            <div className={styles.fileIcon} aria-hidden="true">
              {/* Document SVG icon */}
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="1.5"
                strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
              </svg>
            </div>
            <div className={styles.fileMeta}>
              <p className={styles.fileName}>{selectedFile.name}</p>
              <p className={styles.fileSize}>{formatBytes(selectedFile.size)}</p>
            </div>
            <button
              className={styles.clearBtn}
              onClick={clearFile}
              aria-label="Remove selected file"
              type="button"
            >
              ×
            </button>
          </div>
        ) : (
          /* ── Idle / drag-over state ───────────────────────────────────── */
          <div className={styles.idleContent}>
            {/* Upload cloud icon */}
            <div className={styles.uploadIcon} aria-hidden="true">
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="1.5"
                strokeLinecap="round" strokeLinejoin="round">
                <polyline points="16 16 12 12 8 16"/>
                <line x1="12" y1="12" x2="12" y2="21"/>
                <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"/>
              </svg>
            </div>
            <p className={styles.dropLabel}>
              {isDragOver ? 'Drop file here' : 'Drag & drop your file here'}
            </p>
            <p className={styles.dropSub}>or</p>
            <span className={styles.browseLink}>browse files</span>
            <p className={styles.supportedTypes}>
              PDF, JPG, PNG, WebP, TIFF · Max 10 MB
            </p>
          </div>
        )}
      </div>

      {/* Validation error */}
      {validationError && (
        <p className={styles.validationError} role="alert">
          {validationError}
        </p>
      )}
    </div>
  );
}