import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import App from '@/App';
import { callsTo, jsonResponse, makeUser, mockApi } from '@/test/fixtures';
import { renderWithProviders } from '@/test/utils';

afterEach(() => {
  vi.unstubAllGlobals();
});

const fill = async (email: string, password: string) => {
  const user = userEvent.setup();
  if (email) await user.type(screen.getByLabelText('אימייל'), email);
  if (password) await user.type(screen.getByLabelText('סיסמה'), password);
  await user.click(screen.getByRole('button', { name: 'כניסה' }));
};

const LOGIN = 'POST /api/auth/login';

describe('טופס התחברות', () => {
  it('מציג שגיאות ולידציה ולא שולח לשרת כששדות ריקים', async () => {
    const fetchMock = mockApi();
    renderWithProviders(<App />, { route: '/login' });
    await fill('', '');
    expect(await screen.findByText('חובה להזין אימייל')).toBeInTheDocument();
    expect(screen.getByText('חובה להזין סיסמה')).toBeInTheDocument();
    expect(callsTo(fetchMock, LOGIN)).toHaveLength(0);
  });

  it('דוחה אימייל לא תקין', async () => {
    const fetchMock = mockApi();
    renderWithProviders(<App />, { route: '/login' });
    await fill('not-an-email', 'secret');
    expect(await screen.findByText('האימייל אינו תקין')).toBeInTheDocument();
    expect(callsTo(fetchMock, LOGIN)).toHaveLength(0);
  });

  it('התחברות מוצלחת שומרת במצב ועוברת למסך הבית', async () => {
    const fetchMock = mockApi({
      [LOGIN]: {
        sessionKey: 'new-key',
        expiresAt: '2999-01-01T00:00:00.000Z',
        user: makeUser('ADMIN')
      }
    });
    const { store } = renderWithProviders(<App />, { route: '/login' });
    await fill('secretary@example.com', 'Password123!');

    expect(await screen.findByRole('heading', { name: 'לוח זמנים' })).toBeInTheDocument();
    expect(store.getState().auth).toMatchObject({ status: 'authenticated', sessionKey: 'new-key' });

    const [[url, init]] = callsTo(fetchMock, LOGIN) as [[string, RequestInit]];
    expect(url).toBe('http://localhost:3000/api/auth/login');
    expect(init.body).toBe(JSON.stringify({ email: 'secretary@example.com', password: 'Password123!' }));
    expect((init.headers as Headers).get('Authorization')).toBeNull();
  });

  it('מציג את הודעת השרת כשהסיסמה שגויה', async () => {
    mockApi({
      [LOGIN]: () =>
        jsonResponse({ error: { code: 'INVALID_CREDENTIALS', message: 'אימייל או סיסמה שגויים' } }, 401)
    });
    const { store } = renderWithProviders(<App />, { route: '/login' });
    await fill('rachel@example.com', 'wrong-password');

    expect(await screen.findByRole('alert')).toHaveTextContent('אימייל או סיסמה שגויים');
    expect(store.getState().auth.status).toBe('anonymous');
  });

  it('מציג הודעה כשאי אפשר להגיע לשרת', async () => {
    mockApi({
      [LOGIN]: () => {
        throw new TypeError('Failed to fetch');
      }
    });
    renderWithProviders(<App />, { route: '/login' });
    await fill('rachel@example.com', 'Password123!');
    expect(await screen.findByRole('alert')).toHaveTextContent('לא ניתן להתחבר לשרת');
  });

  it('בזמן טעינה הכפתור מושבת ומציג "מתחברת..."', async () => {
    const fetchMock = mockApi({ [LOGIN]: () => new Promise<Response>(() => undefined) });
    renderWithProviders(<App />, { route: '/login' });
    await fill('rachel@example.com', 'Password123!');

    const button = await screen.findByRole('button', { name: 'מתחברת...' });
    await waitFor(() => expect(button).toBeDisabled());
    expect(callsTo(fetchMock, LOGIN)).toHaveLength(1);
  });
});
