import { useEffect, useState } from 'react';
import { isToday } from 'date-fns';
import styles from './ScheduleTimeline.module.css';

const HOUR_ROW_HEIGHT = 80;

const STATUS_COLORS = {
  Pending: styles.blockPending,
  Confirmed: styles.blockConfirmed,
  Completed: styles.blockCompleted,
  Cancelled: styles.blockCancelled,
};

export default function ScheduleTimeline({
  appointments,
  availability = [],
  selectedDate,
  selectedApptId,
  isLoading,
  onAppointmentClick,
}) {
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (!isToday(selectedDate)) return;
    const interval = setInterval(() => setTick((t) => t + 1), 60_000);
    return () => clearInterval(interval);
  }, [selectedDate]);

  const timelineHeight = isLoading ? 0 : 0; // will be calculated below

  if (isLoading) {
    return (
      <div className={styles.skeletonWrap}>
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            className={styles.skeleton}
            style={{ marginTop: i === 0 ? '1rem' : '0.5rem', height: `${60 + i * 15}px` }}
          />
        ))}
      </div>
    );
  }

  // 1. Calculate dynamic bounds based on availability
  let startHour = 8;
  let endHour = 17;

  const dayOfWeek = selectedDate.getDay();
  const dayAvailability = availability.find((a) => a.DayOfWeek === dayOfWeek);

  if (dayAvailability) {
    const [startH] = dayAvailability.StartTime.split(':').map(Number);
    const [endH] = dayAvailability.EndTime.split(':').map(Number);
    startHour = startH;
    endHour = endH;
  } else if (appointments.length > 0) {
    // Fallback if no availability exists but appointments do
    const minH = Math.min(...appointments.map(a => new Date(a.startTimeUtc).getHours()));
    const maxH = Math.max(...appointments.map(a => new Date(a.endTimeUtc).getHours()));
    startHour = Math.max(0, minH - 1);
    endHour = Math.min(24, maxH + 2);
  }

  const TOTAL_MINUTES = (endHour - startHour) * 60;
  
  // 2. Generate labels
  const hourLabels = Array.from(
    { length: endHour - startHour },
    (_, i) => {
      const hour = startHour + i;
      const ampm = hour < 12 ? 'AM' : 'PM';
      const h = hour % 12 || 12;
      return { hour, label: `${h} ${ampm}` };
    }
  );

  const calculatedHeight = hourLabels.length * HOUR_ROW_HEIGHT;

  // 3. Helper to position blocks
  const getBlockPosition = (appointment) => {
    const start = new Date(appointment.startTimeUtc);
    const end = new Date(appointment.endTimeUtc);

    const startMinutes = start.getHours() * 60 + start.getMinutes();
    const endMinutes = end.getHours() * 60 + end.getMinutes();

    const offsetStart = startMinutes - startHour * 60;
    const durationMinutes = endMinutes - startMinutes;

    const topPct = (offsetStart / TOTAL_MINUTES) * 100;
    const heightPct = (durationMinutes / TOTAL_MINUTES) * 100;

    return {
      top: `${Math.max(0, topPct)}%`,
      height: `${Math.max(1.5, heightPct)}%`,
    };
  };

  // 4. Calculate "now" line
  let nowPct = -1;
  if (isToday(selectedDate)) {
    const now = new Date();
    const nowMinutes = now.getHours() * 60 + now.getMinutes();
    const offsetMinutes = nowMinutes - startHour * 60;
    nowPct = (offsetMinutes / TOTAL_MINUTES) * 100;
    // Don't cap at 0/100 here if we want to completely hide it when outside bounds
    // but capping is safer if we want it pinned to top/bottom
  }

  return (
    <div className={styles.wrapper}>
      <div className={styles.timeline}>
        <div className={styles.grid} style={{ height: calculatedHeight }}>
          
          <div className={styles.hourLabels}>
            {hourLabels.map(({ hour, label }) => (
              <div key={hour} className={styles.hourLabel} style={{ height: HOUR_ROW_HEIGHT }}>
                <span>{label}</span>
              </div>
            ))}
          </div>

          <div className={styles.hourLines} style={{ height: calculatedHeight }}>
            {hourLabels.map(({ hour }) => (
              <div
                key={hour}
                className={styles.hourLine}
                style={{ top: `${((hour - startHour) / (endHour - startHour)) * 100}%` }}
              />
            ))}

            {isToday(selectedDate) && nowPct >= 0 && nowPct <= 100 && (
              <div className={styles.nowLine} style={{ top: `${nowPct}%` }}>
                <div className={styles.nowDot} />
              </div>
            )}

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
                >
                  <div className={styles.accentLine}></div>

                  <div className={styles.blockInner}>
                    <div className={styles.profileAvatar}>
                      {appt.patientProfilePictureUrl ? (
                        <img src={appt.patientProfilePictureUrl} alt={appt.patientFullName} />
                      ) : (
                        <div className={styles.avatarFallback}>{appt.patientFullName?.charAt(0) ?? '?'}</div>
                      )}
                    </div>

                    <div className={styles.blockContent}>
                      <span className={styles.blockName}>{appt.patientFullName}</span>
                      <div className={styles.blockMeta}>
                        <span className={styles.blockTime}>
                          {new Date(appt.startTimeUtc).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        {appt.isTelehealth && (
                          <span className={styles.telehealthBadge}>
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                              <polygon points="23 7 16 12 23 17 23 7" />
                              <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
                            </svg>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}

            {appointments.length === 0 && (
              <div className={styles.emptyState}>
                <div className={styles.emptyIcon}>
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="rgba(0,0,0,0.15)" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                </div>
                <p>No appointments scheduled</p>
                <p className={styles.emptyHint}>Enjoy your free day!</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}