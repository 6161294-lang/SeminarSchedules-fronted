import { Navigate, Outlet } from 'react-router-dom';
import { useAppSelector } from '@/app/hooks';
import { selectRole } from '@/features/auth/authSlice';
import type { Role } from '@/types/api';
import { paths } from './paths';

interface RoleRouteProps {
  allowed: Role[];
}

/**
 * חוסמת מסכים לפי תפקיד. זו רק נוחות בממשק: ההרשאות האמיתיות נבדקות בשרת,
 * והוא יחזיר 403 גם אם מישהי תעקוף את הממשק.
 */
export function RoleRoute({ allowed }: RoleRouteProps) {
  const role = useAppSelector(selectRole);
  if (!role || !allowed.includes(role)) {
    return <Navigate to={paths.forbidden} replace />;
  }
  return <Outlet />;
}
