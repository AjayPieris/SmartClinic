// =============================================================================
// src/pages/patient/PatientDocuments.jsx — The full document management page.
//
// Two-column layout:
//   Left  (40%): UploadForm panel
//   Right (60%): DocumentList
//
// The delete confirmation modal is rendered at the page level so it can
// overlay both columns. All state lives in useDocuments.
// =============================================================================

import useDocuments        from '../../hooks/useDocuments';
import UploadForm          from '../../components/documents/UploadForm';
import DocumentList        from '../../components/documents/DocumentList';
import DeleteConfirmModal  from '../../components/documents/DeleteConfirmModal';
import styles from './PatientDocuments.module.css';

export default function PatientDocuments() {
  const docs = useDocuments();

  const handleUpload = async (file, name, appointmentId) => {
    await docs.uploadDocument(file, name, appointmentId);
    docs.setSuccessMsg('Document uploaded successfully!');
    setTimeout(() => docs.setSuccessMsg(''), 4000);
  };

  return (
    <div className={styles.page}>

      {/* Page heading */}
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>My documents</h1>
        <p className={styles.pageSubtitle}>
          Securely upload and manage your medical records.
        </p>
      </div>

      {/* Success banner */}
      {docs.successMsg && (
        <div className={styles.successBanner} role="status">
          <span>{docs.successMsg}</span>
          <button onClick={() => docs.setSuccessMsg('')}>×</button>
        </div>
      )}

      {/* Two-column layout */}
      <div className={styles.columns}>

        {/* Left: upload panel */}
        <aside className={styles.uploadPanel}>
          <UploadForm
            onSubmit={handleUpload}
            isUploading={docs.isUploading}
            uploadProgress={docs.uploadProgress}
            error={docs.error}
          />
        </aside>

        {/* Right: document list */}
        <section className={styles.listPanel}>
          <DocumentList
            documents={docs.documents}
            isLoading={docs.isLoading}
            onDelete={docs.setPendingDelete}
          />
        </section>

      </div>

      {/* Delete confirmation modal — rendered at page root */}
      <DeleteConfirmModal
        document={docs.pendingDelete}
        onConfirm={docs.confirmDelete}
        onCancel={() => docs.setPendingDelete(null)}
      />

    </div>
  );
}