// =============================================================================
// src/components/availability/DayRow.jsx — One row in the weekly grid.
//
// Each row contains:
//   - Day name label (Mon, Tue…)
//   - Toggle switch (enables/disables the day)
//   - Start time dropdown  } only visible when the day is enabled
//   - End time dropdown    }
//   - Inline error message if end ≤ start
//   - Slot count badge (how many slots fit at the current duration)
// =============================================================================

import { buildTimeOptions, countSlots, DAY_NAMES } from '../../utils/availabilityUtils';
import styles from './DayRow.module.css';

// Build once — same options for every row
const TIME_OPTIONS = buildTimeOptions();

export default function DayRow({
  day,              // { dayOfWeek, enabled, startTime, endTime, error }
  consultationDuration,
  onToggle,
  onTimeChange,
}) {
  const slotCount = day.enabled && !day.error
    ? countSlots(day.startTime, day.endTime, consultationDuration)
    : 0;

  return (
    <div
      className={`${styles.row} ${day.enabled ? styles.rowEnabled : styles.rowDisabled}`}
    >
      {/* Day toggle + label */}
      <div className={styles.dayInfo}>
        <label className={styles.toggleWrap} aria-label={`Enable ${DAY_NAMES[day.dayOfWeek]}`}>
          <input
            type="checkbox"
            className={styles.toggleInput}
            checked={day.enabled}
            onChange={() => onToggle(day.dayOfWeek)}
          />
          <span className={styles.toggleTrack}>
            <span className={styles.toggleThumb} />
          </span>
        </label>

        <span className={`${styles.dayName} ${day.enabled ? styles.dayNameActive : ''}`}>
          {DAY_NAMES[day.dayOfWeek]}
        </span>
      </div>

      {/* Time range selectors — shown when enabled */}
      {day.enabled ? (
        <div className={styles.timeRow}>
          {/* Start time */}
          <select
            className={`${styles.timeSelect} ${day.error ? styles.timeSelectError : ''}`}
            value={day.startTime}
            onChange={(e) => onTimeChange(day.dayOfWeek, 'startTime', e.target.value)}
            aria-label={`${DAY_NAMES[day.dayOfWeek]} start time`}
          >
            {TIME_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>

          <span className={styles.timeSep} aria-hidden="true">to</span>

          {/* End time */}
          <select
            className={`${styles.timeSelect} ${day.error ? styles.timeSelectError : ''}`}
            value={day.endTime}
            onChange={(e) => onTimeChange(day.dayOfWeek, 'endTime', e.target.value)}
            aria-label={`${DAY_NAMES[day.dayOfWeek]} end time`}
          >
            {TIME_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>

          {/* Slot count badge */}
          {slotCount > 0 && (
            <span
              className={styles.slotBadge}
              title={`${slotCount} appointment slots`}
            >
              {slotCount} slot{slotCount !== 1 ? 's' : ''}
            </span>
          )}

          {/* Inline error */}
          {day.error && (
            <span className={styles.inlineError} role="alert">
              {day.error}
            </span>
          )}
        </div>
      ) : (
        /* Unavailable label when disabled */
        <span className={styles.unavailableLabel}>Not available</span>
      )}
    </div>
  );
}