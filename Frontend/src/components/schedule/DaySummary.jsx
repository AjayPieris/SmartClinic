import { format } from 'date-fns';
import styles from './DaySummary.module.css';

export default function DaySummary({ appointments, selectedDate }) {
  const total      = appointments.length;
  const telehealth = appointments.filter((a) => a.isTelehealth).length;
  const pending    = appointments.filter((a) => a.status === 'Pending').length;
  const confirmed  = appointments.filter((a) => a.status === 'Confirmed').length;

  const stats = [
    { 
      label: 'Total', value: total, color: 'default',
      icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
    },
    { 
      label: 'Telehealth', value: telehealth, color: 'info',
      icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="23 7 16 12 23 17 23 7"></polygon><rect x="1" y="5" width="15" height="14" rx="2" ry="2"></rect></svg>
    },
    { 
      label: 'Confirmed', value: confirmed, color: 'success',
      icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
    },
    { 
      label: 'Pending', value: pending, color: 'warning',
      icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
    },
  ];

  return (
    <div className={styles.wrap}>
      <div className={styles.headerRow}>
        <h2 className={styles.dateLabel}>{format(selectedDate, 'EEEE, MMMM d')}</h2>
        <span className={styles.badgeLabel}>Schedule Overview</span>
      </div>
      <div className={styles.stats}>
        {stats.map((stat) => (
          <div key={stat.label} className={`${styles.statCard} ${styles[stat.color]}`}>
            <div className={styles.iconWrap}>{stat.icon}</div>
            <div className={styles.statInfo}>
              <span className={styles.statValue}>{stat.value}</span>
              <span className={styles.statLabel}>{stat.label}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}