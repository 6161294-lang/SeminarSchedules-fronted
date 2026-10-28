import { describe, expect, it } from 'vitest';
import { makeUser } from '@/test/fixtures';
import reducer, {
  anonymousState,
  loggedIn,
  loggedOut,
  selectIsAuthenticated,
  selectRole,
  sessionVerified
} from './authSlice';

describe('authSlice', () => {
  it('מתחיל במצב לא מחוברת', () => {
    const state = reducer(undefined, { type: 'init' });
    expect(state).toEqual(anonymousState);
    expect(selectIsAuthenticated({ auth: state })).toBe(false);
    expect(selectRole({ auth: state })).toBeNull();
  });

  it('loggedIn שומר את המשתמשת והמפתח', () => {
    const user = makeUser('TEACHER');
    const state = reducer(
      undefined,
      loggedIn({ sessionKey: 'k1', expiresAt: '2999-01-01T00:00:00.000Z', user })
    );
    expect(state).toEqual({
      status: 'authenticated',
      user,
      sessionKey: 'k1',
      expiresAt: '2999-01-01T00:00:00.000Z'
    });
    expect(selectRole({ auth: state })).toBe('TEACHER');
  });

  it('sessionVerified מסיים בדיקה ומעדכן את פרטי המשתמשת', () => {
    const checking = {
      status: 'checking' as const,
      user: makeUser('STUDENT', { fullName: 'שם ישן' }),
      sessionKey: 'k1',
      expiresAt: '2999-01-01T00:00:00.000Z'
    };
    const state = reducer(checking, sessionVerified(makeUser('STUDENT', { fullName: 'שם חדש' })));
    expect(state.status).toBe('authenticated');
    expect(state.user?.fullName).toBe('שם חדש');
    expect(state.sessionKey).toBe('k1');
  });

  it('loggedOut מנקה הכול', () => {
    const logged = reducer(
      undefined,
      loggedIn({ sessionKey: 'k1', expiresAt: '2999-01-01T00:00:00.000Z', user: makeUser() })
    );
    expect(reducer(logged, loggedOut())).toEqual(anonymousState);
  });
});
