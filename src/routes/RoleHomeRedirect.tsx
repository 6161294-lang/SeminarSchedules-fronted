import { Navigate } from 'react-router-dom';
import { useAppSelector } from '@/app/hooks';
import { selectRole } from '@/features/auth/authSlice';
import { homePathForRole, paths } from './paths';

/** הנתיב "/" מעביר כל תפקיד למסך הבית שלו */
export function RoleHomeRedirect() {
  const role = useAppSelector(selectRole);
  return <Navigate to={role ? homePathForRole(role) : paths.login} replace />;
}
