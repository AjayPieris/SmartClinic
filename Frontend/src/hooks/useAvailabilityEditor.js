

import { useState, useEffect, useCallback, useMemo } from 'react';
import { getMyDoctorProfileApi, saveAvailabilityApi } from '../api/doctorsApi';

// Default time window for a newly enabled day
const DEFAULT_START = '09:00';
const DEFAULT_END   = '17:00';

// Build a blank 7-day schedule
function buildBlankSchedule() {
  return Array.from({ length: 7 }, (_, i) => ({
    dayOfWeek: i,
    enabled:   false,
    startTime: DEFAULT_START,
    endTime:   DEFAULT_END,
    error:     '',  // inline validation message
  }));
}

// Parse AvailabilityJson from the API into the 7-day working shape
function parseSchedule(availabilityJson) {
  const blank = buildBlankSchedule();

  try {
    const saved = JSON.parse(availabilityJson);
    if (!Array.isArray(saved)) return blank;

    saved.forEach((w) => {
      if (w.dayOfWeek >= 0 && w.dayOfWeek <= 6) {
        blank[w.dayOfWeek] = {
          dayOfWeek: w.dayOfWeek,
          enabled:   true,
          startTime: w.startTime ?? DEFAULT_START,
          endTime:   w.endTime   ?? DEFAULT_END,
          error:     '',
        };
      }
    });
  } catch {
    // Return blank schedule if JSON is malformed
  }

  return blank;
}

// Serialize the 7-day working shape back into AvailabilityJson
function serializeSchedule(schedule) {
  const enabled = schedule
    .filter((d) => d.enabled)
    .map(({ dayOfWeek, startTime, endTime }) => ({ dayOfWeek, startTime, endTime }));
  return JSON.stringify(enabled);
}

export default function useAvailabilityEditor() {
  const [schedule,             setSchedule]             = useState(buildBlankSchedule);
  const [savedScheduleJson,    setSavedScheduleJson]    = useState('[]');
  const [consultationDuration, setConsultationDuration] = useState(30);
  const [savedDuration,        setSavedDuration]        = useState(30);
  const [isLoading,            setIsLoading]            = useState(true);
  const [isSaving,             setIsSaving]             = useState(false);
  const [error,                setError]                = useState('');
  const [successMsg,           setSuccessMsg]           = useState('');

  // ── isDirty: true if working state differs from last saved state ─────────
  const isDirty = useMemo(() => {
    const currentJson = serializeSchedule(schedule);
    return currentJson !== savedScheduleJson ||
           consultationDuration !== savedDuration;
  }, [schedule, savedScheduleJson, consultationDuration, savedDuration]);

  // ── Load doctor's profile on mount ───────────────────────────────────────
  useEffect(() => {
    const load = async () => {
      try {
        const profile = await getMyDoctorProfileApi();
        const parsed  = parseSchedule(profile.availabilityJson ?? '[]');
        setSchedule(parsed);
        setSavedScheduleJson(profile.availabilityJson ?? '[]');
        setConsultationDuration(profile.consultationDurationMinutes ?? 30);
        setSavedDuration(profile.consultationDurationMinutes ?? 30);
      } catch {
        setError('Could not load your availability. Please refresh.');
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, []);

  // ── Toggle a day on/off ──────────────────────────────────────────────────
  const toggleDay = useCallback((dayOfWeek) => {
    setSchedule((prev) =>
      prev.map((d) =>
        d.dayOfWeek === dayOfWeek
          ? { ...d, enabled: !d.enabled, error: '' }
          : d
      )
    );
  }, []);

  // ── Update start or end time for a day ───────────────────────────────────
  const setDayTime = useCallback((dayOfWeek, field, value) => {
    setSchedule((prev) =>
      prev.map((d) => {
        if (d.dayOfWeek !== dayOfWeek) return d;

        const updated = { ...d, [field]: value, error: '' };

        // Inline validation: end must be after start
        const [sh, sm] = updated.startTime.split(':').map(Number);
        const [eh, em] = updated.endTime.split(':').map(Number);
        const startMins = sh * 60 + sm;
        const endMins   = eh * 60 + em;

        if (endMins <= startMins) {
          updated.error = 'End time must be after start time.';
        }

        return updated;
      })
    );
  }, []);

  // ── Reset to last saved state ────────────────────────────────────────────
  const resetToSaved = useCallback(() => {
    setSchedule(parseSchedule(savedScheduleJson));
    setConsultationDuration(savedDuration);
    setError('');
  }, [savedScheduleJson, savedDuration]);

  // ── Save to API ──────────────────────────────────────────────────────────
  const save = useCallback(async () => {
    // Block save if any day has a validation error
    const hasErrors = schedule.some((d) => d.enabled && d.error);
    if (hasErrors) {
      setError('Please fix the time errors before saving.');
      return;
    }

    setIsSaving(true);
    setError('');

    const json = serializeSchedule(schedule);

    try {
      await saveAvailabilityApi(json, consultationDuration);

      // Update saved snapshot so isDirty resets to false
      setSavedScheduleJson(json);
      setSavedDuration(consultationDuration);

      setSuccessMsg('Schedule saved successfully!');
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      setError(
        err.response?.data?.message ?? 'Save failed. Please try again.'
      );
    } finally {
      setIsSaving(false);
    }
  }, [schedule, consultationDuration]);

  return {
    schedule,
    consultationDuration,
    setConsultationDuration,
    isLoading,
    isSaving,
    isDirty,
    error, setError,
    successMsg,
    toggleDay,
    setDayTime,
    resetToSaved,
    save,
  };
}