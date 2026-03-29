// =============================================================================
// src/components/schedule/DaySummary.jsx
//
// Three quick-glance stats for the selected day:
//   Total appointments · Telehealth count · Pending (not yet confirmed) count
// Renders as a row of metric cards at the top of the right column.
// =============================================================================

import { format } from 'date-fns';
import styles from './DaySummary.module.css';

export default function DaySummary({ appointments, selectedDate }) {
  const total      = appointments.length;
  const telehealth = appointments.filter((a) => a.isTelehealth).length;
  const pending    = appointments.filter((a) => a.status === 'Pending').length;
  const confirmed  = appointments.filter((a) => a.status === 'Confirmed').length;

  const stats = [
    { label: 'Total',      value: total,      color: 'default' },
    { label: 'Telehealth', value: telehealth,  color: 'info'    },
    { label: 'Confirmed',  value: confirmed,   color: 'success' },
    { label: 'Pending',    value: pending,     color: 'warning' },
  ];

  return (
    <div className={styles.wrap}>
      <p className={styles.dateLabel}>
        {format(selectedDate, 'EEEE, MMMM d')}
      </p>
      <div className={styles.stats}>
        {stats.map((stat) => (
          <div key={stat.label} className={`${styles.statCard} ${styles[stat.color]}`}>
            <span className={styles.statValue}>{stat.value}</span>
            <span className={styles.statLabel}>{stat.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}