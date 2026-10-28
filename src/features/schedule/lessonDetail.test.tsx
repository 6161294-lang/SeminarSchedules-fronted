import { fireEvent, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import App from '@/App';
import type { Homework, Note } from '@/types/api';
import {
  authenticated,
  callsTo,
  jsonResponse,
  makeHomework,
  makeLesson,
  makeNote,
  mockApi
} from '@/test/fixtures';
import { renderWithProviders } from '@/test/utils';

beforeEach(() => {
  // 2026-11-01 הוא יום ראשון בישראל
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date('2026-11-01T09:00:00+02:00'));
});
afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

function setup(lesson = makeLesson(), opts: { homeworks?: Homework[]; notes?: Note[] } = {}) {
  const state = { homeworks: opts.homeworks ?? [], notes: opts.notes ?? [] };
  const fetchMock = mockApi({
    [`GET /api/lessons/${lesson.id}`]: lesson,
    'GET /api/homeworks': () => jsonResponse(state.homeworks),
    'POST /api/homeworks': (init) => {
      const body = JSON.parse(String(init?.body)) as { title: string; description: string; dueDate: string };
      const created = makeHomework({ id: 'new1', title: body.title, description: body.description, dueDate: body.dueDate, submissionsCount: 0 });
      state.homeworks = [created];
      return jsonResponse(created, 201);
    },
    'GET /api/notes': () => jsonResponse(state.notes),
    'POST /api/notes': (init) => {
      const body = JSON.parse(String(init?.body)) as { content: string };
      const note = makeNote({ id: 'n9', content: body.content });
      state.notes = [note];
      return jsonResponse(note, 201);
    }
  });
  renderWithProviders(<App />, {
    route: `/teacher/lesson/${lesson.id}`,
    preloadedState: authenticated('TEACHER')
  });
  return fetchMock;
}

const fillHomework = (title: string, description: string, dueDate: string) => {
  fireEvent.change(screen.getByLabelText('כותרת'), { target: { value: title } });
  fireEvent.change(screen.getByLabelText('הסבר על המשימה'), { target: { value: description } });
  fireEvent.change(screen.getByLabelText('תאריך הגשה'), { target: { value: dueDate } });
};

describe('עמוד שיעור של המורה', () => {
  it('מציג את פרטי השיעור', async () => {
    setup();
    expect(await screen.findByRole('heading', { name: 'מבני נתונים' })).toBeInTheDocument();
    expect(screen.getByText(/כיתה ה1 · יום ראשון 09:00–10:30 · חדר 101/)).toBeInTheDocument();
  });

  it('בשיעור של היום אפשר להוסיף שיעורי בית, עם ולידציה', async () => {
    const fetchMock = setup();
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    await screen.findByRole('heading', { name: 'הוספת שיעורי בית להיום' });

    await user.click(screen.getByRole('button', { name: 'הוספת שיעורי בית' }));
    expect(await screen.findByText('חובה להזין כותרת')).toBeInTheDocument();
    expect(screen.getByText('חובה להזין הסבר')).toBeInTheDocument();
    expect(screen.getByText('חובה לבחור תאריך הגשה')).toBeInTheDocument();

    fillHomework('תרגיל 3', 'שאלות 1-5', '2026-11-01'); // היום, לא מותר
    await user.click(screen.getByRole('button', { name: 'הוספת שיעורי בית' }));
    expect(await screen.findByText('תאריך ההגשה חייב להיות אחרי היום')).toBeInTheDocument();
    expect(callsTo(fetchMock, 'POST /api/homeworks')).toHaveLength(0);
  });

  it('יצירה מוצלחת שולחת את הנתונים ומציגה את שיעורי הבית ברשימה', async () => {
    const fetchMock = setup();
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    await screen.findByRole('heading', { name: 'הוספת שיעורי בית להיום' });

    fillHomework('תרגיל 3', 'שאלות 1-5', '2026-11-05');
    await user.click(screen.getByRole('button', { name: 'הוספת שיעורי בית' }));

    expect(await screen.findByText('שיעורי הבית נוצרו, והתלמידות קיבלו התראה')).toBeInTheDocument();
    const [[, init]] = callsTo(fetchMock, 'POST /api/homeworks') as [[string, RequestInit]];
    expect(JSON.parse(String(init.body))).toEqual({
      lessonId: 'l1',
      title: 'תרגיל 3',
      description: 'שאלות 1-5',
      dueDate: '2026-11-05'
    });
    expect(await screen.findByRole('heading', { name: 'תרגיל 3' })).toBeInTheDocument();
    expect(screen.getByLabelText('כותרת')).toHaveValue('');
  });

  it('שגיאת שרת ביצירה מוצגת בטופס', async () => {
    const fetchMock = setup();
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    await screen.findByRole('heading', { name: 'הוספת שיעורי בית להיום' });
    fetchMock.mockImplementation(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = new URL(String(input));
      if (init?.method === 'POST') {
        return jsonResponse({ error: { code: 'NOT_TODAYS_LESSON', message: 'אפשר להוסיף שיעורי בית רק לשיעור שמתקיים היום' } }, 400);
      }
      if (url.pathname === '/api/lessons/l1') return jsonResponse(makeLesson());
      if (url.pathname === '/api/notifications') return jsonResponse({ items: [], unreadCount: 0 });
      return jsonResponse([]);
    });

    fillHomework('תרגיל', 'הסבר', '2026-11-05');
    await user.click(screen.getByRole('button', { name: 'הוספת שיעורי בית' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('אפשר להוסיף שיעורי בית רק לשיעור שמתקיים היום');
  });

  it('בשיעור שלא מתקיים היום אין טופס, ומוצגת הסבר', async () => {
    setup(makeLesson({ dayOfWeek: 2 }));
    expect(await screen.findByText(/אפשר להוסיף שיעורי בית רק בשיעור שמתקיים היום/)).toBeInTheDocument();
    expect(screen.getByText(/השיעור הזה מתקיים ביום שלישי/)).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'הוספת שיעורי בית להיום' })).not.toBeInTheDocument();
  });

  it('מציג את שיעורי הבית הקיימים של השיעור', async () => {
    setup(makeLesson(), { homeworks: [makeHomework({ id: 'h5', title: 'תרגיל קיים', submissionsCount: 2 })] });
    expect(await screen.findByRole('heading', { name: 'תרגיל קיים' })).toBeInTheDocument();
    expect(screen.getByText('2 הגשות')).toBeInTheDocument();
  });

  it('הערות אישיות: השיעור כבר נבחר, ההערה נשמרת עליו', async () => {
    const fetchMock = setup();
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    const notesForm = (await screen.findByRole('heading', { name: 'הערה חדשה' })).closest('form')!;

    expect(within(notesForm).getByLabelText('שיעור')).toHaveValue('l1');
    await user.type(within(notesForm).getByLabelText('ההערה'), 'להקדיש זמן ללולאות');
    await user.click(within(notesForm).getByRole('button', { name: 'שמירת הערה' }));

    expect(await screen.findByText('ההערה נשמרה')).toBeInTheDocument();
    const [[, init]] = callsTo(fetchMock, 'POST /api/notes') as [[string, RequestInit]];
    expect(JSON.parse(String(init.body))).toEqual({ lessonId: 'l1', content: 'להקדיש זמן ללולאות' });
    expect(await screen.findByText('להקדיש זמן ללולאות')).toBeInTheDocument();
  });

  it('שיעור שלא נמצא (למשל של מורה אחרת) מציג את הודעת השרת', async () => {
    mockApi({
      'GET /api/lessons/other': () => jsonResponse({ error: { code: 'NOT_FOUND', message: 'השיעור לא נמצא' } }, 404)
    });
    renderWithProviders(<App />, { route: '/teacher/lesson/other', preloadedState: authenticated('TEACHER') });
    expect(await screen.findByText('השיעור לא נמצא')).toBeInTheDocument();
  });
});
