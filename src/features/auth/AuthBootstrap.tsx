import { useQuery } from '@tanstack/react-query';
import { useEffect, type ReactNode } from 'react';
import { authApi } from '@/api/endpoints';
import { queryKeys } from '@/api/queryKeys';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { LoadingScreen } from '@/components/ui/LoadingScreen';
import { selectAuthStatus, selectUser, sessionVerified } from './authSlice';

/**
 * בעלייה של האפליקציה, אם נשמר מפתח, בודקת מולו את השרת לפני שמציגים מסכים.
 * מפתח לא תקין (401) מנתק אוטומטית דרך לקוח ה-API. כשל רשת לא מנתק.
 */
export function AuthBootstrap({ children }: { children: ReactNode }) {
  const dispatch = useAppDispatch();
  const status = useAppSelector(selectAuthStatus);
  const storedUser = useAppSelector(selectUser);

  const me = useQuery({
    queryKey: queryKeys.me(),
    queryFn: authApi.me,
    enabled: status === 'checking',
    retry: false
  });

  useEffect(() => {
    if (status !== 'checking') return;
    if (me.data) dispatch(sessionVerified(me.data));
    else if (me.isError && storedUser) dispatch(sessionVerified(storedUser));
  }, [status, me.data, me.isError, storedUser, dispatch]);

  if (status === 'checking') return <LoadingScreen label="בודקת התחברות..." />;
  return <>{children}</>;
}
