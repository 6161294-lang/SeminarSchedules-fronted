import type { Store } from '@reduxjs/toolkit';
import type { User } from '@/types/api';
import type { AuthState } from './authSlice';

// שמירת ההתחברות ב-localStorage כדי שרענון הדף לא ינתק. כל גישה עטופה ב-try/catch
// כי הדפדפן יכול לחסום אחסון (מצב פרטי, הגדרות פרטיות)
const STORAGE_KEY = 'seminar.session';

interface StoredSession {
  sessionKey: string;
  expiresAt: string;
  user: User;
}

function isStoredSession(value: unknown): value is StoredSession {
  if (typeof value !== 'object' || value === null) return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.sessionKey === 'string' &&
    typeof v.expiresAt === 'string' &&
    typeof v.user === 'object' &&
    v.user !== null
  );
}

export function clearSession() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* אחסון חסום */
  }
}

function saveSession(session: StoredSession) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  } catch {
    /* אחסון חסום */
  }
}

export function loadSession(now = Date.now()): StoredSession | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (!isStoredSession(parsed) || Date.parse(parsed.expiresAt) <= now) {
      clearSession();
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

/** מצב ההתחברות ההתחלתי: אם יש מפתח שמור ותקף, בודקים אותו מול השרת בעלייה */
export function restoredAuthState(): AuthState | undefined {
  const session = loadSession();
  if (!session) return undefined;
  return {
    status: 'checking',
    user: session.user,
    sessionKey: session.sessionKey,
    expiresAt: session.expiresAt
  };
}

/** שומרת את ההתחברות בכל שינוי, ומוחקת אותה בהתנתקות */
export function persistAuth(store: Store<{ auth: AuthState }>) {
  return store.subscribe(() => {
    const { status, sessionKey, expiresAt, user } = store.getState().auth;
    if (status === 'authenticated' && sessionKey && expiresAt && user) {
      saveSession({ sessionKey, expiresAt, user });
    } else if (status === 'anonymous') {
      clearSession();
    }
  });
}
