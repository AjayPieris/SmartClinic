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

  // Fetch initial data
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
      await fetchData(); // Refresh data
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
      await fetchData(); // Refresh data
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
        <p className="page-subtitle">Manage all platform users, their roles, and access.</p>
      </header>

      {/* ── Stats Row ────────────────────────────────────────── */}
      {stats && (
        <div className={styles.statsRow}>
          <div className={styles.statCard}>
            <span className={styles.statLabel}>Total Users</span>
            <span className={styles.statVal}>{stats.totalUsers}</span>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statLabel}>Active Patients</span>
            <span className={styles.statVal}>{stats.activePatients}</span>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statLabel}>Verified Doctors</span>
            <span className={styles.statVal}>{stats.verifiedDoctors}</span>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statLabel}>Pending Doctors</span>
            <span className={styles.statVal}>{stats.pendingApproval}</span>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statLabel}>Blocked Users</span>
            <span className={styles.statVal}>{stats.blockedUsers}</span>
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

      {/* ── Users Table ──────────────────────────────────────── */}
      <div className={styles.tableCard}>
        {loading ? (
          <div className="screen-center" style={{ minHeight: '300px' }}>
            <div className="spinner" />
          </div>
        ) : users.length === 0 ? (
          <div className="empty-state">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" />
            </svg>
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
                    <td style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>
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
                              Block
                            </button>
                          ) : (
                            <button 
                              className={`${styles.actionBtn} ${styles.unblock}`}
                              onClick={() => handleUnblock(u)}
                            >
                              Unblock
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

      {/* ── Block Confirmation Modal ────────────────────────────────────── */}
      {isModalOpen && userToBlock && (
        <div className={styles.modalOverlay} onClick={handleCloseModal}>
          <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
            <h3 className={styles.modalTitle}>Block User?</h3>
            <p className={styles.modalDesc}>
              Are you sure you want to block <strong>{userToBlock.firstName} {userToBlock.lastName}</strong>? 
              They will be immediately logged out and unable to access the platform or book appointments.
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
                {actionLoading ? 'Blocking...' : 'Block User'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}