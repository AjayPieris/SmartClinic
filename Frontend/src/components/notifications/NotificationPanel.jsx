import React from 'react';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { useAuth } from '../../context/AuthContext';
import styles from './NotificationPanel.module.css';

export default function NotificationPanel({ notifications, unreadCount, markAsRead, markAllAsRead, onClose }) {
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleNotificationClick = (n) => {
    if (!n.isRead) {
      markAsRead(n.id);
    }
    
    // Auto-close dropdown
    onClose();

    // Navigate logic
    if (n.type === 'Appointment') {
      const route = user?.role === 'Doctor' ? '/doctor/schedule' : '/patient/appointments';
      navigate(route);
    } else if (n.type === 'Message') {
      // In option B, we will use the Chat Drawer, so just open the chat drawer.
      // Easiest way in SPA without global state is dispatching a custom event, 
      // or we can handle this inside NavBar.
      const event = new CustomEvent('open-chat-drawer', { detail: { appointmentId: n.relatedEntityId } });
      window.dispatchEvent(event);
    }
  };

  const getIcon = (type, title) => {
    if (type === 'Message') {
      return (
        <div className={`${styles.iconWrap} ${styles.iconInfo}`}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
        </div>
      );
    }
    if (title?.toLowerCase().includes('confirm')) {
      return (
        <div className={`${styles.iconWrap} ${styles.iconSuccess}`}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
        </div>
      );
    }
    if (title?.toLowerCase().includes('cancel')) {
      return (
        <div className={`${styles.iconWrap} ${styles.iconDanger}`}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>
        </div>
      );
    }
    // Default
    return (
      <div className={`${styles.iconWrap} ${styles.iconInfo}`}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
      </div>
    );
  };

  return (
    <div className={styles.dropdown}>
      <div className={styles.header}>
        <h3 className={styles.title}>Notifications</h3>
        <div className={styles.headerActions}>
          {unreadCount > 0 && (
            <button className={styles.markAll} onClick={markAllAsRead}>
              Mark all read
            </button>
          )}
          <button className={styles.closeBtn} onClick={onClose} aria-label="Close notifications">
            ×
          </button>
        </div>
      </div>
      
      <div className={styles.list}>
        {notifications.length === 0 ? (
          <div className={styles.empty}>
            <p>You have no notifications</p>
          </div>
        ) : (
          notifications.map((n) => (
            <div 
              key={n.id} 
              className={`${styles.item} ${!n.isRead ? styles.unread : ''}`}
              onClick={() => handleNotificationClick(n)}
            >
              {!n.isRead && <div className={styles.unreadDot} />}
              {getIcon(n.type, n.title)}
              <div className={styles.itemContent}>
                <h4 className={styles.itemTitle}>{n.title}</h4>
                <p className={styles.itemText}>{n.message}</p>
                <span className={styles.itemTime}>
                  {formatDistanceToNow(new Date(n.createdAtUtc), { addSuffix: true })}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
