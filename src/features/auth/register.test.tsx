import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import App from '@/App';
import { callsTo, jsonResponse, makeUser, mockApi } from '@/test/fixtures';
import { renderWithProviders } from '@/test/utils';

afterEach(() => {
  vi.unstubAllGlobals();
});

async function fillForm(user: ReturnType<typeof userEvent.setup>, confirm = 'Password123!') {
  await user.type(screen.getByLabelText('שם הסמינר'), 'סמינר בית יעקב');
  await user.type(screen.getByLabelText('שם מלא'), 'שרה המזכירה');
  await user.type(screen.getByLabelText('אימייל'), 'sara@example.com');
  await user.type(screen.getByLabelText('סיסמה'), 'Password123!');
  await user.type(screen.getByLabelText('אימות סיסמה'), confirm);
  await user.click(screen.getByRole('button', { name: 'הרשמה' }));
}

describe('הרשמת מזכירה', () => {
  it('מדף ההתחברות יש קישור להרשמה', () => {
    renderWithProviders(<App />, { route: '/login' });
    expect(screen.getByRole('link', { name: 'הרשמה ויצירת סמינר' })).toHaveAttribute('href', '/register');
  });

  it('שולחת לשרת ומעבירה למסך המזכירה', async () => {
    const fetchMock = mockApi({
      'POST /api/auth/register': {
        sessionKey: 'k',
        expiresAt: '2999-01-01T00:00:00.000Z',
        user: makeUser('ADMIN')
      },
      'GET /api/lessons/week': { days: [] },
      'GET /api/lessons': []
    });
    renderWithProviders(<App />, { route: '/register' });
    await fillForm(userEvent.setup());

    await waitFor(() => expect(callsTo(fetchMock, 'POST /api/auth/register')).toHaveLength(1));
    const body = JSON.parse(String(callsTo(fetchMock, 'POST /api/auth/register')[0]![1]?.body));
    expect(body).toEqual({
      seminarName: 'סמינר בית יעקב',
      fullName: 'שרה המזכירה',
      email: 'sara@example.com',
      password: 'Password123!'
    });
    expect(await screen.findByRole('navigation', { name: 'ניווט ראשי' })).toBeInTheDocument();
  });

  it('לא שולחת כשהאימות לא תואם לסיסמה', async () => {
    const fetchMock = mockApi();
    renderWithProviders(<App />, { route: '/register' });
    await fillForm(userEvent.setup(), 'different-password');

    expect(await screen.findByText('הסיסמאות אינן זהות')).toBeInTheDocument();
    expect(callsTo(fetchMock, 'POST /api/auth/register')).toHaveLength(0);
  });

  it('מציגה את שגיאת השרת כשהאימייל תפוס', async () => {
    mockApi({
      'POST /api/auth/register': () =>
        jsonResponse({ error: { code: 'EMAIL_TAKEN', message: 'כבר קיים משתמש עם האימייל הזה' } }, 409)
    });
    renderWithProviders(<App />, { route: '/register' });
    await fillForm(userEvent.setup());

    expect(await screen.findByText('כבר קיים משתמש עם האימייל הזה')).toBeInTheDocument();
  });
});
