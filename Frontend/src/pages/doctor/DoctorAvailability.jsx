import { useState, useEffect } from 'react';
import { getMyDoctorProfileApi, saveAvailabilityApi } from '../../api/doctorsApi';
import { useAuth } from '../../context/AuthContext';
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

export default function DoctorAvailability() {
  const { user } = useAuth();
  const [schedule, setSchedule] = useState({});
  const [duration, setDuration] = useState(30);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });

  useEffect(() => {
    // Flatten loaded json into local schedule state
    getMyDoctorProfileApi()
      .then((profile) => {
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

    // Format for backend
    const availabilityArray = Object.entries(schedule)
      .filter(([_, val]) => val.enabled)
      .map(([dayId, val]) => ({
        DayOfWeek: parseInt(dayId, 10),
        StartTime: val.start,
        EndTime: val.end,
      }));

    try {
      await saveAvailabilityApi(
        JSON.stringify(availabilityArray),
        parseInt(duration, 10)
      );
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
         <div className="skeleton" style={{ width: 140, height: 28, marginBottom: 16 }} />
         <div className="skeleton card" style={{ height: 400 }} />
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <h1 className="page-title">Availability schedule</h1>

      {message.text && (
        <div className={message.type === 'error' ? 'error-banner' : 'success-banner'}>
          {message.text}
        </div>
      )}

      <form onSubmit={handleSave} className={`card ${styles.formCard}`}>
        <div className={styles.durationSection}>
          <label className={styles.label}>Consultation Duration (minutes)</label>
          <select
            className="input"
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
            style={{ maxWidth: 200 }}
          >
            <option value="15">15 mins</option>
            <option value="20">20 mins</option>
            <option value="30">30 mins</option>
            <option value="45">45 mins</option>
            <option value="60">1 hour</option>
          </select>
          <p className={styles.hint}>This determines the length of bookable slots.</p>
        </div>

        <div className={styles.daysSection}>
          <p className={styles.label}>Weekly hours</p>
          <div className={styles.daysList}>
            {DAYS_OF_WEEK.map((day) => {
              const isActive = schedule[day.id]?.enabled;
              return (
                <div key={day.id} className={`${styles.dayRow} ${isActive ? styles.activeDay : ''}`}>
                  <label className={styles.dayToggle}>
                    <input
                      type="checkbox"
                      checked={!!isActive}
                      onChange={() => toggleDay(day.id)}
                    />
                    <span>{day.label}</span>
                  </label>

                  {isActive ? (
                    <div className={styles.timeInputs}>
                      <input
                        type="time"
                        className="input"
                        value={schedule[day.id].start}
                        onChange={(e) => handleTimeChange(day.id, 'start', e.target.value)}
                        required
                      />
                      <span>to</span>
                      <input
                        type="time"
                        className="input"
                        value={schedule[day.id].end}
                        onChange={(e) => handleTimeChange(day.id, 'end', e.target.value)}
                        required
                      />
                    </div>
                  ) : (
                    <span className={styles.unavailableText}>Unavailable</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className={styles.footer}>
          <button type="submit" className="btn-primary" disabled={isSaving}>
            {isSaving ? 'Saving...' : 'Save schedule'}
          </button>
        </div>
      </form>
    </div>
  );
}