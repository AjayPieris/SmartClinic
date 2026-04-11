// =============================================================================
// src/components/documents/DocumentCard.jsx
//
// Renders a single document row in the document list.
// Shows: file type badge · document name · file size · upload date ·
//        open link (Cloudinary URL) · delete button.
//
// The "Open" link targets the Cloudinary secure_url — the browser handles
// display (PDFs open inline, images open in a new tab).
// =============================================================================

import { format } from "date-fns";
import { getFileMeta } from "../../utils/fileValidation";
import styles from "./DocumentCard.module.css";

export default function DocumentCard({ document, onDelete }) {
  const { label, colorClass } = getFileMeta(document.contentType);
  const uploadDate = new Date(document.uploadedAtUtc);

  return (
    <div className={styles.card}>
      {/* File type icon badge */}
      <div
        className={`${styles.typeBadge} ${styles[colorClass]}`}
        aria-label={`File type: ${label}`}
        title={`File type: ${label}`}
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
          <polyline points="14 2 14 8 20 8"></polyline>
          <line x1="16" y1="13" x2="8" y2="13"></line>
          <line x1="16" y1="17" x2="8" y2="17"></line>
          <polyline points="10 9 9 9 8 9"></polyline>
        </svg>
      </div>

      {/* Document info */}
      <div className={styles.info}>
        <p className={styles.docName}>{document.documentName}</p>
        <p className={styles.docMeta}>
          <span>{document.fileSizeFormatted}</span>
          <span className={styles.metaDot}>·</span>
          <span>{format(uploadDate, "MMM d, yyyy")}</span>
          <span className={styles.metaDot}>·</span>
          <span>
            {document.contentType.split("/")[1]?.toUpperCase() ?? label}
          </span>
        </p>
      </div>

      {/* Actions */}
      <div className={styles.actions}>
        {/* Open / download */}
        <a
          href={document.cloudinaryUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={styles.openBtn}
          aria-label={`Open ${document.documentName}`}
        >
          {/* External link icon */}
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
            <polyline points="15 3 21 3 21 9" />
            <line x1="10" y1="14" x2="21" y2="3" />
          </svg>
          Open
        </a>

        {/* Delete */}
        <button
          className={styles.deleteBtn}
          onClick={() => onDelete(document)}
          aria-label={`Delete ${document.documentName}`}
        >
          {/* Trash icon */}
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="3 6 5 6 21 6" />
            <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
            <path d="M10 11v6" />
            <path d="M14 11v6" />
            <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
          </svg>
          Delete
        </button>
      </div>
    </div>
  );
}
