// =============================================================================
// src/components/availability/WeekGrid.jsx
//
// Renders 7 DayRow components — one per day of the week.
// Also contains the consultation duration selector since it affects
// the slot count shown in each row.
// =============================================================================

import DayRow from './DayRow';
import styles from './WeekGrid.module.css';

// Duration options in minutes — must be multiples of 5, max 240
const DURATION_OPTIONS = [15, 20, 30, 45, 60, 90, 120];

export default function WeekGrid({
  schedule,
  consultationDuration,
  onDurationChange,
  onToggleDay,
  onTimeChange,
}) {
  return (
    <div className={styles.wrap}>

      {/* Consultation duration selector — above the day grid */}
      <div className={styles.durationRow}>
        <label htmlFor="duration" className={styles.durationLabel}>
          Consultation duration
        </label>
        <select
          id="duration"
          className={styles.durationSelect}
          value={consultationDuration}
          onChange={(e) => onDurationChange(Number(e.target.value))}
        >
          {DURATION_OPTIONS.map((d) => (
            <option key={d} value={d}>
              {d} minutes
            </option>
          ))}
        </select>
        <p className={styles.durationHint}>
          This controls how long each appointment slot is for all days.
        </p>
      </div>

      {/* Divider */}
      <hr className={styles.divider} />

      {/* 7-day grid — Mon first (cosmetic preference; array order is Sun=0…Sat=6) */}
      <div className={styles.grid}>
        {/* Reorder to show Mon–Fri first, then Sat–Sun */}
        {[1, 2, 3, 4, 5, 6, 0].map((dow) => (
          <DayRow
            key={dow}
            day={schedule[dow]}
            consultationDuration={consultationDuration}
            onToggle={onToggleDay}
            onTimeChange={onTimeChange}
          />
        ))}
      </div>
    </div>
  );
}