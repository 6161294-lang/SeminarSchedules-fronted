import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import App from '@/App';
import type { AppNotification } from '@/types/api';
import { authenticated, callsTo, jsonResponse, mockApi } from '@/test/fixtures';
import { renderWithProviders } from '@/test/utils';

afterEach(() => {
  vi.unstubAllGlobals();
});

const notification = (over: Partial<AppNotification>): AppNotification => ({
  id: 'n1',
  userId: 'student-1',
  type: 'LESSON_CHANGED',
  title: 'שיעור בוטל',
  body: 'מבני נתונים (ה1): השיעור בוטל',
  lessonId: null,
  announcementId: null,
  isRead: false,
  createdAt: '2026-11-01T07:05:00.000Z',
  ...over
});

const open = () =>
  renderWithProviders(<App />, { route: '/notifications', preloadedState: authenticated('STUDENT') });

describe('דף התראות', () => {
  it('מציג התראות עם הבחנה בין שנקראו ללא', async () => {
    mockApi({
      'GET /api/notifications': {
        items: [notification({}), notification({ id: 'n2', title: 'הודעה ישנה', isRead: true })],
        unreadCount: 1
      }
    });
    open();

    expect(await screen.findByText('שיעור בוטל')).toBeInTheDocument();
    expect(screen.getByText('הודעה ישנה')).toBeInTheDocument();
    expect(screen.getByText('1 לא נקראו')).toBeInTheDocument();
    // כפתור "סימון כנקרא" רק להתראה שלא נקראה
    expect(screen.getAllByRole('button', { name: 'סימון כנקרא' })).toHaveLength(1);
  });

  it('מציג הודעה כשאין התראות', async () => {
    mockApi();
    open();
    expect(await screen.findByText('אין התראות')).toBeInTheDocument();
  });

  it('סימון התראה כנקראה שולח PATCH ומרענן', async () => {
    let read = false;
    const fetchMock = mockApi({
      'GET /api/notifications': () =>
        jsonResponse({ items: [notification({ isRead: read })], unreadCount: read ? 0 : 1 }),
      'PATCH /api/notifications/n1/read': () => {
        read = true;
        return jsonResponse(notification({ isRead: true }));
      }
    });
    open();

    await userEvent.click(await screen.findByRole('button', { name: 'סימון כנקרא' }));

    await waitFor(() => expect(screen.getByText('0 לא נקראו')).toBeInTheDocument());
    expect(callsTo(fetchMock, 'PATCH /api/notifications/n1/read')).toHaveLength(1);
    expect(screen.queryByRole('button', { name: 'סימון כנקרא' })).not.toBeInTheDocument();
  });

  it('סימון הכול כנקרא', async () => {
    let read = false;
    const fetchMock = mockApi({
      'GET /api/notifications': () =>
        jsonResponse({
          items: [notification({ isRead: read }), notification({ id: 'n2', isRead: read })],
          unreadCount: read ? 0 : 2
        }),
      'POST /api/notifications/read-all': () => {
        read = true;
        return jsonResponse({ updated: 2 });
      }
    });
    open();

    await userEvent.click(await screen.findByRole('button', { name: 'סימון הכול כנקרא' }));
    await waitFor(() => expect(screen.getByText('0 לא נקראו')).toBeInTheDocument());
    expect(callsTo(fetchMock, 'POST /api/notifications/read-all')).toHaveLength(1);
    expect(screen.getByRole('button', { name: 'סימון הכול כנקרא' })).toBeDisabled();
  });

  it('שגיאה בסימון מציגה הודעה קופצת', async () => {
    mockApi({
      'GET /api/notifications': { items: [notification({})], unreadCount: 1 },
      'PATCH /api/notifications/n1/read': () =>
        jsonResponse({ error: { code: 'NOT_FOUND', message: 'ההתראה לא נמצאה' } }, 404)
    });
    open();

    await userEvent.click(await screen.findByRole('button', { name: 'סימון כנקרא' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('ההתראה לא נמצאה');
  });

  it('שגיאת טעינה מציגה הודעה וכפתור "נסי שוב"', async () => {
    let fail = true;
    mockApi({
      'GET /api/notifications': () =>
        fail
          ? jsonResponse({ error: { code: 'FORBIDDEN', message: 'אין לך הרשאה' } }, 403)
          : jsonResponse({ items: [notification({})], unreadCount: 1 })
    });
    open();

    const retry = await screen.findByRole('button', { name: 'נסי שוב' });
    expect(screen.getAllByRole('alert')[0]).toHaveTextContent('אין לך הרשאה');
    fail = false;
    await userEvent.click(retry);
    expect(await screen.findByText('שיעור בוטל')).toBeInTheDocument();
  });
});
