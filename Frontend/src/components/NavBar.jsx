import { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import styles from './NavBar.module.css';

import useNotifications from '../hooks/useNotifications';
import NotificationPanel from './notifications/NotificationPanel';
import ChatDrawer from './chat/ChatDrawer';

import smartClinicLogo from '../assets/SmartClinicLogo.png';

// Icon mapping helper
const getNavIcon = (label) => {
  switch (label) {
    case 'My Appointments':
    case 'Schedule':
      return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>;
    case 'Book a Visit':
      return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>;
    case 'My Documents':
      return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>;
    case 'Profile':
      return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>;
    case 'Availability':
      return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>;
    case 'Users':
      return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>;
    case 'Doctors':
      return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>;
    default:
      return null;
  }
};

const NAV_LINKS = {
  Patient: [
    { to: '/patient/appointments', label: 'My Appointments', short: 'Appts' },
    { to: '/patient/book',         label: 'Book a Visit',    short: 'Book'  },
    { to: '/patient/documents',    label: 'My Documents',    short: 'Docs'  },
    { to: '/patient/profile',      label: 'Profile',         short: 'Profile' },
  ],
  Doctor: [
    { to: '/doctor/schedule',     label: 'Schedule',     short: 'Schedule' },
    { to: '/doctor/availability', label: 'Availability', short: 'Slots'    },
    { to: '/doctor/profile',      label: 'Profile',      short: 'Profile'  },
  ],
  Admin: [
    { to: '/admin/users',    label: 'Users',    short: 'Users'   },
    { to: '/admin/doctors',  label: 'Doctors',  short: 'Doctors' },
  ],
};
export default function NavBar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [chatDrawerOpen, setChatDrawerOpen] = useState(false);
  const [chatDrawerApptId, setChatDrawerApptId] = useState(null);

  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();

  // Separate notifications by type
  const chatNotifications = notifications.filter(n => n.type === 'Message');
  const otherNotifications = notifications.filter(n => n.type !== 'Message');

  const unreadChatCount = chatNotifications.filter(n => !n.isRead).length;
  const unreadOtherCount = otherNotifications.filter(n => !n.isRead).length;

  const unreadCountsByAppt = {};
  chatNotifications.forEach(n => {
    if (!n.isRead && n.relatedEntityId) {
      unreadCountsByAppt[n.relatedEntityId] = (unreadCountsByAppt[n.relatedEntityId] || 0) + 1;
    }
  });

  // Listen for open-chat-drawer event
  useEffect(() => {
    const handleOpenChat = (e) => {
      if (e.detail?.appointmentId) {
        setChatDrawerApptId(e.detail.appointmentId);
      }
      setChatDrawerOpen(true);
    };

    window.addEventListener('open-chat-drawer', handleOpenChat);
    return () => window.removeEventListener('open-chat-drawer', handleOpenChat);
  }, []);

  if (!user) return null; 

  const links = NAV_LINKS[user.role] ?? [];

  const handleChatOpened = (appointmentId) => {
    const unreadForAppt = chatNotifications.filter(n => !n.isRead && n.relatedEntityId === appointmentId);
    unreadForAppt.forEach(n => markAsRead(n.id));
  };

  return (
    <>
      {/* ═══ Desktop / Tablet Top Navbar ═══ */}
      <header className={styles.navbar}>
        <div className={styles.navInner}>

          {/* Brand logo */}
          <button
            className={styles.brandBtn}
            onClick={() => navigate(`/${user.role.toLowerCase()}`)}
            aria-label="Go to dashboard"
          >
            <img src={smartClinicLogo} alt="SmartClinic Logo" className={styles.navLogoImg} />
            <span className={styles.brandText}>SmartClinic</span>
          </button>

          {/* Desktop nav links */}
          <nav className={styles.navLinks} aria-label="Main navigation">
            {links.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) =>
                  `${styles.navLink} ${isActive ? styles.navLinkActive : ''}`
                }
              >
                {getNavIcon(link.label)}
                <span className={styles.linkLabel}>{link.label}</span>
              </NavLink>
            ))}
          </nav>

          {/* Actions: Notifications + Chat + User */}
          <div className={styles.navActions}>
            
            {/* Notification Bell */}
            <div className={styles.panelWrapper}>
              <button 
                className={styles.iconBtn} 
                onClick={() => setNotifOpen(!notifOpen)}
                aria-label="Notifications"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>
                {unreadOtherCount > 0 && <span className={styles.badge}>{unreadOtherCount > 9 ? '9+' : unreadOtherCount}</span>}
              </button>
              
              {notifOpen && (
                <NotificationPanel 
                  notifications={otherNotifications}
                  unreadCount={unreadOtherCount}
                  markAsRead={markAsRead}
                  markAllAsRead={markAllAsRead}
                  onClose={() => setNotifOpen(false)}
                />
              )}
            </div>

            {/* Chat Icon */}
            <div className={styles.panelWrapper}>
              <button 
                className={styles.iconBtn} 
                onClick={() => window.dispatchEvent(new CustomEvent('open-chat-drawer'))}
                aria-label="Chat"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
                {unreadChatCount > 0 && <span className={styles.badge}>{unreadChatCount > 9 ? '9+' : unreadChatCount}</span>}
              </button>
            </div>

            {/* User info + logout */}
            <div className={styles.navUser}>
              <div className={styles.userMeta}>
                <span className={styles.userName}>
                  {user.firstName} {user.lastName}
                </span>
                <span className={`role-badge ${user.role.toLowerCase()}`} style={{ fontSize: '0.65rem', padding: '2px 6px', marginTop: '2px' }}>
                  {user.role}
                </span>
              </div>

              {/* Profile avatar */}
              {user.profilePictureUrl ? (
                <img
                  src={user.profilePictureUrl}
                  alt={`${user.firstName}'s avatar`}
                  className={styles.avatar}
                />
              ) : (
                <div className={styles.avatarFallback} aria-hidden="true">
                  {user.firstName[0]}{user.lastName[0]}
                </div>
              )}

              <button
                onClick={logout}
                className={styles.logoutBtn}
                aria-label="Sign out"
                title="Sign Out"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
              </button>
            </div>
          </div>

          {/* Mobile hamburger */}
          <button
            className={styles.mobileMenuBtn}
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            ) : (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
            )}
          </button>
        </div>

        {/* ═══ Mobile Dropdown Menu ═══ */}
        {mobileMenuOpen && (
          <div className={styles.mobileDropdown}>
            <div className={styles.mobileUserCard}>
              {user.profilePictureUrl ? (
                <img src={user.profilePictureUrl} alt="" className={styles.mobileAvatar} />
              ) : (
                <div className={styles.mobileAvatarFallback}>
                  {user.firstName[0]}{user.lastName[0]}
                </div>
              )}
              <div>
                <p className={styles.mobileUserName}>{user.firstName} {user.lastName}</p>
                <span className={`role-badge ${user.role.toLowerCase()}`} style={{ fontSize: '0.65rem', padding: '2px 8px' }}>
                  {user.role}
                </span>
              </div>
            </div>

            <nav className={styles.mobileNav}>
              {links.map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  className={({ isActive }) =>
                    `${styles.mobileNavLink} ${isActive ? styles.mobileNavLinkActive : ''}`
                  }
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {getNavIcon(link.label)}
                  {link.label}
                </NavLink>
              ))}
            </nav>

            <button className={styles.mobileLogoutBtn} onClick={logout}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
              Sign Out
            </button>
          </div>
        )}
      </header>

      {/* ═══ Mobile Bottom Tab Bar ═══ */}
      <nav className={styles.bottomBar} aria-label="Mobile navigation">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            className={({ isActive }) =>
              `${styles.bottomTab} ${isActive ? styles.bottomTabActive : ''}`
            }
          >
            {getNavIcon(link.label)}
            <span className={styles.bottomTabLabel}>{link.short}</span>
          </NavLink>
        ))}
      </nav>
      
      {/* ═══ Chat Drawer ═══ */}
      <ChatDrawer 
        isOpen={chatDrawerOpen} 
        onClose={() => {
          setChatDrawerOpen(false);
          setChatDrawerApptId(null);
        }} 
        initialAppointmentId={chatDrawerApptId} 
        onChatOpened={handleChatOpened}
        unreadCounts={unreadCountsByAppt}
      />
    </>
  );
}