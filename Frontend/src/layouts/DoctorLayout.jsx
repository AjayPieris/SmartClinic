import { Outlet } from 'react-router-dom';
import NavBar from '../components/NavBar';
import styles from './Layout.module.css';

export default function DoctorLayout() {
  return (
    <div className={styles.shell}>
      <NavBar />
      <main className={styles.main}>
        <Outlet />
      </main>
    </div>
  );
}