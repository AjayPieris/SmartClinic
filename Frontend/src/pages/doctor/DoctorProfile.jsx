import { useAuth } from '../../context/AuthContext';
import { Link } from 'react-router-dom';
import ProfilePictureUploader from '../../components/documents/ProfilePictureUploader';
import styles from './DoctorProfile.module.css';

export default function DoctorProfile() {
  const { user } = useAuth();

  return (
    <div className={styles.page}>
      <h1 className="page-title">My profile</h1>

      {/* Profile picture section */}
      <section className={`card ${styles.section}`}>
        <p className={styles.sectionLabel}>Profile photo</p>
        <ProfilePictureUploader />
      </section>

      {/* Account details */}
      <section className={`card ${styles.section}`}>
        <p className={styles.sectionLabel}>Account details</p>
        <div className={styles.infoGrid}>
          {[
            ['Full name', `${user?.firstName} ${user?.lastName}`],
            ['Email', user?.email],
            ['Role', null],
          ].map(([label, value]) => (
            <div key={label} className={styles.infoRow}>
              <span className={styles.infoLabel}>{label}</span>
              {label === 'Role' ? (
                <span className={`role-badge ${user?.role?.toLowerCase()}`}>
                  {user?.role}
                </span>
              ) : (
                <span className={styles.infoValue}>{value}</span>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Availability CTA */}
      <Link to="/doctor/availability" className={styles.availCta}>
        <span>Manage your availability schedule</span>
        <span>→</span>
      </Link>
    </div>
  );
}