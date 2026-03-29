// =============================================================================
// src/pages/patient/PatientProfile.jsx — Patient profile edit page.
// Includes the ProfilePictureUploader at the top.
// =============================================================================

import { useAuth } from '../../context/AuthContext';
import ProfilePictureUploader from '../../components/documents/ProfilePictureUploader';
import styles from './PatientProfile.module.css';

export default function PatientProfile() {
  const { user } = useAuth();

  return (
    <div className={styles.page}>

      <h1 className={styles.title}>My profile</h1>

      {/* Profile picture section */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Profile photo</h2>
        <ProfilePictureUploader />
      </section>

      {/* Account info (read-only for now) */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Account details</h2>
        <div className={styles.infoGrid}>
          <div className={styles.infoItem}>
            <span className={styles.infoLabel}>Full name</span>
            <span className={styles.infoValue}>
              {user?.firstName} {user?.lastName}
            </span>
          </div>
          <div className={styles.infoItem}>
            <span className={styles.infoLabel}>Email address</span>
            <span className={styles.infoValue}>{user?.email}</span>
          </div>
          <div className={styles.infoItem}>
            <span className={styles.infoLabel}>Account type</span>
            <span className={`role-badge ${user?.role?.toLowerCase()}`}>
              {user?.role}
            </span>
          </div>
        </div>
      </section>

    </div>
  );
}