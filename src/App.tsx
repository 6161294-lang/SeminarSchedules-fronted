import { AuthBootstrap } from '@/features/auth/AuthBootstrap';
import { AppRoutes } from '@/routes/AppRoutes';

export default function App() {
  return (
    <AuthBootstrap>
      <AppRoutes />
    </AuthBootstrap>
  );
}
