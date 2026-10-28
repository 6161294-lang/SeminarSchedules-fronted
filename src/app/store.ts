import { combineReducers, configureStore } from '@reduxjs/toolkit';
import authReducer from '@/features/auth/authSlice';

const rootReducer = combineReducers({ auth: authReducer });

export type RootState = ReturnType<typeof rootReducer>;

/** פונקציה ולא אובייקט יחיד, כדי שכל בדיקה תקבל Store נקי משלה */
export function createAppStore(preloadedState?: Partial<RootState>) {
  return configureStore({ reducer: rootReducer, preloadedState });
}

export type AppStore = ReturnType<typeof createAppStore>;
export type AppDispatch = AppStore['dispatch'];
