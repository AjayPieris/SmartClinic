import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { loginApi } from "../../api/authApi";
import styles from "./AuthPage.module.css";

export default function LoginPage() {
  const { login, isAuthenticated, user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // If somehow already authenticated (e.g. navigated to /login directly),
  // redirect to their dashboard immediately
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
    // Clear the error when the user starts typing again
    if (error) setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");

    try {
      const authResponse = await loginApi(formData);

      // login() saves to localStorage, updates context, and navigates to dashboard
      login(authResponse);

      // If user was sent to /login from a protected route, go back there
      const intendedDestination = location.state?.from?.pathname;
      if (intendedDestination && intendedDestination !== "/login") {
        navigate(intendedDestination, { replace: true });
      }
      // Otherwise login() handles the navigation to their dashboard
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
      <div className={styles.authCard}>
        {/* Brand logo / heading */}
        <div className={styles.authHeader}>
          <h1 className={`brand-heading ${styles.brandLogo}`}>SmartClinic</h1>
          <p className={styles.authSubtitle}>Sign in to your account</p>
        </div>

        {/* Error banner */}
        {error && (
          <div className={styles.errorBanner} role="alert">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate>
          <div className={styles.formGroup}>
            <label htmlFor="email" className={styles.label}>
              Email address
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={formData.email}
              onChange={handleChange}
              className={styles.input}
              placeholder="you@example.com"
              disabled={isSubmitting}
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="password" className={styles.label}>
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              value={formData.password}
              onChange={handleChange}
              className={styles.input}
              placeholder="Your password"
              disabled={isSubmitting}
            />
          </div>

          <button
            type="submit"
            className={styles.submitBtn}
            disabled={isSubmitting || !formData.email || !formData.password}
          >
            {isSubmitting ? (
              <span className={styles.btnSpinner} aria-hidden="true" />
            ) : null}
            {isSubmitting ? "Signing in…" : "Sign in"}
          </button>
        </form>

        <p className={styles.authFooter}>
          Don't have an account? <Link to="/register">Create one</Link>
        </p>
      </div>
    </div>
  );
}
