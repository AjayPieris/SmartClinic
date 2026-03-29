// =============================================================================
// src/components/schedule/ScheduleTimeline.jsx
//
// A vertical hour-by-hour timeline. Appointment blocks are absolutely
// positioned using CSS top/height calculated from their UTC start/end times.
//
// Layout maths (all in local time, converted from UTC):
//   TIMELINE_START_HOUR = 7  (7:00 AM — first hour row)
//   TIMELINE_END_HOUR   = 20 (8:00 PM — last hour row)
//   TOTAL_MINUTES = (END - START) * 60 = 780
//
//   topPercent    = ((apptLocalStart - TIMELINE_START) / TOTAL_MINUTES) * 100
//   heightPercent = (durationMinutes / TOTAL_MINUTES) * 100
//
// A "now" indicator line is positioned the same way using the current time.
// It only renders if today is the selected date.
// =============================================================================

import { useEffect, useRef, useState } from 'react';
import { isSameDay, isToday } from 'date-fns';
import styles from './ScheduleTimeline.module.css';

// Timeline bounds (local hour, 24h)
const TIMELINE_START_HOUR = 7;   // 7:00 AM
const TIMELINE_END_HOUR   = 20;  // 8:00 PM
const TOTAL_MINUTES = (TIMELINE_END_HOUR - TIMELINE_START_HOUR) * 60;

// Row height in px — determines overall timeline height
const HOUR_ROW_HEIGHT = 72;

// Build the array of hour labels to render down the left side
const HOUR_LABELS = Array.from(
  { length: TIMELINE_END_HOUR - TIMELINE_START_HOUR },
  (_, i) => {
    const hour = TIMELINE_START_HOUR + i;
    const ampm = hour < 12 ? 'AM' : 'PM';
    const h    = hour % 12 || 12;
    return { hour, label: `${h} ${ampm}` };
  }
);

// Calculate the top% and height% for a given appointment
function getBlockPosition(appointment) {
  const start = new Date(appointment.startTimeUtc);
  const end   = new Date(appointment.endTimeUtc);

  // Convert to local minutes since midnight
  const startMinutes = start.getHours() * 60 + start.getMinutes();
  const endMinutes   = end.getHours()   * 60 + end.getMinutes();

  // Offset from the timeline start
  const offsetStart    = startMinutes - TIMELINE_START_HOUR * 60;
  const durationMinutes = endMinutes - startMinutes;

  const topPct    = (offsetStart    / TOTAL_MINUTES) * 100;
  const heightPct = (durationMinutes / TOTAL_MINUTES) * 100;

  return {
    top:    `${Math.max(0, topPct)}%`,
    height: `${Math.max(1.5, heightPct)}%`, // min 1.5% so tiny blocks are visible
  };
}

// Calculate "now" line position
function getNowPosition() {
  const now          = new Date();
  const nowMinutes   = now.getHours() * 60 + now.getMinutes();
  const offsetMinutes = nowMinutes - TIMELINE_START_HOUR * 60;
  const pct           = (offsetMinutes / TOTAL_MINUTES) * 100;
  return Math.min(100, Math.max(0, pct));
}

// Status → colour class map for appointment blocks
const STATUS_COLORS = {
  Pending:   styles.blockPending,
  Confirmed: styles.blockConfirmed,
  Completed: styles.blockCompleted,
  Cancelled: styles.blockCancelled,
};

export default function ScheduleTimeline({
  appointments,
  selectedDate,
  selectedApptId,
  isLoading,
  onAppointmentClick,
}) {
  // Refresh the "now" line every minute
  const [nowPct, setNowPct] = useState(getNowPosition);

  useEffect(() => {
    if (!isToday(selectedDate)) return;
    const interval = setInterval(() => setNowPct(getNowPosition()), 60_000);
    return () => clearInterval(interval);
  }, [selectedDate]);

  // Total height of the timeline grid
  const timelineHeight = HOUR_LABELS.length * HOUR_ROW_HEIGHT;

  if (isLoading) {
    return (
      <div className={styles.skeletonWrap}>
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            className={styles.skeleton}
            style={{ marginTop: i === 0 ? '1rem' : '0.5rem', height: `${50 + i * 12}px` }}
          />
        ))}
      </div>
    );
  }

  return (
    <div className={styles.timeline}>

      {/* Hour rows — the fixed grid behind the appointment blocks */}
      <div className={styles.grid} style={{ height: timelineHeight }}>

        {/* Left: hour labels */}
        <div className={styles.hourLabels}>
          {HOUR_LABELS.map(({ hour, label }) => (
            <div
              key={hour}
              className={styles.hourLabel}
              style={{ height: HOUR_ROW_HEIGHT }}
            >
              {label}
            </div>
          ))}
        </div>

        {/* Right: hour lines + appointment blocks */}
        <div className={styles.hourLines} style={{ height: timelineHeight }}>

          {/* Horizontal hour dividers */}
          {HOUR_LABELS.map(({ hour }) => (
            <div
              key={hour}
              className={styles.hourLine}
              style={{ top: `${((hour - TIMELINE_START_HOUR) / (TIMELINE_END_HOUR - TIMELINE_START_HOUR)) * 100}%` }}
            />
          ))}

          {/* "Now" indicator — only when viewing today */}
          {isToday(selectedDate) && (
            <div
              className={styles.nowLine}
              style={{ top: `${nowPct}%` }}
              aria-label="Current time"
            >
              <div className={styles.nowDot} />
            </div>
          )}

          {/* Appointment blocks */}
          {appointments.map((appt) => {
            const { top, height } = getBlockPosition(appt);
            const isSelected = appt.id === selectedApptId;

            return (
              <button
                key={appt.id}
                className={`
                  ${styles.block}
                  ${STATUS_COLORS[appt.status] ?? ''}
                  ${isSelected ? styles.blockSelected : ''}
                  ${appt.status === 'Cancelled' ? styles.blockCancelledOpacity : ''}
                `}
                style={{ top, height }}
                onClick={() => onAppointmentClick(appt)}
                aria-label={`${appt.patientFullName} at ${new Date(appt.startTimeUtc).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`}
                aria-pressed={isSelected}
              >
                <span className={styles.blockTime}>
                  {new Date(appt.startTimeUtc).toLocaleTimeString([], {
                    hour: '2-digit', minute: '2-digit',
                  })}
                </span>
                <span className={styles.blockName}>
                  {appt.patientFullName}
                </span>
                {appt.isTelehealth && (
                  <span className={styles.telehealthBadge} title="Telehealth">
                    {/* Video camera icon — pure SVG */}
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none"
                      stroke="currentColor" strokeWidth="2.5"
                      strokeLinecap="round" strokeLinejoin="round">
                      <polygon points="23 7 16 12 23 17 23 7" />
                      <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
                    </svg>
                  </span>
                )}
              </button>
            );
          })}

          {/* Empty state — shown inside the grid area */}
          {appointments.length === 0 && (
            <div className={styles.emptyState}>
              <p>No appointments scheduled</p>
              <p className={styles.emptyHint}>Enjoy your free day!</p>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}