// =============================================================================
// src/components/booking/CalendarPicker.jsx — Step 2: pick a date.
//
// A hand-rolled calendar grid — no external date-picker library needed.
// Uses only the native Date API + date-fns for formatting.
//
// Features:
//   - Month navigation (prev/next)
//   - Greyed-out past dates (unclickable)
//   - Greyed-out days where the doctor has no availability (dayOfWeek check)
//   - Today highlighted with a ring
//   - Selected date highlighted in primary colour
//   - Limits future booking to 60 days out
// =============================================================================

import { useMemo } from 'react';
import {
  format, startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  eachDayOfInterval, isSameMonth, isSameDay, isToday, isBefore,
  addMonths, subMonths, addDays,
} from 'date-fns';
import styles from './CalendarPicker.module.css';

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MAX_DAYS_AHEAD = 60;

export default function CalendarPicker({
  selectedDate,
  currentMonth,
  onDateSelect,
  onMonthChange,
  availabilityJson, // doctor's availability — used to grey out unavailable days
}) {
  const today    = new Date();
  const maxDate  = addDays(today, MAX_DAYS_AHEAD);

  // Parse which days of week the doctor is available
  const availableDays = useMemo(() => {
    try {
      const parsed = JSON.parse(availabilityJson);
      return new Set(parsed.map((w) => w.DayOfWeek));
    } catch {
      return new Set();
    }
  }, [availabilityJson]);

  // Build the full 6-week grid of dates to render
  const calendarDays = useMemo(() => {
    const monthStart  = startOfMonth(currentMonth);
    const monthEnd    = endOfMonth(currentMonth);
    const gridStart   = startOfWeek(monthStart); // Start grid on Sunday
    const gridEnd     = endOfWeek(monthEnd);
    return eachDayOfInterval({ start: gridStart, end: gridEnd });
  }, [currentMonth]);

  // Determine if a calendar day is selectable
  const isDaySelectable = (date) => {
    if (!isSameMonth(date, currentMonth)) return false; // Outside current month
    if (isBefore(date, today) && !isToday(date))        return false; // Past
    if (date > maxDate)                                  return false; // Too far future
    if (!availableDays.has(date.getDay()))               return false; // Doctor not available
    return true;
  };

  const canGoPrev = () => {
    // Don't allow navigating before the current month
    return currentMonth > startOfMonth(today);
  };

  const canGoNext = () => {
    // Don't allow navigating beyond the month containing maxDate
    return startOfMonth(addMonths(currentMonth, 1)) <= startOfMonth(maxDate);
  };

  return (
    <div className={styles.calendar}>

      {/* Month header with prev/next navigation */}
      <div className={styles.monthNav}>
        <button
          className={styles.navBtn}
          onClick={() => onMonthChange(subMonths(currentMonth, 1))}
          disabled={!canGoPrev()}
          aria-label="Previous month"
        >
          ‹
        </button>

        <h2 className={styles.monthLabel}>
          {format(currentMonth, 'MMMM yyyy')}
        </h2>

        <button
          className={styles.navBtn}
          onClick={() => onMonthChange(addMonths(currentMonth, 1))}
          disabled={!canGoNext()}
          aria-label="Next month"
        >
          ›
        </button>
      </div>

      {/* Day-of-week column headers */}
      <div className={styles.dayNames}>
        {DAY_NAMES.map((d) => (
          <div key={d} className={styles.dayName}>{d}</div>
        ))}
      </div>

      {/* Calendar day grid */}
      <div className={styles.grid}>
        {calendarDays.map((date) => {
          const selectable  = isDaySelectable(date);
          const isSelected  = selectedDate && isSameDay(date, selectedDate);
          const isCurrent   = isToday(date);
          const inMonth     = isSameMonth(date, currentMonth);

          return (
            <button
              key={date.toISOString()}
              className={`
                ${styles.day}
                ${!inMonth     ? styles.dayOutside   : ''}
                ${!selectable  ? styles.dayDisabled  : ''}
                ${isCurrent    ? styles.dayToday     : ''}
                ${isSelected   ? styles.daySelected  : ''}
              `}
              onClick={() => selectable && onDateSelect(date)}
              disabled={!selectable}
              aria-label={format(date, 'PPPP')}
              aria-pressed={isSelected}
            >
              {format(date, 'd')}
            </button>
          );
        })}
      </div>

      {/* Availability legend */}
      <div className={styles.legend}>
        <span className={styles.legendItem}>
          <span className={`${styles.legendDot} ${styles.dotAvail}`} />
          Available
        </span>
        <span className={styles.legendItem}>
          <span className={`${styles.legendDot} ${styles.dotUnavail}`} />
          Unavailable
        </span>
      </div>

    </div>
  );
}