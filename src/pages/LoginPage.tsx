import { Link, Navigate, useLocation } from 'react-router-dom';
import { useAppSelector } from '@/app/hooks';
import { LoginForm } from '@/features/auth/LoginForm';
import { selectRole } from '@/features/auth/authSlice';
import { paths, resolvePostLoginPath } from '@/routes/paths';

interface LocationState {
  from?: { pathname: string; search?: string };
}

export function LoginPage() {
  const role = useAppSelector(selectRole);
  const location = useLocation();

  // כבר מחוברת: חוזרת לדף שביקשה לפני ההתחברות (אם הוא מתאים לתפקיד), או למסך הבית
  if (role) {
    const from = (location.state as LocationState | null)?.from;
    const target = resolvePostLoginPath(role, from?.pathname);
    return <Navigate to={target === from?.pathname ? `${target}${from.search ?? ''}` : target} replace />;
  }

  return (
    <main className="auth-page">
      <section className="card auth-card">
        <h1>כניסה למערכת</h1>
        <p className="muted">מערכת לוח הזמנים של הסמינר</p>
        <LoginForm />
        <p className="muted auth-switch">
          מזכירה חדשה? <Link to={paths.register}>הרשמה ויצירת סמינר</Link>
        </p>
      </section>
    </main>
  );
}
