import { useState, useEffect } from 'react';
import { 
  getAllUsersApi, 
  blockUserApi, 
  unblockUserApi, 
  getAdminStatsApi 
} from '../../api/adminApi';
import styles from './AdminUsers.module.css';

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [userToBlock, setUserToBlock] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchData();
  }, [roleFilter, statusFilter, search]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [usersData, statsData] = await Promise.all([
        getAllUsersApi({ role: roleFilter, status: statusFilter, search }),
        getAdminStatsApi()
      ]);

      setUsers(usersData);
      setStats(statsData);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load users.');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenBlockModal = (user) => {
    setUserToBlock(user);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setUserToBlock(null);
  };

  const handleBlockConfirm = async () => {
    if (!userToBlock) return;
    
    try {
      setActionLoading(true);
      await blockUserApi(userToBlock.id);
      await fetchData();
      handleCloseModal();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to block user.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleUnblock = async (user) => {
    if (!window.confirm(`Are you sure you want to unblock ${user.firstName} ${user.lastName}?`)) return;

    try {
      setActionLoading(true);
      await unblockUserApi(user.id);
      await fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to unblock user.');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className={styles.wrapper}>
      <header>
        <h1 className="page-title">User Management</h1>
        <p className="page-subtitle">Platform overview and access control rules.</p>
      </header>

      {/* ── Glass Stats Row ────────────────────────────────────────── */}
      {stats && (
        <div className={styles.statsContainer}>
          <div className={styles.statCard}>
            <div className={`${styles.statIconBox} ${styles.totalIcon}`}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
            </div>
            <div className={styles.statContent}>
              <span className={styles.statVal}>{stats.totalUsers}</span>
              <span className={styles.statLabel}>Total Users</span>
            </div>
          </div>
          
          <div className={styles.statCard}>
            <div className={`${styles.statIconBox} ${styles.patientIcon}`}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
            </div>
            <div className={styles.statContent}>
              <span className={styles.statVal}>{stats.activePatients}</span>
              <span className={styles.statLabel}>Active Patients</span>
            </div>
          </div>

          <div className={styles.statCard}>
            <div className={`${styles.statIconBox} ${styles.doctorIcon}`}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
            </div>
            <div className={styles.statContent}>
              <span className={styles.statVal}>{stats.verifiedDoctors}</span>
              <span className={styles.statLabel}>Verified Doctors</span>
            </div>
          </div>

          <div className={styles.statCard}>
            <div className={`${styles.statIconBox} ${styles.pendingIcon}`}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
            </div>
            <div className={styles.statContent}>
              <span className={styles.statVal}>{stats.pendingApproval}</span>
              <span className={styles.statLabel}>Pending Doctors</span>
            </div>
          </div>

          <div className={styles.statCard}>
            <div className={`${styles.statIconBox} ${styles.blockedIcon}`}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>
            </div>
            <div className={styles.statContent}>
              <span className={styles.statVal}>{stats.blockedUsers}</span>
              <span className={styles.statLabel}>Blocked Profiles</span>
            </div>
          </div>
        </div>
      )}

      {/* ── Proportion Chart ────────────────────────────────────────── */}
      {stats && stats.totalUsers > 0 && (
        <div className={styles.ratioChartContainer}>
          <div className={styles.chartHeader}>
            <h3 className={styles.chartTitle}>Platform Demographics</h3>
          </div>
          
          <div className={styles.chartBarWrapper}>
            <div className={styles.chartSegment} style={{ width: `${(stats.activePatients / stats.totalUsers) * 100}%`, background: 'rgba(16, 185, 129, 0.8)' }} />
            <div className={styles.chartSegment} style={{ width: `${(stats.verifiedDoctors / stats.totalUsers) * 100}%`, background: 'rgba(14, 165, 233, 0.8)' }} />
            <div className={styles.chartSegment} style={{ width: `${(stats.pendingApproval / stats.totalUsers) * 100}%`, background: 'rgba(245, 158, 11, 0.8)' }} />
            <div className={styles.chartSegment} style={{ width: `${(stats.blockedUsers / stats.totalUsers) * 100}%`, background: 'rgba(239, 68, 68, 0.8)' }} />
          </div>

          <div className={styles.chartLegend}>
            <div className={styles.legendItem}><span className={styles.legendColor} style={{ background: 'rgba(16, 185, 129, 0.8)' }}></span> Patients</div>
            <div className={styles.legendItem}><span className={styles.legendColor} style={{ background: 'rgba(14, 165, 233, 0.8)' }}></span> Verified Doctors</div>
            <div className={styles.legendItem}><span className={styles.legendColor} style={{ background: 'rgba(245, 158, 11, 0.8)' }}></span> Pending Doctors</div>
            <div className={styles.legendItem}><span className={styles.legendColor} style={{ background: 'rgba(239, 68, 68, 0.8)' }}></span> Blocked</div>
          </div>
        </div>
      )}

      {/* ── Filter Bar ───────────────────────────────────────── */}
      <div className={styles.filterBar}>
        <div className={styles.searchGroup}>
          <svg className={styles.searchIcon} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
          </svg>
          <input 
            type="text" 
            placeholder="Search by name or email..." 
            className={styles.searchInput}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        
        <select 
          className={styles.filterSelect}
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
        >
          <option value="">All Roles</option>
          <option value="Patient">Patients</option>
          <option value="Doctor">Doctors</option>
          <option value="Admin">Admins</option>
        </select>

        <select 
          className={styles.filterSelect}
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="">All Statuses</option>
          <option value="active">Active</option>
          <option value="blocked">Blocked</option>
        </select>
      </div>

      {error && (
        <div className="error-banner">
          <span>{error}</span>
        </div>
      )}

      {/* ── Users Table Glass ──────────────────────────────────────── */}
      <div className={styles.tableCard}>
        {loading ? (
          <div className="skeleton" style={{ height: '300px', borderRadius: 20 }} />
        ) : users.length === 0 ? (
          <div className="empty-state">
             <p>No users found matching your filters.</p>
          </div>
        ) : (
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>User</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Joined</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id}>
                    <td>
                      <div className={styles.userCell}>
                        {u.profilePictureUrl ? (
                          <img src={u.profilePictureUrl} alt="" className={styles.avatar} />
                        ) : (
                          <div className={styles.avatarFallback}>{u.firstName[0]}{u.lastName[0]}</div>
                        )}
                        <div className={styles.userInfo}>
                          <span className={styles.userName}>
                            {u.firstName} {u.lastName}
                            {u.isVerified && (
                              <span className={styles.verifiedBadge} title="Verified Doctor">
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                  <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z" clipRule="evenodd" />
                                </svg>
                              </span>
                            )}
                          </span>
                          <span className={styles.userEmail}>{u.email}</span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className={`role-badge ${u.role.toLowerCase()}`}>{u.role}</span>
                    </td>
                    <td>
                      {u.isActive ? (
                        <span className="status-pill completed">Active</span>
                      ) : (
                        <span className="status-pill cancelled">Blocked</span>
                      )}
                    </td>
                    <td style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', fontWeight: 600 }}>
                      {new Date(u.createdAtUtc).toLocaleDateString()}
                    </td>
                    <td>
                      {u.role !== 'Admin' && (
                        <div className={styles.actions}>
                          {u.isActive ? (
                            <button 
                              className={`${styles.actionBtn} ${styles.block}`}
                              onClick={() => handleOpenBlockModal(u)}
                            >
                              Block User
                            </button>
                          ) : (
                            <button 
                              className={`${styles.actionBtn} ${styles.unblock}`}
                              onClick={() => handleUnblock(u)}
                            >
                              Restore Access
                            </button>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Block Confirmation Modal Drop-shadow ──────────────────────── */}
      {isModalOpen && userToBlock && (
        <div className={styles.modalOverlay} onClick={handleCloseModal}>
          <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
            <h3 className={styles.modalTitle}>Block User?</h3>
            <p className={styles.modalDesc}>
              Are you sure you want to block <strong>{userToBlock.firstName} {userToBlock.lastName}</strong>? 
              They will be immediately logged out and unable to access the platform.
            </p>
            <div className={styles.modalActions}>
              <button 
                className="btn-secondary" 
                onClick={handleCloseModal}
                disabled={actionLoading}
              >
                Cancel
              </button>
              <button 
                className="btn-danger" 
                onClick={handleBlockConfirm}
                disabled={actionLoading}
              >
                {actionLoading ? 'Suspending...' : 'Suspend User Account'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}