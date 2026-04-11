import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { registerApi } from "../../api/authApi";
import styles from "./AuthPage.module.css";

import leftBg from "../../assets/Left.png";
import smartClinicLogo from "../../assets/SmartClinicLogo.png";
import doctorIcon from "../../assets/doctor-visit.png";
import patientIcon from "../../assets/user.png";

const ROLES = [
  { value: "Patient", label: "Patient", img: patientIcon },
  { value: "Doctor",  label: "Doctor",  img: doctorIcon  },
];

export default function RegisterPage() {
  const { login } = useAuth();

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    role: "Patient",
    specialization: "",
    licenseNumber: "",
  });
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    if (error) setError("");
  };

  const handleRoleSelect = (role) => setFormData((prev) => ({ ...prev, role }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");

    if (formData.password.length < 8) {
      setError("Password must be at least 8 characters.");
      setIsSubmitting(false);
      return;
    }

    try {
      const payload = {
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        email: formData.email.trim(),
        password: formData.password,
        role: formData.role,
        ...(formData.role === "Doctor" && {
          specialization: formData.specialization.trim(),
          licenseNumber: formData.licenseNumber.trim(),
        }),
      };
      const authResponse = await registerApi(payload);
      login(authResponse);
    } catch (err) {
      if (err.response?.data?.errors) {
        const validationErrors = Object.values(err.response.data.errors).flat();
        setError(validationErrors[0] || "Registration failed. Please try again.");
      } else {
        setError(err.response?.data?.message ?? "Registration failed. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.authPage}>

      {/* ── Left panel ── */}
      <div className={styles.authLeft}>
        <img src={leftBg} alt="" className={styles.authLeftBg} aria-hidden="true" />
        <div className={styles.authLeftOverlay} />
        <div className={styles.authLeftContent}>
          <h2 className={styles.authLeftHeading}>
            Step into your<br />Clinical Sanctuary.
          </h2>
          <p className={styles.authLeftText}>
            Join the next generation of healthcare management. Our sanctuary of
            clinical data ensures you stay focused on what matters most: human
            connection.
          </p>
        </div>
      </div>

      {/* ── Right panel ── */}
      <div className={styles.authRight}>
        {/* Liquid blobs */}
        <div className={styles.blob3} />

        <div className={styles.authCard}>

          {/* Logo — stacked vertically */}
          <div className={styles.logoBlock}>
            <img src={smartClinicLogo} alt="SmartClinic" className={styles.brandLogoImg} />
            <span className={`brand-heading ${styles.brandLogo}`}>SmartClinic</span>
          </div>

          {/* Heading */}
          <div className={styles.authHeader}>
            <h1 className={styles.authTitle}>Create Account</h1>
            <p className={styles.authSubtitle}>Step into your clinical sanctuary.</p>
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
                    className={`${styles.roleOption} ${formData.role === r.value ? styles.selected : ""}`}
                    onClick={() => handleRoleSelect(r.value)}
                  >
                    <div className={styles.roleIcon}>
                      <img src={r.img} alt={r.label} className={styles.roleImg} />
                    </div>
                    <div className={styles.roleName}>{r.label}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Name row */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.6rem" }}>
              <div className={styles.formGroup}>
                <label htmlFor="firstName" className={styles.label}>First Name</label>
                <input
                  id="firstName" name="firstName" type="text" required
                  value={formData.firstName} onChange={handleChange}
                  className={styles.input} placeholder="John" disabled={isSubmitting}
                />
              </div>
              <div className={styles.formGroup}>
                <label htmlFor="lastName" className={styles.label}>Last Name</label>
                <input
                  id="lastName" name="lastName" type="text" required
                  value={formData.lastName} onChange={handleChange}
                  className={styles.input} placeholder="Doe" disabled={isSubmitting}
                />
              </div>
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="email" className={styles.label}>Email Address</label>
              <input
                id="email" name="email" type="email" autoComplete="email" required
                value={formData.email} onChange={handleChange}
                className={styles.input} placeholder="john.doe@clinic.com" disabled={isSubmitting}
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="password" className={styles.label}>Password</label>
              <input
                id="password" name="password" type="password" autoComplete="new-password" required
                value={formData.password} onChange={handleChange}
                className={styles.input} placeholder="Min. 8 chars, 1 uppercase, 1 number"
                disabled={isSubmitting}
              />
            </div>

            {/* Doctor-only fields */}
            {formData.role === "Doctor" && (
              <div className={styles.extraFields}>
                <p className={styles.extraFieldsLabel}>Doctor Details</p>
                <div className={styles.formGroup}>
                  <label htmlFor="specialization" className={styles.label}>Medical Specialization</label>
                  <input
                    id="specialization" name="specialization" type="text" required
                    value={formData.specialization} onChange={handleChange}
                    className={styles.input} placeholder="e.g. Cardiology" disabled={isSubmitting}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label htmlFor="licenseNumber" className={styles.label}>License Number</label>
                  <input
                    id="licenseNumber" name="licenseNumber" type="text" required
                    value={formData.licenseNumber} onChange={handleChange}
                    className={styles.input} placeholder="e.g. MD-8829-21" disabled={isSubmitting}
                  />
                </div>
              </div>
            )}

            <button
              type="submit"
              className={styles.submitBtn}
              disabled={isSubmitting || !formData.email || !formData.password}
            >
              {isSubmitting && <span className={styles.btnSpinner} aria-hidden="true" />}
              {isSubmitting ? "Creating account…" : "Create Account →"}
            </button>
          </form>

          <p className={styles.authFooter}>
            Already have an account? <Link to="/login">Sign in</Link>
          </p>
        </div>
      </div>

    </div>
  );
}
