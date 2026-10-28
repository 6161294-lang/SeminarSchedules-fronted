import { screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import App from '@/App';
import {
  authenticated,
  callsTo,
  checking,
  jsonResponse,
  makeUser,
  mockApi,
  noContent
} from '@/test/fixtures';
import { renderWithProviders } from '@/test/utils';

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('הגנה על נתיבים', () => {
  it('לא מחוברת מועברת להתחברות', () => {
    mockApi();
    renderWithProviders(<App />, { route: '/student' });
    expect(screen.getByRole('heading', { name: 'כניסה למערכת' })).toBeInTheDocument();
  });

  it('נתיב לא קיים מציג דף "לא נמצא"', () => {
    mockApi();
    renderWithProviders(<App />, { route: '/no-such-page' });
    expect(screen.getByRole('heading', { name: 'הדף לא נמצא' })).toBeInTheDocument();
  });

  it.each([
    ['STUDENT', 'המערכת השבועית'],
    ['TEACHER', 'המערכת שלי'],
    ['ADMIN', 'לוח זמנים']
  ] as const)('"/" מעביר %s למסך הבית שלה', async (role, heading) => {
    mockApi({ 'GET /api/lessons/week': { days: [] } });
    renderWithProviders(<App />, { route: '/', preloadedState: authenticated(role) });
    expect(await screen.findByRole('heading', { name: heading })).toBeInTheDocument();
  });

  it('תפקיד לא מתאים נחסם בדף "אין הרשאה"', () => {
    mockApi();
    renderWithProviders(<App />, { route: '/admin', preloadedState: authenticated('STUDENT') });
    expect(screen.getByRole('heading', { name: 'אין לך הרשאה' })).toBeInTheDocument();
    expect(screen.queryByText(/התחברת בתפקיד/)).not.toBeInTheDocument();
  });

  it.each([
    ['TEACHER', '/student'],
    ['TEACHER', '/admin'],
    ['ADMIN', '/student'],
    ['ADMIN', '/teacher'],
    ['STUDENT', '/teacher']
  ] as const)('%s לא נכנסת ל-%s', (role, route) => {
    mockApi();
    renderWithProviders(<App />, { route, preloadedState: authenticated(role) });
    expect(screen.getByRole('heading', { name: 'אין לך הרשאה' })).toBeInTheDocument();
  });

  it('מחוברת שנכנסת ל-/login מועברת למסך הבית', () => {
    mockApi();
    renderWithProviders(<App />, { route: '/login', preloadedState: authenticated('ADMIN') });
    expect(screen.getByRole('heading', { name: 'לוח זמנים' })).toBeInTheDocument();
  });

  it('אחרי התחברות חוזרת לדף שביקשה במקור', () => {
    mockApi();
    renderWithProviders(<App />, {
      route: { pathname: '/login', state: { from: { pathname: '/admin/users' } } },
      preloadedState: authenticated('ADMIN')
    });
    expect(screen.getByRole('heading', { name: 'משתמשים' })).toBeInTheDocument();
  });

  it('דף שביקשה במקור שלא מתאים לתפקיד שנכנס מוחלף במסך הבית', async () => {
    mockApi({ 'GET /api/lessons/week': { days: [] } });
    renderWithProviders(<App />, {
      route: { pathname: '/login', state: { from: { pathname: '/teacher/homework' } } },
      preloadedState: authenticated('STUDENT')
    });
    expect(await screen.findByRole('heading', { name: 'המערכת השבועית' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'אין לך הרשאה' })).not.toBeInTheDocument();
  });

  it('התנתקות מחזירה למסך ההתחברות וקוראת לשרת', async () => {
    const fetchMock = mockApi({ 'POST /api/auth/logout': () => noContent() });
    const { store } = renderWithProviders(<App />, { route: '/', preloadedState: authenticated() });
    screen.getByRole('button', { name: 'התנתקות' }).click();
    expect(await screen.findByRole('heading', { name: 'כניסה למערכת' })).toBeInTheDocument();
    expect(store.getState().auth.status).toBe('anonymous');
    expect(callsTo(fetchMock, 'POST /api/auth/logout')).toHaveLength(1);
  });
});

describe('בדיקת מפתח שמור בעלייה', () => {
  it('מציג טעינה ואז מסך כשהשרת מאשר', async () => {
    mockApi({
      'GET /api/auth/me': makeUser('STUDENT', { fullName: 'שם מהשרת' }),
      'GET /api/lessons/week': { days: [] }
    });
    renderWithProviders(<App />, { route: '/', preloadedState: checking('STUDENT') });

    expect(screen.getByText('בודקת התחברות...')).toBeInTheDocument();
    expect(await screen.findByText('שם מהשרת (תלמידה)')).toBeInTheDocument();
  });

  it('מפתח שנדחה (401) מנתק ומעביר להתחברות', async () => {
    mockApi({
      'GET /api/auth/me': () => jsonResponse({ error: { code: 'UNAUTHORIZED', message: 'פג' } }, 401)
    });
    const { store } = renderWithProviders(<App />, { route: '/', preloadedState: checking() });

    expect(await screen.findByRole('heading', { name: 'כניסה למערכת' })).toBeInTheDocument();
    expect(store.getState().auth.status).toBe('anonymous');
  });

  it('כשל רשת לא מנתק ומשתמש בפרטים השמורים', async () => {
    mockApi({
      'GET /api/auth/me': () => {
        throw new TypeError('Failed to fetch');
      }
    });
    const { store } = renderWithProviders(<App />, { route: '/', preloadedState: checking('ADMIN') });

    await waitFor(() => expect(store.getState().auth.status).toBe('authenticated'));
    expect(await screen.findByRole('heading', { name: 'לוח זמנים' })).toBeInTheDocument();
  });
});
