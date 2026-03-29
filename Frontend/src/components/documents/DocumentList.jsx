// =============================================================================
// src/components/documents/DocumentList.jsx
//
// Renders the patient's document library — skeleton while loading,
// empty state when the list is clear, document cards otherwise.
// =============================================================================

import DocumentCard from './DocumentCard';
import styles from './DocumentList.module.css';

export default function DocumentList({ documents, isLoading, onDelete }) {
  if (isLoading) {
    return (
      <div className={styles.skeletonList}>
        {[...Array(4)].map((_, i) => (
          <div key={i} className={styles.skeleton} />
        ))}
      </div>
    );
  }

  if (documents.length === 0) {
    return (
      <div className={styles.emptyState}>
        {/* Folder icon */}
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" strokeWidth="1.5"
          strokeLinecap="round" strokeLinejoin="round"
          style={{ color: 'var(--color-text-subtle)' }}>
          <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
        </svg>
        <p className={styles.emptyTitle}>No documents yet</p>
        <p className={styles.emptyHint}>
          Upload your medical records, test results, or referral letters.
        </p>
      </div>
    );
  }

  return (
    <div className={styles.list}>
      <p className={styles.listHeader}>
        {documents.length} document{documents.length !== 1 ? 's' : ''}
      </p>
      {documents.map((doc) => (
        <DocumentCard
          key={doc.id}
          document={doc}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}