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
                <p className={styles.name} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span>Dr. {doctor.fullName}</span>
                  {doctor.isVerified && (
                    <svg title="Verified Doctor" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" style={{ width: 18, height: 18, color: '#0095f6' }}>
                      <path fillRule="evenodd" d="M8.603 3.799A4.49 4.49 0 0112 2.25c1.357 0 2.573.6 3.397 1.549a4.49 4.49 0 013.498 1.307 4.491 4.491 0 011.307 3.497A4.49 4.49 0 0121.75 12a4.49 4.49 0 01-1.549 3.397 4.491 4.491 0 01-1.307 3.497 4.491 4.491 0 01-3.497 1.307A4.49 4.49 0 0112 21.75a4.49 4.49 0 01-3.397-1.549 4.49 4.49 0 01-3.498-1.306 4.491 4.491 0 01-1.307-3.498A4.49 4.49 0 012.25 12c0-1.357.6-2.573 1.549-3.397a4.49 4.49 0 011.307-3.497 4.49 4.49 0 013.497-1.307zm7.007 6.387a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z" clipRule="evenodd" />
                    </svg>
                  )}
                </p>
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