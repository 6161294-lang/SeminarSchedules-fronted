import { beforeEach, describe, expect, it } from 'vitest';
import { createAppStore } from '@/app/store';
import { authenticated, makeUser } from '@/test/fixtures';
import { loggedIn, loggedOut } from './authSlice';
import { loadSession, persistAuth, restoredAuthState } from './authStorage';

const KEY = 'seminar.session';
const future = '2999-01-01T00:00:00.000Z';

beforeEach(() => {
  localStorage.clear();
});

describe('authStorage', () => {
  it('בלי נתונים שמורים אין מצב להחזיר', () => {
    expect(loadSession()).toBeNull();
    expect(restoredAuthState()).toBeUndefined();
  });

  it('טוען התחברות תקפה ומחזיר מצב checking', () => {
    localStorage.setItem(KEY, JSON.stringify({ sessionKey: 'k', expiresAt: future, user: makeUser() }));
    expect(restoredAuthState()).toMatchObject({ status: 'checking', sessionKey: 'k' });
  });

  it('התחברות שפג תוקפה נמחקת', () => {
    localStorage.setItem(
      KEY,
      JSON.stringify({ sessionKey: 'k', expiresAt: '2000-01-01T00:00:00.000Z', user: makeUser() })
    );
    expect(loadSession()).toBeNull();
    expect(localStorage.getItem(KEY)).toBeNull();
  });

  it('נתונים פגומים לא שוברים את האפליקציה', () => {
    localStorage.setItem(KEY, '{not json');
    expect(loadSession()).toBeNull();
    localStorage.setItem(KEY, JSON.stringify({ sessionKey: 5 }));
    expect(loadSession()).toBeNull();
  });

  it('persistAuth שומרת בהתחברות ומוחקת בהתנתקות', () => {
    const store = createAppStore();
    persistAuth(store);

    store.dispatch(loggedIn({ sessionKey: 'k9', expiresAt: future, user: makeUser('ADMIN') }));
    expect(JSON.parse(localStorage.getItem(KEY) ?? '{}')).toMatchObject({ sessionKey: 'k9' });

    store.dispatch(loggedOut());
    expect(localStorage.getItem(KEY)).toBeNull();
  });

  it('persistAuth לא מוחקת כשהמצב הוא checking', () => {
    localStorage.setItem(KEY, JSON.stringify({ sessionKey: 'k', expiresAt: future, user: makeUser() }));
    const store = createAppStore({ auth: { ...authenticated().auth, status: 'checking' } });
    persistAuth(store);
    store.dispatch({ type: 'noop' });
    expect(localStorage.getItem(KEY)).not.toBeNull();
  });
});
