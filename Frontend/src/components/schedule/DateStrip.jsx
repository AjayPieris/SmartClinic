// =============================================================================
// src/components/schedule/DateStrip.jsx
//
// A 7-day horizontal strip. Each day shows:
//   - Short day name (Mon, Tue…)
//   - Date number
//   - A coloured dot if there are appointments that day
//   - "Today" ring when applicable
//   - Active highlight on selectedDate
//
// The doctor can navigate week-by-week with prev/next arrow buttons.
// =============================================================================

import { isSameDay, isToday, format } from 'date-fns';
import styles from './DateStrip.module.css';

export default function DateStrip({
  weekDates,
  selectedDate,
  onDateSelect,
  onPrevWeek,
  onNextWeek,
  allAppointments, // used to show appointment-dot indicators
}) {
  // Build a fast lookup: dateString → appointment count for that day
  const apptCountByDate = allAppointments.reduce((acc, a) => {
    const key = format(new Date(a.startTimeUtc), 'yyyy-MM-dd');
    acc[key] = (acc[key] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <div className={styles.strip}>

      {/* Prev week button */}
      <button
        className={styles.navBtn}
        onClick={onPrevWeek}
        aria-label="Previous week"
      >
        ‹
      </button>

      {/* 7 day buttons */}
      <div className={styles.days}>
        {weekDates.map((date) => {
          const isSelected = isSameDay(date, selectedDate);
          const isCurrentDay = isToday(date);
          const dateKey = format(date, 'yyyy-MM-dd');
          const hasAppts = (apptCountByDate[dateKey] ?? 0) > 0;
          const count = apptCountByDate[dateKey] ?? 0;

          return (
            <button
              key={date.toISOString()}
              className={`
                ${styles.day}
                ${isSelected    ? styles.daySelected : ''}
                ${isCurrentDay  ? styles.dayToday    : ''}
              `}
              onClick={() => onDateSelect(date)}
              aria-label={format(date, 'EEEE, MMMM d')}
              aria-pressed={isSelected}
            >
              {/* Day of week abbreviation */}
              <span className={styles.dayName}>
                {format(date, 'EEE')}
              </span>

              {/* Date number */}
              <span className={styles.dayNum}>
                {format(date, 'd')}
              </span>

              {/* Appointment count dot */}
              {hasAppts && (
                <span
                  className={`${styles.dot} ${isSelected ? styles.dotSelected : ''}`}
                  aria-label={`${count} appointment${count !== 1 ? 's' : ''}`}
                >
                  {count > 9 ? '9+' : count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Next week button */}
      <button
        className={styles.navBtn}
        onClick={onNextWeek}
        aria-label="Next week"
      >
        ›
      </button>
    </div>
  );
}