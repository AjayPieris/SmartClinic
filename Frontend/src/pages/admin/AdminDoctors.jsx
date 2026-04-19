import { useState, useEffect, useCallback } from 'react';
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

  const fetchDoctors = useCallback(async () => {
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
  }, [activeTab]);

  useEffect(() => {
    fetchDoctors();
  }, [fetchDoctors]);

  const handleApprove = async (id) => {
    try {
      setActionLoadingId(id);
      await approveDoctorApi(id);
      await fetchDoctors();
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
      await fetchDoctors();
      
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
        <p className="page-subtitle">Review medical licenses and approve doctor registrations.</p>
      </header>

      {/* ── Glass Tabs ─────────────────────────────────────────────────── */}
      <div className={styles.tabs}>
        <button 
          className={`${styles.tabBtn} ${activeTab === 'pending' ? styles.active : ''}`}
          onClick={() => setActiveTab('pending')}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
          Pending Approval
          {activeTab === 'pending' && doctors.length > 0 && (
            <span className={styles.badge}>{doctors.length}</span>
          )}
        </button>
        <button 
          className={`${styles.tabBtn} ${activeTab === 'all' ? styles.active : ''}`}
          onClick={() => setActiveTab('all')}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
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
            <p style={{ fontSize: '0.85rem' }}>All recent registrations have been reviewed.</p>
          </div>
        ) : (
          <div className={styles.pendingList}>
            {doctors.map(doctor => (
              <div key={doctor.doctorProfileId} className={styles.doctorCard}>
                
                {/* 1. Doctor Profile Info */}
                <div className={styles.cardHeader}>
                  <div className={styles.avatarBox}>
                    {doctor.profilePictureUrl ? (
                      <img src={doctor.profilePictureUrl} alt="" className={styles.avatar} />
                    ) : (
                      <div className={styles.avatarFallback}>{doctor.firstName[0]}{doctor.lastName[0]}</div>
                    )}
                  </div>
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
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
                      View Submitted Medical License
                    </a>
                  ) : (
                    <p style={{ color: '#ef4444', fontSize: '0.9rem', marginBottom: '16px', fontWeight: 600 }}>
                      No document URL was provided during registration.
                    </p>
                  )}
                  
                  <textarea 
                    className={styles.rejectTextarea}
                    placeholder="Type rejection reason if denying application..."
                    value={rejectReasons[doctor.doctorProfileId] || ''}
                    onChange={(e) => handleReasonChange(doctor.doctorProfileId, e.target.value)}
                  />
                </div>

                {/* 3. Actions */}
                <div className={styles.cardActions}>
                  <button 
                    className={styles.approveBtn}
                    onClick={() => handleApprove(doctor.doctorProfileId)}
                    disabled={actionLoadingId === doctor.doctorProfileId}
                  >
                    {actionLoadingId === doctor.doctorProfileId ? 'Processing...' : 'Approve Application'}
                  </button>
                  <button 
                    className={styles.rejectBtn}
                    onClick={() => handleReject(doctor.doctorProfileId)}
                    disabled={actionLoadingId === doctor.doctorProfileId}
                  >
                     Reject
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
                      <td style={{ fontWeight: 600, color: 'var(--color-text)' }}>{doctor.specialization || '—'}</td>
                      <td>
                        {doctor.verificationStatus === 'Approved' && <span className="status-pill completed">Approved</span>}
                        {doctor.verificationStatus === 'Pending' && <span className="status-pill pending">Pending</span>}
                        {doctor.verificationStatus === 'Rejected' && <span className="status-pill cancelled">Rejected</span>}
                        {!doctor.isActive && <span className="status-pill cancelled" style={{marginLeft: '4px'}}>Blocked</span>}
                      </td>
                      <td style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', fontWeight: 600 }}>
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
