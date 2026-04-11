import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { loginApi } from "../../api/authApi";
import styles from "./AuthPage.module.css";

import leftBg from "../../assets/Left.png";
import smartClinicLogo from "../../assets/SmartClinicLogo.png";

export default function LoginPage() {
  const { login, isAuthenticated, user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isAuthenticated && user) {
      const roleRoutes = {
        Patient: "/patient/appointments",
        Doctor: "/doctor/schedule",
        Admin: "/admin/users",
      };
      navigate(roleRoutes[user.role] ?? "/", { replace: true });
    }
  }, [isAuthenticated, user, navigate]);

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    if (error) setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");
    try {
      const authResponse = await loginApi(formData);
      login(authResponse);
      const intendedDestination = location.state?.from?.pathname;
      if (intendedDestination && intendedDestination !== "/login") {
        navigate(intendedDestination, { replace: true });
      }
    } catch (err) {
      if (err.response?.data?.errors) {
        const validationErrors = Object.values(err.response.data.errors).flat();
        setError(validationErrors[0] || "Invalid email or password.");
      } else {
        setError(
          err.response?.data?.message ??
            "Unable to sign in. Please check your connection and try again.",
        );
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
            Precision in Care,<br />Driven by Intelligence.
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
            <h1 className={styles.authTitle}>Sign In</h1>
            <p className={styles.authSubtitle}>Welcome back — enter your credentials below.</p>
          </div>

          {error && (
            <div className={styles.errorBanner} role="alert">{error}</div>
          )}

          <form onSubmit={handleSubmit} noValidate>
            <div className={styles.formGroup}>
              <label htmlFor="email" className={styles.label}>Email Address</label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={formData.email}
                onChange={handleChange}
                className={styles.input}
                placeholder="john.doe@clinic.com"
                disabled={isSubmitting}
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="password" className={styles.label}>Password</label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={formData.password}
                onChange={handleChange}
                className={styles.input}
                placeholder="••••••••"
                disabled={isSubmitting}
              />
            </div>

            <button
              type="submit"
              className={styles.submitBtn}
              disabled={isSubmitting || !formData.email || !formData.password}
            >
              {isSubmitting && <span className={styles.btnSpinner} aria-hidden="true" />}
              {isSubmitting ? "Signing in…" : "Sign In →"}
            </button>
          </form>

          <p className={styles.authFooter}>
            Don't have an account? <Link to="/register">Create one</Link>
          </p>
        </div>
      </div>

    </div>
  );
}
