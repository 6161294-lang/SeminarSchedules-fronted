import type { QueryClient } from '@tanstack/react-query';
import { configureApiClient } from '@/api/client';
import { loggedOut, selectSessionKey } from '@/features/auth/authSlice';
import type { AppStore } from './store';

/**
 * מחברת את לקוח ה-API ל-Redux: המפתח נקרא מה-Store, ותשובת 401
 * (מפתח שפג או בוטל) מנתקת את המשתמשת ומנקה את המטמון.
 */
export function setupApi(store: AppStore, queryClient: QueryClient) {
  configureApiClient({
    getToken: () => selectSessionKey(store.getState()),
    onUnauthorized: () => {
      store.dispatch(loggedOut());
      queryClient.clear();
    }
  });
}
