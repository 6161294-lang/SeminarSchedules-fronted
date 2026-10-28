import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { LoginResponse, User } from '@/types/api';

/**
 * anonymous: לא מחוברת. checking: יש מפתח שמור ועדיין בודקים מול השרת. authenticated: מחוברת.
 */
export interface AuthState {
  status: 'anonymous' | 'checking' | 'authenticated';
  user: User | null;
  sessionKey: string | null;
  expiresAt: string | null;
}

export const anonymousState: AuthState = {
  status: 'anonymous',
  user: null,
  sessionKey: null,
  expiresAt: null
};

const authSlice = createSlice({
  name: 'auth',
  initialState: anonymousState,
  reducers: {
    loggedIn(_state, action: PayloadAction<LoginResponse>): AuthState {
      const { sessionKey, expiresAt, user } = action.payload;
      return { status: 'authenticated', user, sessionKey, expiresAt };
    },
    /** השרת אישר שהמפתח השמור תקף. מעדכנים את פרטי המשתמשת */
    sessionVerified(state, action: PayloadAction<User>) {
      state.user = action.payload;
      state.status = 'authenticated';
    },
    loggedOut(): AuthState {
      return anonymousState;
    }
  }
});

export const { loggedIn, sessionVerified, loggedOut } = authSlice.actions;
export default authSlice.reducer;

type WithAuth = { auth: AuthState };

export const selectAuthStatus = (state: WithAuth) => state.auth.status;
export const selectIsAuthenticated = (state: WithAuth) => state.auth.status === 'authenticated';
export const selectUser = (state: WithAuth) => state.auth.user;
export const selectRole = (state: WithAuth) => state.auth.user?.role ?? null;
export const selectSessionKey = (state: WithAuth) => state.auth.sessionKey;
