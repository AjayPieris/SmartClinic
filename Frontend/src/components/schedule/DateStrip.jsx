import { isSameDay, isToday, format } from 'date-fns';
import styles from './DateStrip.module.css';

export default function DateStrip({
  weekDates,
  selectedDate,
  onDateSelect,
  onPrevWeek,
  onNextWeek,
  allAppointments,
}) {
  const apptCountByDate = allAppointments.reduce((acc, a) => {
    const key = format(new Date(a.startTimeUtc), 'yyyy-MM-dd');
    acc[key] = (acc[key] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <div className={styles.wrapper}>
      <div className={styles.strip}>
        <button className={styles.navBtn} onClick={onPrevWeek} aria-label="Previous week">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
        </button>

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
                  ${styles.dayPill}
                  ${isSelected ? styles.selectedPill : ''}
                  ${isCurrentDay && !isSelected ? styles.todayPill : ''}
                `}
                onClick={() => onDateSelect(date)}
                aria-pressed={isSelected}
              >
                <div className={styles.dayTop}>
                  <span className={styles.dayName}>{format(date, 'EEE')}</span>
                </div>
                <span className={styles.dayNum}>{format(date, 'd')}</span>
                <div className={styles.indicatorWrap}>
                  {hasAppts ? (
                    <span className={styles.dot}><span className={styles.dotCount}>{count > 9 ? '9+' : count}</span></span>
                  ) : (
                    <span className={styles.dotEmpty}></span>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        <button className={styles.navBtn} onClick={onNextWeek} aria-label="Next week">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
        </button>
      </div>
    </div>
  );
}