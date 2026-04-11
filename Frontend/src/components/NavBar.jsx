import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import styles from './NavBar.module.css';

import smartClinicLogo from '../assets/SmartClinicLogo.png';

// Nav link definitions per role — drives what appears in the header
const NAV_LINKS = {
  Patient: [
    { to: '/patient/appointments', label: 'My Appointments' },
    { to: '/patient/book',         label: 'Book a Visit'    },
    { to: '/patient/documents',    label: 'My Documents'    },
    { to: '/patient/profile',      label: 'Profile'         },
  ],
  Doctor: [
    { to: '/doctor/schedule',     label: 'Schedule'     },
    { to: '/doctor/availability', label: 'Availability' }, // ✅ Added
    { to: '/doctor/profile',      label: 'Profile'      },
  ],
  Admin: [
    { to: '/admin/users',    label: 'Users'    },
    { to: '/admin/doctors',  label: 'Doctors'  },
  ],
};

export default function NavBar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  if (!user) return null; // Don't render on public pages

  const links = NAV_LINKS[user.role] ?? [];

  return (
    <header className={styles.navbar}>
      <div className={styles.navInner}>

        {/* Brand logo */}
        <button
          className={`brand-heading ${styles.brandBtn}`}
          onClick={() => navigate(`/${user.role.toLowerCase()}`)}
          aria-label="Go to dashboard"
        >
          <img src={smartClinicLogo} alt="SmartClinic Logo" className={styles.navLogoImg} />
          SmartClinic
        </button>

        {/* Role-specific nav links */}
        <nav className={styles.navLinks} aria-label="Main navigation">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                `${styles.navLink} ${isActive ? styles.navLinkActive : ''}`
              }
            >
              {link.label}
            </NavLink>
          ))}
        </nav>

        {/* User info + logout */}
        <div className={styles.navUser}>

          {/* Profile avatar */}
          {user.profilePictureUrl ? (
            <img
              src={user.profilePictureUrl}
              alt={`${user.firstName}'s avatar`}
              className={styles.avatar}
            />
          ) : (
            <div className={styles.avatarFallback} aria-hidden="true">
              {user.firstName[0]}{user.lastName[0]}
            </div>
          )}

          <div className={styles.userMeta}>
            <span className={styles.userName}>
              {user.firstName} {user.lastName}
            </span>
            <span className={`role-badge ${user.role.toLowerCase()}`}>
              {user.role}
            </span>
          </div>

          <button
            onClick={logout}
            className={styles.logoutBtn}
            aria-label="Sign out"
          >
            Sign out
          </button>

        </div>

      </div>
    </header>
  );
}