// =============================================================================
// src/components/booking/DoctorPicker.jsx — Step 1: choose a doctor.
//
// Features:
//   - Search/filter by name or specialization
//   - Shows profile picture, name, specialization, consultation duration
//   - Skeleton loading cards while the API call completes
// =============================================================================

import { useState } from 'react';
import styles from './DoctorPicker.module.css';

export default function DoctorPicker({ doctors, isLoading, onSelect }) {
  const [search, setSearch] = useState('');

  const filtered = doctors.filter((d) => {
    const q = search.toLowerCase();
    return (
      d.fullName.toLowerCase().includes(q) ||
      d.specialization.toLowerCase().includes(q)
    );
  });

  if (isLoading) {
    return (
      <div className={styles.grid}>
        {[...Array(6)].map((_, i) => (
          <div key={i} className={styles.skeleton} />
        ))}
      </div>
    );
  }

  return (
    <div className={styles.wrap}>
      <input
        type="search"
        className={styles.search}
        placeholder="Search by name or specialization…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        aria-label="Search doctors"
      />

      {filtered.length === 0 ? (
        <p className={styles.empty}>No doctors match your search.</p>
      ) : (
        <div className={styles.grid}>
          {filtered.map((doctor) => (
            <button
              key={doctor.id}
              className={styles.card}
              onClick={() => onSelect(doctor)}
              aria-label={`Select Dr. ${doctor.fullName}`}
            >
              {/* Avatar */}
              <div className={styles.avatarWrap}>
                {doctor.profilePictureUrl ? (
                  <img
                    src={doctor.profilePictureUrl}
                    alt={doctor.fullName}
                    className={styles.avatar}
                  />
                ) : (
                  <div className={styles.avatarFallback}>
                    {doctor.fullName.charAt(0)}
                  </div>
                )}
              </div>

              {/* Info */}
              <div className={styles.info}>
                <p className={styles.name}>Dr. {doctor.fullName}</p>
                <p className={styles.spec}>{doctor.specialization}</p>
                <p className={styles.duration}>
                  {doctor.consultationDurationMinutes} min consultations
                </p>
                {doctor.bio && (
                  <p className={styles.bio}>{doctor.bio}</p>
                )}
              </div>

              {/* Select indicator */}
              <div className={styles.selectArrow} aria-hidden="true">›</div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}