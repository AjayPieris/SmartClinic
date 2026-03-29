

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { registerApi } from '../../api/authApi';
import styles from './AuthPage.module.css';

const ROLES = [
  { value: 'Patient', label: 'Patient', icon: '🧑‍⚕️' },
  { value: 'Doctor',  label: 'Doctor',  icon: '👨‍⚕️' },
];

export default function RegisterPage() {
  const { login } = useAuth();

  const [formData, setFormData] = useState({
    firstName: '', lastName: '', email: '', password: '',
    role: 'Patient',
    specialization: '', licenseNumber: '',
  });
  const [error,        setError]        = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    if (error) setError('');
  };

  const handleRoleSelect = (role) => {
    setFormData((prev) => ({ ...prev, role }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    // Client-side password check (server also validates)
    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters.');
      setIsSubmitting(false);
      return;
    }

    try {
      // Only include doctor fields if the role is Doctor
      const payload = {
        firstName: formData.firstName.trim(),
        lastName:  formData.lastName.trim(),
        email:     formData.email.trim(),
        password:  formData.password,
        role:      formData.role,
        ...(formData.role === 'Doctor' && {
          specialization: formData.specialization.trim(),
          licenseNumber:  formData.licenseNumber.trim(),
        }),
      };

      const authResponse = await registerApi(payload);

      // Same as login — saves token, updates context, navigates to dashboard
      login(authResponse);
    } catch (err) {
      setError(
        err.response?.data?.message ??
        'Registration failed. Please try again.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.authPage}>
      <div className={styles.authCard}>

        <div className={styles.authHeader}>
          <h1 className={`brand-heading ${styles.brandLogo}`}>SmartClinic</h1>
          <p className={styles.authSubtitle}>Create your account</p>
        </div>

        {error && (
          <div className={styles.errorBanner} role="alert">{error}</div>
        )}

        <form onSubmit={handleSubmit} noValidate>

          {/* Role selector */}
          <div className={styles.formGroup}>
            <p className={styles.label}>I am a...</p>
            <div className={styles.roleGrid}>
              {ROLES.map((r) => (
                <button
                  key={r.value}
                  type="button"
                  className={`${styles.roleOption} ${formData.role === r.value ? styles.selected : ''}`}
                  onClick={() => handleRoleSelect(r.value)}
                >
                  <div className={styles.roleIcon}>{r.icon}</div>
                  <div className={styles.roleName}>{r.label}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Name row */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className={styles.formGroup}>
              <label htmlFor="firstName" className={styles.label}>First name</label>
              <input id="firstName" name="firstName" type="text" required
                value={formData.firstName} onChange={handleChange}
                className={styles.input} placeholder="Jane" disabled={isSubmitting} />
            </div>
            <div className={styles.formGroup}>
              <label htmlFor="lastName" className={styles.label}>Last name</label>
              <input id="lastName" name="lastName" type="text" required
                value={formData.lastName} onChange={handleChange}
                className={styles.input} placeholder="Smith" disabled={isSubmitting} />
            </div>
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="email" className={styles.label}>Email address</label>
            <input id="email" name="email" type="email" autoComplete="email" required
              value={formData.email} onChange={handleChange}
              className={styles.input} placeholder="you@example.com" disabled={isSubmitting} />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="password" className={styles.label}>Password</label>
            <input id="password" name="password" type="password"
              autoComplete="new-password" required
              value={formData.password} onChange={handleChange}
              className={styles.input} placeholder="Min. 8 chars, 1 uppercase, 1 number"
              disabled={isSubmitting} />
          </div>

          {/* Doctor-only fields — shown conditionally */}
          {formData.role === 'Doctor' && (
            <div className={styles.extraFields}>
              <p className={styles.extraFieldsLabel}>Doctor details</p>
              <div className={styles.formGroup}>
                <label htmlFor="specialization" className={styles.label}>Specialization</label>
                <input id="specialization" name="specialization" type="text" required
                  value={formData.specialization} onChange={handleChange}
                  className={styles.input} placeholder="e.g. General Practitioner"
                  disabled={isSubmitting} />
              </div>
              <div className={styles.formGroup}>
                <label htmlFor="licenseNumber" className={styles.label}>License number</label>
                <input id="licenseNumber" name="licenseNumber" type="text" required
                  value={formData.licenseNumber} onChange={handleChange}
                  className={styles.input} placeholder="e.g. SL-MED-12345"
                  disabled={isSubmitting} />
              </div>
            </div>
          )}

          <button type="submit" className={styles.submitBtn}
            disabled={isSubmitting || !formData.email || !formData.password}>
            {isSubmitting && <span className={styles.btnSpinner} aria-hidden="true" />}
            {isSubmitting ? 'Creating account…' : 'Create account'}
          </button>

        </form>

        <p className={styles.authFooter}>
          Already have an account? <Link to="/login">Sign in</Link>
        </p>

      </div>
    </div>
  );
}