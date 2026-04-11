import { useState, useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { getMyAppointmentsApi } from '../../api/appointmentsApi';
import styles from './PatientAppointments.module.css';

export default function PatientAppointments() {
  const location = useLocation();
  const [appointments, setAppointments] = useState([]);
  const [isLoading,    setIsLoading]    = useState(true);
  const [error,        setError]        = useState('');
  
  // Track if we should show the success banner
  const [showSuccess, setShowSuccess] = useState(
    location.state?.bookingSuccess === true
  );

  useEffect(() => {
    getMyAppointmentsApi()
      .then(setAppointments)
      .catch(() => setError('Could not load your appointments.'))
      .finally(() => setIsLoading(false));
  }, []);

  // Calculate statistics for the sidebar
  const confirmedCount = appointments.filter((a) => a.status === 'Confirmed').length;
  const pendingCount   = appointments.filter((a) => a.status === 'Pending').length;

  // For the success banner, grab the doctor name from the most recent pending appointment
  const latestPending = appointments.find(a => a.status === 'Pending');
  const doctorNameForBanner = latestPending 
    ? latestPending.doctorFullName 
    : (location.state?.doctorName || 'YOUR DOCTOR');

  return (
    <div className={styles.page}>
      {/* Header */}
      <div className={`${styles.header} ${styles.animateEnter}`} style={{ '--delay': 0 }}>
        <div className={styles.titleBlock}>
          <h1>My appointments</h1>
          <p>Manage your upcoming clinical visits and care schedule.</p>
        </div>
        <Link to="/patient/book" className={styles.bookBtn}>
          + Book new
        </Link>
      </div>

      {/* Success Notification */}
      {showSuccess && (
        <div className={`${styles.successBanner} ${styles.animateEnter}`} style={{ '--delay': 1 }}>
          <div className={styles.successContent}>
            <div className={styles.checkIconWrap}>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
                <path fillRule="evenodd" d="M19.916 4.626a.75.75 0 01.208 1.04l-9 13.5a.75.75 0 01-1.154.114l-6-6a.75.75 0 011.06-1.06l5.353 5.353 8.493-12.739a.75.75 0 011.04-.208z" clipRule="evenodd" />
              </svg>
            </div>
            <div className={styles.successText}>
              <p className={styles.successTitle}>Appointment Requested Successfully</p>
              <p className={styles.successSubtitle}>Awaiting confirmation from Dr. {doctorNameForBanner}</p>
            </div>
          </div>
          <button className={styles.closeBannerBtn} onClick={() => setShowSuccess(false)} aria-label="Dismiss">
            ×
          </button>
        </div>
      )}

      {error && (
        <div className="error-banner" role="alert">
          <span>{error}</span>
          <button onClick={() => setError('')}>×</button>
        </div>
      )}

      {isLoading ? (
        <div className={styles.layout}>
          <div className={styles.sidebar}>
            <div className="skeleton" style={{ height: 160, borderRadius: 16 }} />
          </div>
          <div className={styles.mainList}>
            {[1, 2, 3].map((i) => (
              <div key={i} className="skeleton" style={{ height: 140, borderRadius: 16 }} />
            ))}
          </div>
        </div>
      ) : (
        <div className={styles.layout}>
          {/* Sidebar */}
          <div className={styles.sidebar}>
            {/* Stats Card */}
            <div className={`${styles.statsCard} ${styles.animateEnter}`} style={{ '--delay': 2 }}>
              <p className={styles.statsTitle}>Schedule Overview</p>
              <div className={styles.statRow}>
                <span className={styles.statLabel}>Confirmed</span>
                <span className={styles.statVal}>{String(confirmedCount).padStart(2, '0')}</span>
              </div>
              <div className={styles.statRow}>
                <span className={styles.statLabel}>Pending</span>
                <span className={styles.statVal}>{String(pendingCount).padStart(2, '0')}</span>
              </div>
            </div>

            {/* Promo Card */}
            <div className={`${styles.promoCard} ${styles.animateEnter}`} style={{ '--delay': 3 }}>
              <div className={styles.promoContent}>
                <p>Your health is our sanctuary. Need urgent assistance?</p>
                <Link to="/patient/support" className={styles.promoLink}>Contact Support</Link>
              </div>
            </div>
          </div>

          {/* Main List */}
          <div className={styles.mainList}>
            {appointments.length === 0 ? (
              <div className={`empty-state ${styles.animateEnter}`} style={{ '--delay': 4 }}>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
                </svg>
                <p>No appointments yet.</p>
                <p><Link to="/patient/book">Book your first visit →</Link></p>
              </div>
            ) : (
              appointments.map((appt, i) => {
                const dateObj = new Date(appt.startTimeUtc);
                const isCompleted = appt.status === 'Completed';

                return (
                  <div 
                    key={appt.id} 
                    className={`${styles.apptCard} ${styles.animateEnter}`} 
                    style={{ '--delay': i + 4 }}
                  >
                    <div className={styles.apptHeader}>
                      <div className={styles.doctorInfo}>
                        {appt.doctorProfilePictureUrl ? (
                          <img src={appt.doctorProfilePictureUrl} alt={appt.doctorFullName} className={styles.avatar} />
                        ) : (
                          <div className={styles.fallbackAvatar}>
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                              <circle cx="12" cy="7" r="4" />
                            </svg>
                          </div>
                        )}
                        <div className={styles.docDetails}>
                          <div className={styles.docNameRow}>
                            <h3 className={styles.docName}>Dr. {appt.doctorFullName}</h3>
                            <span className={`${styles.statusPill} ${styles[appt.status.toLowerCase()]}`}>
                              {appt.status}
                            </span>
                          </div>
                          <p className={styles.spec}>{appt.doctorSpecialization}</p>
                          <div className={styles.timeRow}>
                            <span className={styles.timeItem}>
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                              {dateObj.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                            </span>
                            <span className={styles.timeItem}>
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                              {dateObj.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Action buttons align to the right structure */}
                      {isCompleted ? (
                        <button className={`${styles.actionBtn} ${styles.secondary}`}>View Summary</button>
                      ) : (
                        <Link to={`/patient/chat/${appt.id}`} className={styles.actionBtn}>
                          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="#25D366" style={{ marginRight: '6px' }}>
                            <path d="M12.031 0C5.385 0 0 5.385 0 12.031c0 2.128.55 4.195 1.594 6.012L.15 24l6.096-1.597A11.967 11.967 0 0012.031 24c6.644 0 12.031-5.385 12.031-12.031S18.675 0 12.031 0zm0 20.156c-1.785 0-3.53-.483-5.06-1.393l-.363-.215-3.766.987.994-3.67-.236-.376a10.15 10.15 0 01-1.554-5.458c0-5.59 4.549-10.14 10.14-10.14 5.591 0 10.14 4.55 10.14 10.14s-4.549 10.14-10.14 10.14z"/>
                            <path d="M17.653 14.18c-.31-.155-1.838-.908-2.122-1.013-.284-.105-.49-.155-.697.155s-.804 1.013-.984 1.22c-.18.207-.361.233-.671.078-2.115-.965-3.328-1.584-4.59-3.725-.18-.306.18-.285.485-.89.078-.155.039-.284-.013-.439-.052-.155-.697-1.682-.955-2.302-.25-.6-.505-.518-.696-.527l-.609-.009c-.206 0-.542.078-.826.388s-1.084 1.06-1.084 2.585 1.11 2.999 1.265 3.206c.155.207 2.185 3.336 5.293 4.673 2.17.933 2.87.802 3.385.672.587-.148 1.838-.75 2.096-1.474.258-.724.258-1.344.18-1.474-.078-.13-.284-.207-.594-.362z"/>
                          </svg>
                          Chat
                        </Link>
                      )}
                    </div>

                    {appt.patientReason && !isCompleted && (
                      <p className={styles.reasonQuote}>"{appt.patientReason}"</p>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}