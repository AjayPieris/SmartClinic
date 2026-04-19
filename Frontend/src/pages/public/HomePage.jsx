import React from 'react';
import { Link } from 'react-router-dom';
import styles from './HomePage.module.css';

import heroBg from '../../assets/hero-bg.png';
import doctor1 from '../../assets/doctor-1.png';
import doctor2 from '../../assets/doctor-2.png';
import doctor3 from '../../assets/doctor-3.png';

export default function HomePage() {
  return (
    <div className={styles.homePage}>
      {/* ── Navbar ── */}
      <nav className={styles.navbar}>
        <div className={styles.brand}>
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2L20 7V17L12 22L4 17V7L12 2Z" fill="#2563eb"/>
            <path d="M12 22V12M12 12L20 7M12 12L4 7" stroke="white" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          SmartClinic
        </div>
        <div className={styles.navLinks}>
          <Link to="/login" className={styles.loginBtn}>Sign In</Link>
          <Link to="/register" className={styles.registerBtn}>Create Account</Link>
        </div>
      </nav>

      {/* ── Hero Section ── */}
      <section className={styles.hero}>
        <img src={heroBg} alt="Modern hospital" className={styles.heroBg} />
        <div className={styles.heroContent}>
          <span className={styles.heroLabel}>Welcome to the Future of Healthcare</span>
          <h1 className={styles.heroTitle}>Precision in Care,<br />Driven by Intelligence.</h1>
          <p className={styles.heroSubtitle}>
            Experience seamless medical care with our state-of-the-art clinic management system. 
            Connect with top specialists and manage your health effortlessly.
          </p>
          <div className={styles.heroActions}>
            <Link to="/register" className={styles.primaryBtn}>Get Started Today</Link>
          </div>
        </div>
      </section>

      {/* ── Statistics Section ── */}
      <section className={styles.stats}>
        <div className={styles.statCard}>
          <div className={styles.statNumber}>50+</div>
          <div className={styles.statLabel}>Specialist Doctors</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statNumber}>10k+</div>
          <div className={styles.statLabel}>Happy Patients</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statNumber}>15+</div>
          <div className={styles.statLabel}>Years of Excellence</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statNumber}>24/7</div>
          <div className={styles.statLabel}>Emergency Support</div>
        </div>
      </section>

      {/* ── Featured Doctors Section ── */}
      <section className={styles.doctors}>
        <h2 className={styles.sectionTitle}>Meet Our Top Specialists</h2>
        <p className={styles.sectionSubtitle}>World-class medical professionals dedicated to your wellbeing.</p>
        
        <div className={styles.doctorGrid}>
          <div className={styles.doctorCard}>
            <div className={styles.doctorImgWrapper}>
              <img src={doctor1} alt="Dr. James Wilson" className={styles.doctorImg} />
            </div>
            <div className={styles.doctorInfo}>
              <h3 className={styles.doctorName}>Dr. James Wilson</h3>
              <div className={styles.doctorSpec}>Chief of Cardiology</div>
              <p className={styles.doctorDesc}>Expert in interventional cardiology with over 15 years of experience in performing complex heart surgeries and pioneer in minimally invasive techniques.</p>
            </div>
          </div>
          
          <div className={styles.doctorCard}>
            <div className={styles.doctorImgWrapper}>
              <img src={doctor2} alt="Dr. Sarah Mitchell" className={styles.doctorImg} />
            </div>
            <div className={styles.doctorInfo}>
              <h3 className={styles.doctorName}>Dr. Sarah Mitchell</h3>
              <div className={styles.doctorSpec}>Neurology Specialist</div>
              <p className={styles.doctorDesc}>Award-winning neurosurgeon specializing in brain mapping and neuroplasticity. Dedicated to advancing treatments for complex neurological conditions.</p>
            </div>
          </div>
          
          <div className={styles.doctorCard}>
            <div className={styles.doctorImgWrapper}>
              <img src={doctor3} alt="Dr. Robert Chen" className={styles.doctorImg} />
            </div>
            <div className={styles.doctorInfo}>
              <h3 className={styles.doctorName}>Dr. Robert Chen</h3>
              <div className={styles.doctorSpec}>Head of Orthopedics</div>
              <p className={styles.doctorDesc}>Leading specialist in joint replacement and sports medicine. Helping professional athletes and patients alike regain their full mobility.</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
