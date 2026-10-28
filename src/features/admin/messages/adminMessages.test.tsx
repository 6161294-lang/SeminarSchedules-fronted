import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import App from '@/App';
import type { ThreadMessage, ThreadSummary } from '@/types/api';
import { authenticated, callsTo, jsonResponse, makeUser, mockApi } from '@/test/fixtures';
import { renderWithProviders } from '@/test/utils';

afterEach(() => {
  vi.unstubAllGlobals();
});

const teachers = [
  makeUser('TEACHER', { id: 't1', fullName: 'רחל כהן' }),
  makeUser('TEACHER', { id: 't2', fullName: 'לאה מזרחי' })
];

const fromTeacher: ThreadMessage = {
  id: 'm1',
  body: 'אפשר להחליף חדר?',
  createdAt: '2026-10-27T08:00:00.000Z',
  readAt: null,
  sender: { id: 't1', fullName: 'רחל כהן', role: 'TEACHER' },
  isMine: false
};

function setup(unread = 2) {
  let messages: Record<string, ThreadMessage[]> = { t1: [fromTeacher], t2: [] };
  let threads: ThreadSummary[] = [
    {
      teacher: { id: 't1', fullName: 'רחל כהן' },
      lastMessage: { body: 'אפשר להחליף חדר?', createdAt: '2026-10-27T08:00:00.000Z', senderId: 't1' },
      unreadCount: unread
    }
  ];
  const fetchMock = mockApi({
    'GET /api/users': { items: teachers, total: 2, page: 1, limit: 200 },
    'GET /api/teacher-messages/threads': () => jsonResponse(threads),
    'GET /api/teacher-messages': (_init, url) => {
      const id = url.searchParams.get('teacherId') ?? '';
      // פתיחת שיחה מסמנת כנקראו, כמו בשרת
      threads = threads.map((t) => (t.teacher.id === id ? { ...t, unreadCount: 0 } : t));
      return jsonResponse(messages[id] ?? []);
    },
    'POST /api/teacher-messages': (init) => {
      const body = JSON.parse(String(init?.body)) as { teacherId: string; body: string };
      const created: ThreadMessage = {
        id: `m${Date.now()}`,
        body: body.body,
        createdAt: '2026-10-28T09:00:00.000Z',
        readAt: null,
        sender: { id: 'admin-1', fullName: 'שרה המזכירה', role: 'ADMIN' },
        isMine: true
      };
      messages = { ...messages, [body.teacherId]: [...(messages[body.teacherId] ?? []), created] };
      return jsonResponse(created, 201);
    }
  });
  return fetchMock;
}

const open = (route = '/admin/messages') =>
  renderWithProviders(<App />, { route, preloadedState: authenticated('ADMIN') });

describe('שיחות עם מורות (מזכירה)', () => {
  it('מציג רשימת שיחות עם מונה "לא נקראו" והודעה אחרונה', async () => {
    setup();
    open();

    const list = await screen.findByRole('list', { name: 'שיחות' });
    expect(within(list).getByText('רחל כהן')).toBeInTheDocument();
    expect(within(list).getByLabelText('2 הודעות שלא נקראו')).toBeInTheDocument();
    expect(within(list).getByText('אפשר להחליף חדר?')).toBeInTheDocument();
    expect(screen.getByText('בחרי שיחה מהרשימה, או התחילי שיחה חדשה עם מורה.')).toBeInTheDocument();
  });

  it('פתיחת שיחה טוענת אותה עם teacherId, ומרעננת את המונה', async () => {
    const fetchMock = setup();
    open();
    const user = userEvent.setup();

    await user.click(await screen.findByRole('button', { name: /רחל כהן/ }));

    expect(await screen.findByRole('heading', { name: 'שיחה עם רחל כהן' })).toBeInTheDocument();
    const thread = await screen.findByRole('list', { name: 'הודעות בשיחה' });
    expect(within(thread).getByText('אפשר להחליף חדר?')).toBeInTheDocument();
    expect(callsTo(fetchMock, 'GET /api/teacher-messages')[0]![0]).toContain('teacherId=t1');

    // אחרי הפתיחה השרת סימן כנקראו, והרשימה התרעננה
    await waitFor(() => expect(screen.queryByLabelText('2 הודעות שלא נקראו')).not.toBeInTheDocument());
  });

  it('שליחת תשובה שולחת teacherId וגוף הודעה, והשיחה מתעדכנת', async () => {
    const fetchMock = setup(0);
    open('/admin/messages?teacherId=t1');
    const user = userEvent.setup();

    await screen.findByText('אפשר להחליף חדר?', { selector: 'p' });
    await user.type(screen.getByLabelText('הודעה חדשה'), 'בוודאי, חדר 12');
    await user.click(screen.getByRole('button', { name: 'שליחה' }));

    expect(await screen.findByText('בוודאי, חדר 12', { selector: 'p' })).toBeInTheDocument();
    const [[, init]] = callsTo(fetchMock, 'POST /api/teacher-messages') as [[string, RequestInit]];
    expect(JSON.parse(String(init.body))).toEqual({ teacherId: 't1', body: 'בוודאי, חדר 12' });
    expect(screen.getByLabelText('הודעה חדשה')).toHaveValue('');
  });

  it('התחלת שיחה חדשה עם מורה שאין איתה שיחה', async () => {
    const fetchMock = setup();
    open();
    const user = userEvent.setup();

    await screen.findByRole('list', { name: 'שיחות' });
    await screen.findByRole('option', { name: 'לאה מזרחי' });
    await user.selectOptions(screen.getByLabelText('שיחה חדשה עם מורה'), 't2');

    expect(await screen.findByRole('heading', { name: 'שיחה עם לאה מזרחי' })).toBeInTheDocument();
    expect(await screen.findByText('עוד אין הודעות בשיחה. אפשר לכתוב ראשונה')).toBeInTheDocument();
    expect(callsTo(fetchMock, 'GET /api/teacher-messages').some(([u]) => u.includes('teacherId=t2'))).toBe(true);

    await user.type(screen.getByLabelText('הודעה חדשה'), 'שלום לאה');
    await user.click(screen.getByRole('button', { name: 'שליחה' }));
    expect(await screen.findByText('שלום לאה', { selector: 'p' })).toBeInTheDocument();
    const [[, init]] = callsTo(fetchMock, 'POST /api/teacher-messages') as [[string, RequestInit]];
    expect(JSON.parse(String(init.body))).toEqual({ teacherId: 't2', body: 'שלום לאה' });
  });

  it('בלי שיחות מוצגת הודעה', async () => {
    const fetchMock = setup();
    fetchMock.mockImplementation(async (input: RequestInfo | URL) => {
      const url = new URL(String(input));
      if (url.pathname === '/api/teacher-messages/threads') return jsonResponse([]);
      if (url.pathname === '/api/users') return jsonResponse({ items: teachers, total: 2, page: 1, limit: 200 });
      return jsonResponse({ items: [], unreadCount: 0 });
    });
    open();
    expect(await screen.findByText('עוד אין שיחות')).toBeInTheDocument();
  });
});
