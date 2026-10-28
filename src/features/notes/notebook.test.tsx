import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import App from '@/App';
import type { Note } from '@/types/api';
import {
  authenticated,
  callsTo,
  jsonResponse,
  makeLesson,
  makeNote,
  mockApi,
  noContent
} from '@/test/fixtures';
import { renderWithProviders } from '@/test/utils';

afterEach(() => {
  vi.unstubAllGlobals();
});

const lessons = [
  makeLesson({ id: 'l1' }),
  makeLesson({ id: 'l2', subject: { id: 's2', name: 'פיתוח Web' }, dayOfWeek: 2, startTime: '11:00' })
];

/** שרת מדומה עם מחברת שנשמרת בזיכרון: הוספה, עריכה, מחיקה וסינון כמו בשרת האמיתי */
function setup(initial: Note[] = [makeNote()]) {
  let notes = [...initial];
  const fetchMock = mockApi({
    'GET /api/lessons': lessons,
    'GET /api/notes': (_init, url) => {
      const lessonId = url.searchParams.get('lessonId');
      const search = url.searchParams.get('search');
      return jsonResponse(
        notes.filter(
          (n) => (!lessonId || n.lesson.id === lessonId) && (!search || n.content.includes(search))
        )
      );
    },
    'POST /api/notes': (init) => {
      const body = JSON.parse(String(init?.body)) as { lessonId: string; content: string };
      const lesson = lessons.find((l) => l.id === body.lessonId)!;
      const note = makeNote({
        id: `n${notes.length + 1}`,
        content: body.content,
        lesson: { id: lesson.id, subject: lesson.subject.name, class: 'ה1', dayOfWeek: lesson.dayOfWeek, startTime: lesson.startTime }
      });
      notes = [note, ...notes];
      return jsonResponse(note, 201);
    },
    'PATCH /api/notes/n1': (init) => {
      const { content } = JSON.parse(String(init?.body)) as { content: string };
      notes = notes.map((n) => (n.id === 'n1' ? { ...n, content } : n));
      return jsonResponse(notes.find((n) => n.id === 'n1'));
    },
    'DELETE /api/notes/n1': () => {
      notes = notes.filter((n) => n.id !== 'n1');
      return noContent();
    }
  });
  renderWithProviders(<App />, { route: '/student/notebook', preloadedState: authenticated('STUDENT') });
  return fetchMock;
}

describe('מחברת אישית', () => {
  it('מציג הערות עם תווית השיעור שבו נכתבו', async () => {
    setup();
    expect(await screen.findByText('לחזור על רקורסיה')).toBeInTheDocument();
    expect(screen.getByTestId('note-label')).toHaveTextContent('מבני נתונים · יום ראשון');
  });

  it('בלי הערות מציג הודעה', async () => {
    setup([]);
    expect(await screen.findByText('אין הערות להצגה')).toBeInTheDocument();
  });

  it('הוספת הערה: ולידציה, ואז שמירה עם תווית השיעור', async () => {
    const fetchMock = setup([]);
    const user = userEvent.setup();
    await screen.findByRole('heading', { name: 'הערה חדשה' });

    await user.click(screen.getByRole('button', { name: 'שמירת הערה' }));
    expect(await screen.findByText('חובה לבחור שיעור')).toBeInTheDocument();
    expect(screen.getByText('חובה לכתוב הערה')).toBeInTheDocument();
    expect(callsTo(fetchMock, 'POST /api/notes')).toHaveLength(0);

    await user.selectOptions(screen.getByLabelText('שיעור'), 'l2');
    await user.type(screen.getByLabelText('ההערה'), 'לשאול על עצים');
    await user.click(screen.getByRole('button', { name: 'שמירת הערה' }));

    expect(await screen.findByText('ההערה נשמרה')).toBeInTheDocument();
    const [[, init]] = callsTo(fetchMock, 'POST /api/notes') as [[string, RequestInit]];
    expect(JSON.parse(String(init.body))).toEqual({ lessonId: 'l2', content: 'לשאול על עצים' });

    expect(await screen.findByText('לשאול על עצים')).toBeInTheDocument();
    expect(screen.getByTestId('note-label')).toHaveTextContent('פיתוח Web · יום שלישי');
    expect(screen.getByLabelText('ההערה')).toHaveValue('');
  });

  it('סינון לפי שיעור שולח lessonId לשרת', async () => {
    const fetchMock = setup([makeNote(), makeNote({ id: 'n2', content: 'הערה על Web', lesson: { id: 'l2', subject: 'פיתוח Web', class: 'ה1', dayOfWeek: 2, startTime: '11:00' } })]);
    await screen.findByText('לחזור על רקורסיה');

    await userEvent.selectOptions(screen.getByLabelText('סינון לפי שיעור'), 'l2');

    await waitFor(() => expect(screen.queryByText('לחזור על רקורסיה')).not.toBeInTheDocument());
    expect(screen.getByText('הערה על Web')).toBeInTheDocument();
    expect(callsTo(fetchMock, 'GET /api/notes').some(([url]) => url.includes('lessonId=l2'))).toBe(true);
  });

  it('חיפוש נשלח לשרת רק אחרי שהמשתמשת הפסיקה להקליד', async () => {
    const fetchMock = setup([makeNote(), makeNote({ id: 'n2', content: 'עצים בינאריים' })]);
    await screen.findByText('לחזור על רקורסיה');
    const before = callsTo(fetchMock, 'GET /api/notes').length;

    await userEvent.type(screen.getByLabelText('חיפוש בהערות'), 'עצים');

    await waitFor(() => expect(screen.queryByText('לחזור על רקורסיה')).not.toBeInTheDocument());
    const searches = callsTo(fetchMock, 'GET /api/notes').filter(([url]) => url.includes('search='));
    // ארבע הקשות, אבל בקשה אחת לשרת (debounce)
    expect(searches).toHaveLength(1);
    expect(searches[0]![0]).toContain(`search=${encodeURIComponent('עצים')}`);
    expect(callsTo(fetchMock, 'GET /api/notes').length).toBe(before + 1);
  });

  it('עריכת הערה שולחת PATCH ומציגה את הטקסט החדש', async () => {
    const fetchMock = setup();
    const user = userEvent.setup();
    await screen.findByText('לחזור על רקורסיה');

    await user.click(screen.getByRole('button', { name: 'עריכה' }));
    const editor = screen.getByLabelText('עריכת הערה');
    expect(editor).toHaveValue('לחזור על רקורסיה');
    await user.clear(editor);
    await user.type(editor, 'לחזור על רקורסיה ועל עצים');
    await user.click(screen.getByRole('button', { name: 'שמירה' }));

    expect(await screen.findByText('ההערה עודכנה')).toBeInTheDocument();
    expect(await screen.findByText('לחזור על רקורסיה ועל עצים')).toBeInTheDocument();
    const [[, init]] = callsTo(fetchMock, 'PATCH /api/notes/n1') as [[string, RequestInit]];
    expect(JSON.parse(String(init.body))).toEqual({ content: 'לחזור על רקורסיה ועל עצים' });
  });

  it('עריכה עם טקסט ריק נדחית, וביטול סוגר את העריכה', async () => {
    const fetchMock = setup();
    const user = userEvent.setup();
    await screen.findByText('לחזור על רקורסיה');

    await user.click(screen.getByRole('button', { name: 'עריכה' }));
    await user.clear(screen.getByLabelText('עריכת הערה'));
    await user.click(screen.getByRole('button', { name: 'שמירה' }));
    expect(await screen.findByText('חובה לכתוב הערה')).toBeInTheDocument();
    expect(callsTo(fetchMock, 'PATCH /api/notes/n1')).toHaveLength(0);

    await user.click(screen.getByRole('button', { name: 'ביטול' }));
    expect(screen.queryByLabelText('עריכת הערה')).not.toBeInTheDocument();
    expect(screen.getByText('לחזור על רקורסיה')).toBeInTheDocument();
  });

  it('מחיקה דורשת אישור, ורק אחריו נשלחת לשרת', async () => {
    const fetchMock = setup();
    const user = userEvent.setup();
    await screen.findByText('לחזור על רקורסיה');

    await user.click(screen.getByRole('button', { name: 'מחיקה' }));
    expect(screen.getByText('בטוחה?')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'ביטול' }));
    expect(callsTo(fetchMock, 'DELETE /api/notes/n1')).toHaveLength(0);

    await user.click(screen.getByRole('button', { name: 'מחיקה' }));
    await user.click(screen.getByRole('button', { name: 'כן, מחיקה' }));

    expect(await screen.findByText('ההערה נמחקה')).toBeInTheDocument();
    await waitFor(() => expect(screen.queryByText('לחזור על רקורסיה')).not.toBeInTheDocument());
    expect(callsTo(fetchMock, 'DELETE /api/notes/n1')).toHaveLength(1);
  });

  it('שגיאת שרת בשמירה מוצגת בטופס', async () => {
    const fetchMock = setup([]);
    const user = userEvent.setup();
    await screen.findByRole('heading', { name: 'הערה חדשה' });
    fetchMock.mockImplementation(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = new URL(String(input));
      if (init?.method === 'POST') {
        return jsonResponse({ error: { code: 'FORBIDDEN', message: 'אפשר להוסיף הערות רק לשיעורים שלך' } }, 403);
      }
      if (url.pathname === '/api/lessons') return jsonResponse(lessons);
      if (url.pathname === '/api/notes') return jsonResponse([]);
      return jsonResponse({ items: [], unreadCount: 0 });
    });

    await user.selectOptions(screen.getByLabelText('שיעור'), 'l1');
    await user.type(screen.getByLabelText('ההערה'), 'משהו');
    await user.click(screen.getByRole('button', { name: 'שמירת הערה' }));

    const form = screen.getByRole('heading', { name: 'הערה חדשה' }).closest('form')!;
    expect(await within(form).findByRole('alert')).toHaveTextContent('אפשר להוסיף הערות רק לשיעורים שלך');
  });
});
