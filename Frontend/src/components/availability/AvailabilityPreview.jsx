// =============================================================================
// src/components/availability/AvailabilityPreview.jsx
//
// Right-hand panel that shows a live summary of the current schedule.
// Updates immediately on every change — no save required to see the preview.
//
// Shows:
//   - List of enabled days with their time range and slot count
//   - Total weekly working hours
//   - Total weekly appointment slots
//   - Empty state if no days are enabled
// =============================================================================

import {
  countSlots, totalWeeklyHours, formatTimeLabel, DAY_NAMES,
} from '../../utils/availabilityUtils';
import styles from './AvailabilityPreview.module.css';

export default function AvailabilityPreview({ schedule, consultationDuration }) {
  // Only the enabled days without errors
  const enabledDays = schedule.filter((d) => d.enabled && !d.error);

  const weeklyHours = totalWeeklyHours(enabledDays);
  const totalSlots  = enabledDays.reduce(
    (sum, d) => sum + countSlots(d.startTime, d.endTime, consultationDuration),
    0
  );

  return (
    <div className={styles.panel}>

      <h3 className={styles.panelTitle}>Weekly preview</h3>

      {enabledDays.length === 0 ? (
        <div className={styles.emptyState}>
          <p>No days enabled.</p>
          <p className={styles.emptyHint}>
            Toggle at least one day to see your schedule preview.
          </p>
        </div>
      ) : (
        <>
          {/* Day breakdown */}
          <ul className={styles.dayList}>
            {/* Show in Mon–Fri, Sat, Sun order */}
            {[1,2,3,4,5,6,0]
              .map((dow) => enabledDays.find((d) => d.dayOfWeek === dow))
              .filter(Boolean)
              .map((day) => {
                const slots = countSlots(day.startTime, day.endTime, consultationDuration);
                return (
                  <li key={day.dayOfWeek} className={styles.dayItem}>
                    <div className={styles.dayLeft}>
                      {/* Coloured dot */}
                      <span className={styles.dot} aria-hidden="true" />
                      <span className={styles.dayName}>
                        {DAY_NAMES[day.dayOfWeek]}
                      </span>
                    </div>
                    <div className={styles.dayRight}>
                      <span className={styles.timeRange}>
                        {formatTimeLabel(day.startTime)} – {formatTimeLabel(day.endTime)}
                      </span>
                      <span className={styles.slotCount}>
                        {slots} slot{slots !== 1 ? 's' : ''}
                      </span>
                    </div>
                  </li>
                );
              })}
          </ul>

          {/* Summary stats */}
          <div className={styles.statsRow}>
            <div className={styles.stat}>
              <span className={styles.statValue}>{totalSlots}</span>
              <span className={styles.statLabel}>slots/week</span>
            </div>
            <div className={styles.statDivider} />
            <div className={styles.stat}>
              <span className={styles.statValue}>
                {weeklyHours % 1 === 0
                  ? weeklyHours
                  : weeklyHours.toFixed(1)}h
              </span>
              <span className={styles.statLabel}>hrs/week</span>
            </div>
            <div className={styles.statDivider} />
            <div className={styles.stat}>
              <span className={styles.statValue}>{enabledDays.length}</span>
              <span className={styles.statLabel}>days/week</span>
            </div>
          </div>

          {/* Consultation duration reminder */}
          <p className={styles.durationNote}>
            {consultationDuration}-minute consultations
          </p>
        </>
      )}

    </div>
  );
}