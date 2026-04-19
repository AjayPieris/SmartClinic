import { useState, useEffect } from 'react';
import { getMyDoctorProfileApi, saveAvailabilityApi } from '../../api/doctorsApi';
import { Link } from 'react-router-dom';
import styles from './DoctorAvailability.module.css';

const DAYS_OF_WEEK = [
  { id: 1, label: 'Monday' },
  { id: 2, label: 'Tuesday' },
  { id: 3, label: 'Wednesday' },
  { id: 4, label: 'Thursday' },
  { id: 5, label: 'Friday' },
  { id: 6, label: 'Saturday' },
  { id: 0, label: 'Sunday' },
];

const DURATION_OPTIONS = [
  { value: 15, label: '15 minutes' },
  { value: 20, label: '20 minutes' },
  { value: 30, label: '30 minutes' },
  { value: 45, label: '45 minutes' },
  { value: 60, label: '1 hour' },
];

// ── Toggle switch UI component ────────────────────────────────────────────
function Toggle({ checked, onChange, disabled }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={onChange}
      disabled={disabled}
      className={`${styles.toggle} ${checked ? styles.toggleOn : ''}`}
    >
      <span className={styles.toggleThumb} />
    </button>
  );
}

// ── Delete icon ───────────────────────────────────────────────────────────
function TrashIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
      strokeWidth={1.8} stroke="currentColor" width="17" height="17">
      <path strokeLinecap="round" strokeLinejoin="round"
        d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
    </svg>
  );
}

export default function DoctorAvailability() {
  const [schedule, setSchedule] = useState({});
  const [duration, setDuration] = useState(30);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [verificationStatus, setVerificationStatus] = useState(null);

  // Sample stats — replace with real API data if available
  const [stats] = useState({ slots: 42, patients: 18, score: 94 });

  useEffect(() => {
    getMyDoctorProfileApi()
      .then((profile) => {
        setVerificationStatus(profile.verificationStatus);
        setDuration(profile.consultationDurationMinutes || 30);
        const parsed = JSON.parse(profile.availabilityJson || '[]');
        const map = {};
        parsed.forEach((w) => {
          map[w.DayOfWeek] = { enabled: true, start: w.StartTime, end: w.EndTime };
        });
        setSchedule(map);
      })
      .catch(() => showMessage('Could not load availability settings.', 'error'))
      .finally(() => setIsLoading(false));
  }, []);

  const showMessage = (text, type) => {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text: '', type: '' }), 4000);
  };

  const toggleDay = (dayId) => {
    setSchedule((prev) => ({
      ...prev,
      [dayId]: prev[dayId]?.enabled
        ? { enabled: false, start: '', end: '' }
        : { enabled: true, start: '09:00', end: '17:00' },
    }));
  };

  const clearDay = (dayId) => {
    setSchedule((prev) => {
      const next = { ...prev };
      delete next[dayId];
      return next;
    });
  };

  const handleTimeChange = (dayId, field, value) => {
    setSchedule((prev) => ({
      ...prev,
      [dayId]: { ...prev[dayId], [field]: value },
    }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setMessage({ text: '', type: '' });

    const availabilityArray = Object.entries(schedule)
      .filter(([, val]) => val.enabled)
      .map(([dayId, val]) => ({
        DayOfWeek: parseInt(dayId, 10),
        StartTime: val.start,
        EndTime: val.end,
      }));

    try {
      await saveAvailabilityApi(JSON.stringify(availabilityArray), parseInt(duration, 10));
      showMessage('Availability updated successfully.', 'success');
    } catch (err) {
      showMessage(err.response?.data?.message || 'Failed to save changes.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className={styles.page}>
        <div className="skeleton" style={{ width: 200, height: 32, marginBottom: 8, borderRadius: 8 }} />
        <div className="skeleton" style={{ width: 300, height: 20, marginBottom: 32, borderRadius: 8 }} />
        <div className="skeleton" style={{ height: 500, borderRadius: 16 }} />
      </div>
    );
  }

  const isVerified = verificationStatus === 'Approved';

  return (
    <div className={styles.page}>

      {/* ── Page header ── */}
      <header className={styles.header}>
        <h1 className={styles.pageTitle}>Availability Schedule</h1>
        <p className={styles.pageSubtitle}>Configure your clinical consultation hours and session rules.</p>
      </header>

      {/* ── Verification warning ── */}
      {!isVerified && (
        <div className={styles.warnBanner}>
          <span className={styles.warnIcon}>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
              strokeWidth={2} stroke="currentColor" width="18" height="18">
              <path strokeLinecap="round" strokeLinejoin="round"
                d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
            </svg>
          </span>
          <div>
            <p className={styles.warnTitle}>Account Not Verified</p>
            <p className={styles.warnText}>
              Your doctor profile is currently under review. Medical verification is required before you can publish or edit your availability schedule. This usually takes 24–48 hours.
            </p>
            <Link to="/doctor/profile" className={styles.warnLink}>
              View verification status →
            </Link>
          </div>
        </div>
      )}

      {/* ── Save message ── */}
      {message.text && (
        <div className={message.type === 'error' ? styles.errorMsg : styles.successMsg}>
          {message.type === 'error' ? '⚠ ' : '✓ '}{message.text}
        </div>
      )}

      {/* ── Form card ── */}
      <form
        onSubmit={handleSave}
        className={styles.formCard}
        style={{ opacity: isVerified ? 1 : 0.55, pointerEvents: isVerified ? 'auto' : 'none' }}
      >

        {/* Consultation Duration */}
        <section className={styles.section}>
          <div className={styles.sectionHeaderRow}>
            <div>
              <h2 className={styles.sectionTitle}>Consultation Duration</h2>
              <p className={styles.sectionHint}>This determines the length of bookable slots.</p>
            </div>
            <div className={styles.selectWrap}>
              <select
                className={styles.durationSelect}
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
              >
                {DURATION_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
              <svg className={styles.selectChevron} xmlns="http://www.w3.org/2000/svg" fill="none"
                viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" width="14" height="14">
                <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
              </svg>
            </div>
          </div>
        </section>

        <div className={styles.divider} />

        {/* Weekly Hours */}
        <section className={styles.section}>
          <div className={styles.weeklyHeader}>
            <div>
              <h2 className={styles.sectionTitle}>Weekly Hours</h2>
              <p className={styles.sectionHint}>Define your detailed working window for each day.</p>
            </div>
            <button type="button" className={styles.addDayBtn} onClick={() => {
              // Find first disabled day and enable it
              const firstOff = DAYS_OF_WEEK.find(d => !schedule[d.id]?.enabled);
              if (firstOff) toggleDay(firstOff.id);
            }}>
              + Add one-off day
            </button>
          </div>

          <div className={styles.daysList}>
            {DAYS_OF_WEEK.map((day) => {
              const isActive = !!schedule[day.id]?.enabled;
              return (
                <div key={day.id} className={`${styles.dayRow} ${isActive ? styles.dayRowActive : ''}`}>
                  {/* Toggle + label */}
                  <div className={styles.dayLeft}>
                    <Toggle
                      checked={isActive}
                      onChange={() => toggleDay(day.id)}
                    />
                    <span className={`${styles.dayLabel} ${isActive ? styles.dayLabelOn : ''}`}>
                      {day.label}
                    </span>
                  </div>

                  {/* Time pickers or unavailable */}
                  {isActive ? (
                    <div className={styles.timeRow}>
                      <input
                        type="time"
                        className={styles.timeInput}
                        value={schedule[day.id]?.start || '09:00'}
                        onChange={(e) => handleTimeChange(day.id, 'start', e.target.value)}
                        required
                      />
                      <span className={styles.timeSep}>to</span>
                      <input
                        type="time"
                        className={styles.timeInput}
                        value={schedule[day.id]?.end || '17:00'}
                        onChange={(e) => handleTimeChange(day.id, 'end', e.target.value)}
                        required
                      />
                      <button
                        type="button"
                        className={styles.clearBtn}
                        onClick={() => clearDay(day.id)}
                        title={`Remove ${day.label}`}
                        aria-label={`Remove ${day.label}`}
                      >
                        <TrashIcon />
                      </button>
                    </div>
                  ) : (
                    <span className={styles.unavailable}>— Unavailable —</span>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* Save button */}
        <div className={styles.saveRow}>
          <button type="submit" className={styles.saveBtn} disabled={isSaving}>
            {isSaving ? (
              <>
                <svg className={styles.spinner} xmlns="http://www.w3.org/2000/svg" fill="none"
                  viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" width="16" height="16">
                  <path strokeLinecap="round" strokeLinejoin="round"
                    d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
                </svg>
                Saving…
              </>
            ) : (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
                  strokeWidth={2} stroke="currentColor" width="16" height="16">
                  <path strokeLinecap="round" strokeLinejoin="round"
                    d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                </svg>
                Save schedule
              </>
            )}
          </button>
          <p className={styles.saveNote}>
            Saving your schedule will immediately affect when patients can book appointments.
            Existing appointments will not be affected.
          </p>
        </div>

      </form>

      {/* ── Stats strip ── */}
      <div className={styles.statsStrip}>
        <div className={styles.statItem}>
          <span className={styles.statIcon}>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
              strokeWidth={1.8} stroke="currentColor" width="22" height="22">
              <path strokeLinecap="round" strokeLinejoin="round"
                d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
            </svg>
          </span>
          <span className={styles.statValue}>{stats.slots}</span>
          <span className={styles.statLabel}>Slots per week</span>
        </div>
        <div className={styles.statDivider} />
        <div className={styles.statItem}>
          <span className={styles.statIcon}>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
              strokeWidth={1.8} stroke="currentColor" width="22" height="22">
              <path strokeLinecap="round" strokeLinejoin="round"
                d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" />
            </svg>
          </span>
          <span className={styles.statValue}>{stats.patients}</span>
          <span className={styles.statLabel}>Active patients</span>
        </div>
        <div className={styles.statDivider} />
        <div className={styles.statItem}>
          <span className={styles.statIcon}>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
              strokeWidth={1.8} stroke="currentColor" width="22" height="22">
              <path strokeLinecap="round" strokeLinejoin="round"
                d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
            </svg>
          </span>
          <span className={styles.statValue}>{stats.score}%</span>
          <span className={styles.statLabel}>Profile score</span>
        </div>
      </div>

    </div>
  );
}