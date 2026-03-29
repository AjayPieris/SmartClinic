// =============================================================================
// src/utils/fileValidation.js — Client-side file validation.
//
// These checks mirror the server-side whitelist in CloudinaryService.cs.
// Client validation is UX only — the server always has the final say.
// Never rely solely on client validation for security.
// =============================================================================

// Must match AllowedDocumentMimeTypes in CloudinaryService.cs
export const ALLOWED_DOCUMENT_TYPES = new Set([
  'application/pdf',
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/tiff',
  'application/dicom',
]);

// Must match AllowedImageMimeTypes in CloudinaryService.cs
export const ALLOWED_IMAGE_TYPES = new Set([
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/gif',
]);

export const MAX_DOCUMENT_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB
export const MAX_IMAGE_SIZE_BYTES    =  5 * 1024 * 1024; //  5 MB

/**
 * Validate a file chosen for medical document upload.
 * @param {File} file
 * @returns {{ valid: boolean, error: string }}
 */
export function validateDocumentFile(file) {
  if (!file) return { valid: false, error: 'No file selected.' };

  if (!ALLOWED_DOCUMENT_TYPES.has(file.type)) {
    return {
      valid: false,
      error: `File type "${file.type || 'unknown'}" is not supported. ` +
             'Please upload a PDF, JPG, PNG, WebP, or TIFF file.',
    };
  }

  if (file.size > MAX_DOCUMENT_SIZE_BYTES) {
    return {
      valid: false,
      error: `File is too large (${formatBytes(file.size)}). Maximum size is 10 MB.`,
    };
  }

  if (file.size === 0) {
    return { valid: false, error: 'The selected file is empty.' };
  }

  return { valid: true, error: '' };
}

/**
 * Validate a file chosen for profile picture upload.
 * @param {File} file
 * @returns {{ valid: boolean, error: string }}
 */
export function validateImageFile(file) {
  if (!file) return { valid: false, error: 'No file selected.' };

  if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
    return {
      valid: false,
      error: 'Profile pictures must be a JPG, PNG, WebP, or GIF file.',
    };
  }

  if (file.size > MAX_IMAGE_SIZE_BYTES) {
    return {
      valid: false,
      error: `Image is too large (${formatBytes(file.size)}). Maximum size is 5 MB.`,
    };
  }

  return { valid: true, error: '' };
}

/**
 * Return a human-readable file size string.
 * @param {number} bytes
 * @returns {string}
 */
export function formatBytes(bytes) {
  if (bytes === 0)         return '0 B';
  if (bytes < 1024)        return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Map a MIME type to a short display label and icon colour class.
 * @param {string} mimeType
 * @returns {{ label: string, colorClass: string }}
 */
export function getFileMeta(mimeType) {
  if (mimeType === 'application/pdf')
    return { label: 'PDF',  colorClass: 'pdf'   };
  if (mimeType.startsWith('image/'))
    return { label: 'IMG',  colorClass: 'image' };
  if (mimeType === 'application/dicom')
    return { label: 'DICOM', colorClass: 'dicom' };
  return { label: 'FILE', colorClass: 'generic' };
}