import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import App from '@/App';
import type { Announcement } from '@/types/api';
import { authenticated, callsTo, jsonResponse, mockApi } from '@/test/fixtures';
import { renderWithProviders } from '@/test/utils';

afterEach(() => {
  vi.unstubAllGlobals();
});

const classes = [
  { id: 'c1', name: 'ה1', grade: 'HEH' },
  { id: 'c2', name: 'ו1', grade: 'VAV' }
];

const sent: Announcement = {
  id: 'a1',
  audience: 'CLASS',
  classId: 'c1',
  title: 'שינוי במבחן',
  body: 'המבחן נדחה ליום חמישי',
  createdAt: '2026-10-27T07:00:00.000Z',
  sender: { id: 'admin-1', fullName: 'שרה המזכירה' },
  recipientCount: 3
};

function setup(initial: Announcement[] = [sent]) {
  let list = [...initial];
  const fetchMock = mockApi({
    'GET /api/classes': classes,
    'GET /api/announcements': () => jsonResponse(list),
    'POST /api/announcements': (init) => {
      const body = JSON.parse(String(init?.body)) as Record<string, string>;
      if (body.audience === 'ALL_TEACHERS' && body.title === 'ללא נמענות') {
        return jsonResponse({ error: { code: 'NO_RECIPIENTS', message: 'אין נמענות פעילות לקהל שנבחר' } }, 400);
      }
      const created = { ...sent, id: `a${list.length + 2}`, ...body, createdAt: '2026-10-28T08:00:00.000Z', recipientCount: 7 } as Announcement;
      list = [created, ...list];
      return jsonResponse(created, 201);
    }
  });
  renderWithProviders(<App />, { route: '/admin/announcements', preloadedState: authenticated('ADMIN') });
  return fetchMock;
}

const submit = () => userEvent.click(screen.getByRole('button', { name: 'שליחה' }));

describe('הודעות מהמזכירה', () => {
  it('מציג את ההודעות שנשלחו עם הקהל ומספר הנמענות', async () => {
    setup();
    expect(await screen.findByRole('heading', { name: 'שינוי במבחן' })).toBeInTheDocument();
    expect(await screen.findByText('כיתה ה1 · 3 נמענות')).toBeInTheDocument();
    expect(screen.getByText('המבחן נדחה ליום חמישי')).toBeInTheDocument();
  });

  it('בלי הודעות מציג הודעה', async () => {
    setup([]);
    expect(await screen.findByText('עוד לא נשלחו הודעות')).toBeInTheDocument();
  });

  it('שדות מחזור וכיתה מופיעים רק לפי הקהל שנבחר', async () => {
    setup();
    const user = userEvent.setup();
    const audience = await screen.findByLabelText('למי לשלוח');
    expect(screen.queryByLabelText('מחזור')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('כיתה')).not.toBeInTheDocument();

    await user.selectOptions(audience, 'GRADE');
    expect(screen.getByLabelText('מחזור')).toBeInTheDocument();
    expect(screen.queryByLabelText('כיתה')).not.toBeInTheDocument();

    await user.selectOptions(audience, 'CLASS');
    expect(screen.getByLabelText('כיתה')).toBeInTheDocument();
    expect(screen.queryByLabelText('מחזור')).not.toBeInTheDocument();
  });

  it('ולידציה: כותרת ותוכן חובה, ומחזור וכיתה לפי הקהל', async () => {
    const fetchMock = setup();
    const user = userEvent.setup();
    await screen.findByLabelText('למי לשלוח');

    await submit();
    expect(await screen.findByText('חובה להזין כותרת')).toBeInTheDocument();
    expect(screen.getByText('חובה לכתוב את ההודעה')).toBeInTheDocument();

    await user.selectOptions(screen.getByLabelText('למי לשלוח'), 'GRADE');
    await submit();
    expect(await screen.findByText('חובה לבחור מחזור')).toBeInTheDocument();

    await user.selectOptions(screen.getByLabelText('למי לשלוח'), 'CLASS');
    await submit();
    expect(await screen.findByText('חובה לבחור כיתה')).toBeInTheDocument();
    expect(callsTo(fetchMock, 'POST /api/announcements')).toHaveLength(0);
  });

  it('שליחה לכל התלמידות: בלי מחזור וכיתה, והטופס מתנקה', async () => {
    const fetchMock = setup();
    const user = userEvent.setup();
    await user.type(await screen.findByLabelText('כותרת'), 'ברוכות הבאות');
    await user.type(screen.getByLabelText('תוכן ההודעה'), 'שנה טובה');
    await submit();

    expect(await screen.findByText('ההודעה נשלחה ל-7 נמענות')).toBeInTheDocument();
    const [[, init]] = callsTo(fetchMock, 'POST /api/announcements') as [[string, RequestInit]];
    expect(JSON.parse(String(init.body))).toEqual({
      audience: 'ALL_STUDENTS',
      title: 'ברוכות הבאות',
      body: 'שנה טובה'
    });
    expect(screen.getByLabelText('כותרת')).toHaveValue('');
    expect(await screen.findByRole('heading', { name: 'ברוכות הבאות' })).toBeInTheDocument();
  });

  it('שליחה למחזור ולכיתה שולחת grade או classId בהתאם', async () => {
    const fetchMock = setup();
    const user = userEvent.setup();
    await screen.findByLabelText('למי לשלוח');

    await user.selectOptions(screen.getByLabelText('למי לשלוח'), 'GRADE');
    await user.selectOptions(screen.getByLabelText('מחזור'), 'VAV');
    await user.type(screen.getByLabelText('כותרת'), 'למחזור ו׳');
    await user.type(screen.getByLabelText('תוכן ההודעה'), 'תוכן');
    await submit();
    await screen.findByText('ההודעה נשלחה ל-7 נמענות');

    await user.selectOptions(screen.getByLabelText('למי לשלוח'), 'CLASS');
    await screen.findByRole('option', { name: 'ו1' });
    await user.selectOptions(screen.getByLabelText('כיתה'), 'c2');
    await user.type(screen.getByLabelText('כותרת'), 'לכיתה ו1');
    await user.type(screen.getByLabelText('תוכן ההודעה'), 'תוכן');
    await submit();

    const calls = callsTo(fetchMock, 'POST /api/announcements');
    await vi.waitFor(() => expect(callsTo(fetchMock, 'POST /api/announcements')).toHaveLength(2));
    expect(JSON.parse(String(calls[0]![1].body))).toEqual({ audience: 'GRADE', grade: 'VAV', title: 'למחזור ו׳', body: 'תוכן' });
    expect(JSON.parse(String(callsTo(fetchMock, 'POST /api/announcements')[1]![1].body))).toEqual({
      audience: 'CLASS',
      classId: 'c2',
      title: 'לכיתה ו1',
      body: 'תוכן'
    });
  });

  it('שגיאת שרת (אין נמענות) מוצגת בטופס', async () => {
    setup();
    const user = userEvent.setup();
    await user.selectOptions(await screen.findByLabelText('למי לשלוח'), 'ALL_TEACHERS');
    await user.type(screen.getByLabelText('כותרת'), 'ללא נמענות');
    await user.type(screen.getByLabelText('תוכן ההודעה'), 'תוכן');
    await submit();
    expect(await screen.findByRole('alert')).toHaveTextContent('אין נמענות פעילות לקהל שנבחר');
  });
});
