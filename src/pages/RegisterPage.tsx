import { Link, Navigate } from 'react-router-dom';
import { useAppSelector } from '@/app/hooks';
import { RegisterForm } from '@/features/auth/RegisterForm';
import { selectRole } from '@/features/auth/authSlice';
import { homePathForRole, paths } from '@/routes/paths';

/** הרשמה למזכירות בלבד. מורות ותלמידות מוגדרות על ידי המזכירה בתוך הסמינר שלה */
export function RegisterPage() {
  const role = useAppSelector(selectRole);
  if (role) return <Navigate to={homePathForRole(role)} replace />;

  return (
    <main className="auth-page">
      <section className="card auth-card">
        <h1>הרשמת מזכירה</h1>
        <p className="muted">נרשמת וקיבלת סמינר ריק, שבו תגדירי כיתות, מקצועות, מורות ותלמידות.</p>
        <RegisterForm />
        <p className="muted auth-switch">
          כבר רשומה? <Link to={paths.login}>כניסה</Link>
        </p>
      </section>
    </main>
  );
}
