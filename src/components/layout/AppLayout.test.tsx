import { screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import App from '@/App';
import { NAV_ITEMS } from '@/routes/navigation';
import { authenticated, mockApi } from '@/test/fixtures';
import { renderWithProviders } from '@/test/utils';

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('AppLayout', () => {
  it.each(['STUDENT', 'TEACHER', 'ADMIN'] as const)('מציג את תפריט הניווט של %s בלבד', (role) => {
    mockApi();
    renderWithProviders(<App />, { route: '/', preloadedState: authenticated(role) });

    const nav = screen.getByRole('navigation', { name: 'ניווט ראשי' });
    const labels = within(nav).getAllByRole('link').map((a) => a.textContent);
    expect(labels).toEqual(NAV_ITEMS[role].map((item) => item.label));
  });

  it('תלמידה לא רואה קישורים של מורה או מזכירה', () => {
    mockApi();
    renderWithProviders(<App />, { route: '/', preloadedState: authenticated('STUDENT') });
    expect(screen.queryByRole('link', { name: 'משתמשים' })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'הגשות' })).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'שיעורי בית' })).toBeInTheDocument();
  });

  it('מציג את שם המשתמשת ואת התפקיד', () => {
    mockApi();
    renderWithProviders(<App />, { route: '/', preloadedState: authenticated('ADMIN') });
    expect(screen.getByText('שרה המזכירה (מזכירה)')).toBeInTheDocument();
  });

  it('הפעמון מציג את מספר ההתראות שלא נקראו', async () => {
    mockApi({ 'GET /api/notifications': { items: [], unreadCount: 3 } });
    renderWithProviders(<App />, { route: '/', preloadedState: authenticated() });
    expect(await screen.findByTestId('unread-badge')).toHaveTextContent('3');
    expect(screen.getByRole('link', { name: 'התראות, 3 חדשות' })).toHaveAttribute('href', '/notifications');
  });

  it('בלי התראות חדשות אין תג', async () => {
    mockApi();
    renderWithProviders(<App />, { route: '/', preloadedState: authenticated() });
    expect(await screen.findByRole('link', { name: 'התראות' })).toBeInTheDocument();
    expect(screen.queryByTestId('unread-badge')).not.toBeInTheDocument();
  });
});
