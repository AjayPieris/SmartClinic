import { useState, useEffect } from 'react';
import { 
  getPendingDoctorsApi, 
  getAllDoctorsApi, 
  approveDoctorApi, 
  rejectDoctorApi 
} from '../../api/adminApi';
import styles from './AdminDoctors.module.css';

export default function AdminDoctors() {
  const [activeTab, setActiveTab] = useState('pending'); // 'pending' | 'all'
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [rejectReasons, setRejectReasons] = useState({});

  useEffect(() => {
    fetchDoctors();
  }, [activeTab]);

  const fetchDoctors = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = activeTab === 'pending' 
        ? await getPendingDoctorsApi() 
        : await getAllDoctorsApi();
      setDoctors(data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load doctors.');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id) => {
    try {
      setActionLoadingId(id);
      await approveDoctorApi(id);
      await fetchDoctors(); // Refresh list
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to approve doctor.');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleReject = async (id) => {
    const reason = rejectReasons[id] || '';
    if (!reason.trim()) {
      alert("Please provide a reason for rejection.");
      return;
    }

    try {
      setActionLoadingId(id);
      await rejectDoctorApi(id, reason);
      await fetchDoctors(); // Refresh list
      
      // Clear reason input for this id
      setRejectReasons(prev => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to reject doctor.');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleReasonChange = (id, value) => {
    setRejectReasons(prev => ({ ...prev, [id]: value }));
  };

  return (
    <div className={styles.wrapper}>
      <header>
        <h1 className="page-title">Doctor Verification</h1>
        <p className="page-subtitle">Review and approve doctor registrations.</p>
      </header>

      {/* ── Tabs ─────────────────────────────────────────────────── */}
      <div className={styles.tabs}>
        <button 
          className={`${styles.tabBtn} ${activeTab === 'pending' ? styles.active : ''}`}
          onClick={() => setActiveTab('pending')}
        >
          Pending Approval
          {activeTab === 'pending' && doctors.length > 0 && (
            <span className={styles.badge}>{doctors.length}</span>
          )}
        </button>
        <button 
          className={`${styles.tabBtn} ${activeTab === 'all' ? styles.active : ''}`}
          onClick={() => setActiveTab('all')}
        >
          All Doctors
        </button>
      </div>

      {error && (
        <div className="error-banner">
          <span>{error}</span>
        </div>
      )}

      {/* ── Main Content ─────────────────────────────────────────── */}
      {loading ? (
        <div className="screen-center" style={{ minHeight: '300px' }}>
          <div className="spinner" />
        </div>
      ) : activeTab === 'pending' ? (
        // --- PENDING DOCTORS LIST ---
        doctors.length === 0 ? (
          <div className="empty-state">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
            </svg>
            <p>No doctors pending approval.</p>
            <p style={{ fontSize: '0.85rem' }}>All registrations have been reviewed.</p>
          </div>
        ) : (
          <div className={styles.pendingList}>
            {doctors.map(doctor => (
              <div key={doctor.doctorProfileId} className={styles.doctorCard}>
                
                {/* 1. Doctor Profile Info */}
                <div className={styles.cardHeader}>
                  {doctor.profilePictureUrl ? (
                    <img src={doctor.profilePictureUrl} alt="" className={styles.avatar} />
                  ) : (
                    <div className={styles.avatarFallback}>{doctor.firstName[0]}{doctor.lastName[0]}</div>
                  )}
                  <div className={styles.doctorInfo}>
                    <h3>Dr. {doctor.firstName} {doctor.lastName}</h3>
                    <div className={styles.doctorMeta}>
                      <span><strong>Specialization:</strong> {doctor.specialization || 'Not provided'}</span>
                      <span><strong>License:</strong> {doctor.licenseNumber || 'Not provided'}</span>
                      <span><strong>Email:</strong> {doctor.email}</span>
                      <span><strong>Joined:</strong> {new Date(doctor.createdAtUtc).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>

                {/* 2. Verification Document */}
                <div className={styles.verificationSection}>
                  <div className={styles.sectionTitle}>Verification Document</div>
                  {doctor.verificationDocumentUrl ? (
                    <a 
                      href={doctor.verificationDocumentUrl} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className={styles.docLink}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m3.75 9v6m3-3H9m1.5-12H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
                      </svg>
                      View Submitted Document
                    </a>
                  ) : (
                    <p style={{ color: 'var(--color-warning)', fontSize: '0.9rem', marginBottom: 'var(--space-2)' }}>
                      No document URL was provided during registration.
                    </p>
                  )}
                  
                  <div className={styles.rejectDetails}>
                    <textarea 
                      className={styles.rejectTextarea}
                      placeholder="Rejection reason (required for rejection)..."
                      value={rejectReasons[doctor.doctorProfileId] || ''}
                      onChange={(e) => handleReasonChange(doctor.doctorProfileId, e.target.value)}
                    />
                  </div>
                </div>

                {/* 3. Actions */}
                <div className={styles.cardActions}>
                  <button 
                    className={styles.approveBtn}
                    onClick={() => handleApprove(doctor.doctorProfileId)}
                    disabled={actionLoadingId === doctor.doctorProfileId}
                  >
                    ✓ Approve
                  </button>
                  <button 
                    className={styles.rejectBtn}
                    onClick={() => handleReject(doctor.doctorProfileId)}
                    disabled={actionLoadingId === doctor.doctorProfileId}
                  >
                    ✗ Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        )
      ) : (
        // --- ALL DOCTORS TABLE ---
        <div className={styles.tableCard}>
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Doctor</th>
                  <th>Specialization</th>
                  <th>Status</th>
                  <th>Joined</th>
                </tr>
              </thead>
              <tbody>
                {doctors.length === 0 ? (
                  <tr>
                    <td colSpan="4" style={{ textAlign: 'center', padding: 'var(--space-6)' }}>
                      No doctors found.
                    </td>
                  </tr>
                ) : (
                  doctors.map(doctor => (
                    <tr key={doctor.doctorProfileId}>
                      <td>
                        <div className={styles.userCell}>
                          {doctor.profilePictureUrl ? (
                            <img src={doctor.profilePictureUrl} alt="" className={styles.smallAvatar} />
                          ) : (
                            <div className={styles.smallAvatarFallback}>{doctor.firstName[0]}{doctor.lastName[0]}</div>
                          )}
                          <div className={styles.userInfo}>
                            <span className={styles.userName}>
                              Dr. {doctor.firstName} {doctor.lastName}
                              {doctor.isVerified && (
                                <span className={styles.verifiedBadge} title="Verified Doctor">
                                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z" clipRule="evenodd" />
                                  </svg>
                                </span>
                              )}
                            </span>
                            <span className={styles.userEmail}>{doctor.email}</span>
                          </div>
                        </div>
                      </td>
                      <td>{doctor.specialization || '—'}</td>
                      <td>
                        {doctor.verificationStatus === 'Approved' && <span className="status-pill completed">Approved</span>}
                        {doctor.verificationStatus === 'Pending' && <span className="status-pill pending">Pending</span>}
                        {doctor.verificationStatus === 'Rejected' && <span className="status-pill cancelled">Rejected</span>}
                        {!doctor.isActive && <span className="status-pill cancelled" style={{marginLeft: '4px'}}>Blocked</span>}
                      </td>
                      <td style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>
                        {new Date(doctor.createdAtUtc).toLocaleDateString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
