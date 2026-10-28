import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import App from '@/App';
import type { ThreadMessage } from '@/types/api';
import { authenticated, callsTo, jsonResponse, mockApi } from '@/test/fixtures';
import { renderWithProviders } from '@/test/utils';

afterEach(() => {
  vi.unstubAllGlobals();
});

const message = (over: Partial<ThreadMessage>): ThreadMessage => ({
  id: 'm1',
  body: 'שלום, אפשר להחליף חדר?',
  createdAt: '2026-10-27T08:00:00.000Z',
  readAt: null,
  sender: { id: 'teacher-1', fullName: 'רחל כהן', role: 'TEACHER' },
  isMine: true,
  ...over
});

function setup(initial: ThreadMessage[]) {
  let list = [...initial];
  const fetchMock = mockApi({
    'GET /api/teacher-messages': () => jsonResponse(list),
    'POST /api/teacher-messages': (init) => {
      const { body } = JSON.parse(String(init?.body)) as { body: string };
      const created = message({ id: `m${list.length + 1}`, body });
      list = [...list, created];
      return jsonResponse(created, 201);
    }
  });
  renderWithProviders(<App />, { route: '/teacher/messages', preloadedState: authenticated('TEACHER') });
  return fetchMock;
}

describe('הודעות מורה למזכירה', () => {
  it('מציג את השיחה עם הבחנה בין הודעות שלי להודעות המזכירה', async () => {
    setup([
      message({}),
      message({ id: 'm2', body: 'בוודאי, חדר 12', isMine: false, sender: { id: 'admin-1', fullName: 'שרה המזכירה', role: 'ADMIN' } })
    ]);

    const thread = await screen.findByRole('list', { name: 'הודעות בשיחה' });
    const items = thread.querySelectorAll('li');
    expect(items).toHaveLength(2);
    expect(items[0]).toHaveClass('message--mine');
    expect(items[1]).not.toHaveClass('message--mine');
    expect(screen.getByText('בוודאי, חדר 12')).toBeInTheDocument();
    expect(screen.getByText('שרה המזכירה')).toBeInTheDocument();
  });

  it('שיחה ריקה מציגה הודעה ועדיין אפשר לכתוב', async () => {
    setup([]);
    expect(await screen.findByText('עוד אין הודעות בשיחה. אפשר לכתוב ראשונה')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'שליחה' })).toBeInTheDocument();
  });

  it('שליחת הודעה: ללא teacherId, והשיחה מתעדכנת והטופס מתנקה', async () => {
    const fetchMock = setup([message({})]);
    const user = userEvent.setup();
    await screen.findByText('שלום, אפשר להחליף חדר?');

    await user.type(screen.getByLabelText('הודעה חדשה'), 'תודה רבה');
    await user.click(screen.getByRole('button', { name: 'שליחה' }));

    expect(await screen.findByText('תודה רבה', { selector: 'p' })).toBeInTheDocument();
    const [[, init]] = callsTo(fetchMock, 'POST /api/teacher-messages') as [[string, RequestInit]];
    expect(JSON.parse(String(init.body))).toEqual({ body: 'תודה רבה' });
    expect(screen.getByLabelText('הודעה חדשה')).toHaveValue('');
  });

  it('הודעה ריקה נדחית בצד הלקוח', async () => {
    const fetchMock = setup([]);
    await userEvent.click(await screen.findByRole('button', { name: 'שליחה' }));
    expect(await screen.findByText('חובה לכתוב הודעה')).toBeInTheDocument();
    expect(callsTo(fetchMock, 'POST /api/teacher-messages')).toHaveLength(0);
  });

  it('שגיאת שרת בשליחה מוצגת', async () => {
    const fetchMock = setup([]);
    const user = userEvent.setup();
    await screen.findByText('עוד אין הודעות בשיחה. אפשר לכתוב ראשונה');
    fetchMock.mockImplementation(async (input: RequestInfo | URL, init?: RequestInit) => {
      if (init?.method === 'POST') {
        return jsonResponse({ error: { code: 'INTERNAL_ERROR', message: 'שגיאה פנימית בשרת' } }, 400);
      }
      const url = new URL(String(input));
      if (url.pathname === '/api/notifications') return jsonResponse({ items: [], unreadCount: 0 });
      return jsonResponse([]);
    });

    await user.type(screen.getByLabelText('הודעה חדשה'), 'שלום');
    await user.click(screen.getByRole('button', { name: 'שליחה' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('שגיאה פנימית בשרת');
  });
});
