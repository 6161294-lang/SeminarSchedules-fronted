import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import App from '@/App';
import type { Submission } from '@/types/api';
import {
  authenticated,
  callsTo,
  jsonResponse,
  makeHomework,
  makeSubmission,
  mockApi
} from '@/test/fixtures';
import { renderWithProviders } from '@/test/utils';

afterEach(() => {
  vi.unstubAllGlobals();
});

const classes = [
  { id: 'c1', name: 'ה1', grade: 'HEH' },
  { id: 'c2', name: 'ו1', grade: 'VAV' }
];
const subjects = [
  { id: 's1', name: 'מבני נתונים' },
  { id: 's2', name: 'פיתוח Web' }
];

const feedback = {
  content: 'עבודה טובה',
  createdAt: '2026-10-28T09:00:00.000Z',
  updatedAt: '2026-10-28T09:00:00.000Z',
  teacher: { id: 'teacher-1', fullName: 'רחל כהן' }
};

function setup(initial: Submission[] = [makeSubmission()], route = '/teacher/submissions') {
  let list = [...initial];
  const fetchMock = mockApi({
    'GET /api/classes': classes,
    'GET /api/subjects': subjects,
    'GET /api/homeworks': [makeHomework({ id: 'h1' }), makeHomework({ id: 'h2', title: 'תרגיל 4' })],
    'GET /api/submissions': () => jsonResponse(list),
    'PUT /api/submissions/sub1/feedback': (init) => {
      const { content } = JSON.parse(String(init?.body)) as { content: string };
      const saved = { ...feedback, content };
      list = list.map((s) => (s.id === 'sub1' ? { ...s, feedback: saved } : s));
      return jsonResponse(saved);
    }
  });
  renderWithProviders(<App />, { route, preloadedState: authenticated('TEACHER') });
  return fetchMock;
}

const lastSubmissionsUrl = (fetchMock: ReturnType<typeof vi.fn>) =>
  new URL(callsTo(fetchMock, 'GET /api/submissions').at(-1)![0]);

describe('הגשות (מורה)', () => {
  it('מציג הגשה עם שם התלמידה, הכיתה, השיעורי בית, הקבצים וההערה', async () => {
    setup([makeSubmission({ comment: 'לא הצלחתי את שאלה 5', isLate: true })]);

    expect(await screen.findByRole('heading', { name: 'מרים לוי' })).toBeInTheDocument();
    expect(screen.getByText('ה1', { selector: '.badge' })).toBeInTheDocument();
    expect(screen.getByText(/תרגיל 3 - מערכים · מבני נתונים/)).toBeInTheDocument();
    expect(screen.getByText('הערה: לא הצלחתי את שאלה 5')).toBeInTheDocument();
    expect(screen.getByText('באיחור')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'הורדת exercise1.zip' })).toBeInTheDocument();
  });

  it('בלי הגשות מציג הודעה', async () => {
    setup([]);
    expect(await screen.findByText('אין הגשות שמתאימות לסינון')).toBeInTheDocument();
  });

  it('הבקשה הראשונה ממוינת לפי הגשות אחרונות, בלי סינון', async () => {
    const fetchMock = setup();
    await screen.findByRole('heading', { name: 'מרים לוי' });
    const url = lastSubmissionsUrl(fetchMock);
    expect(url.searchParams.get('sortBy')).toBe('submittedAt');
    expect(url.searchParams.get('order')).toBe('desc');
    expect(url.searchParams.has('classId')).toBe(false);
  });

  it('סינון לפי כיתה, מקצוע ושיעורי בית נשלח לשרת', async () => {
    const fetchMock = setup();
    const user = userEvent.setup();
    await screen.findByRole('heading', { name: 'מרים לוי' });
    await screen.findByRole('option', { name: 'ו1' });

    await user.selectOptions(screen.getByLabelText('כיתה'), 'c2');
    await waitFor(() => expect(lastSubmissionsUrl(fetchMock).searchParams.get('classId')).toBe('c2'));

    await user.selectOptions(screen.getByLabelText('מקצוע'), 's2');
    await waitFor(() => expect(lastSubmissionsUrl(fetchMock).searchParams.get('subjectId')).toBe('s2'));

    await user.selectOptions(screen.getByLabelText('שיעורי בית'), 'h2');
    await waitFor(() => {
      const params = lastSubmissionsUrl(fetchMock).searchParams;
      expect(params.get('homeworkId')).toBe('h2');
      expect(params.get('classId')).toBe('c2');
      expect(params.get('subjectId')).toBe('s2');
    });
  });

  it('חיפוש לפי שם נשלח רק אחרי שהפסקה להקליד', async () => {
    const fetchMock = setup();
    await screen.findByRole('heading', { name: 'מרים לוי' });

    await userEvent.type(screen.getByLabelText('חיפוש לפי שם תלמידה'), 'מרים');

    await waitFor(() => expect(lastSubmissionsUrl(fetchMock).searchParams.get('search')).toBe('מרים'));
    const withSearch = callsTo(fetchMock, 'GET /api/submissions').filter(([u]) => u.includes('search='));
    expect(withSearch).toHaveLength(1);
  });

  it('מיון לפי שם תלמידה', async () => {
    const fetchMock = setup();
    await screen.findByRole('heading', { name: 'מרים לוי' });

    await userEvent.selectOptions(screen.getByLabelText('מיון'), 'studentName:asc');
    await waitFor(() => {
      const params = lastSubmissionsUrl(fetchMock).searchParams;
      expect(params.get('sortBy')).toBe('studentName');
      expect(params.get('order')).toBe('asc');
    });
  });

  it('קישור משיעורי הבית מסנן מראש לפי שיעורי הבית', async () => {
    const fetchMock = setup([makeSubmission()], '/teacher/submissions?homeworkId=h2');
    await screen.findByRole('heading', { name: 'מרים לוי' });
    expect(lastSubmissionsUrl(fetchMock).searchParams.get('homeworkId')).toBe('h2');
    await waitFor(() => expect(screen.getByLabelText('שיעורי בית')).toHaveValue('h2'));
  });

  describe('משוב', () => {
    it('אפשר לכתוב משוב, והוא נשלח ונשמר', async () => {
      const fetchMock = setup();
      const user = userEvent.setup();
      await user.type(await screen.findByLabelText('משוב לתלמידה'), 'עבודה מצוינת');
      await user.click(screen.getByRole('button', { name: 'שמירת משוב' }));

      expect(await screen.findByText('המשוב נשמר, והתלמידה קיבלה התראה')).toBeInTheDocument();
      const [[url, init]] = callsTo(fetchMock, 'PUT /api/submissions/sub1/feedback') as [[string, RequestInit]];
      expect(url).toBe('http://localhost:3000/api/submissions/sub1/feedback');
      expect(JSON.parse(String(init.body))).toEqual({ content: 'עבודה מצוינת' });

      // אחרי השמירה מוצג המשוב וכפתור עריכה
      expect(await screen.findByText('עבודה מצוינת')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'עריכת משוב' })).toBeInTheDocument();
    });

    it('משוב ריק נדחה בצד הלקוח', async () => {
      const fetchMock = setup();
      await userEvent.click(await screen.findByRole('button', { name: 'שמירת משוב' }));
      expect(await screen.findByText('חובה לכתוב משוב')).toBeInTheDocument();
      expect(callsTo(fetchMock, 'PUT /api/submissions/sub1/feedback')).toHaveLength(0);
    });

    it('משוב קיים מוצג, ואפשר לערוך אותו', async () => {
      const fetchMock = setup([makeSubmission({ feedback })]);
      const user = userEvent.setup();

      expect(await screen.findByText('עבודה טובה')).toBeInTheDocument();
      expect(screen.queryByLabelText('משוב לתלמידה')).not.toBeInTheDocument();

      await user.click(screen.getByRole('button', { name: 'עריכת משוב' }));
      const editor = screen.getByLabelText('עריכת המשוב');
      expect(editor).toHaveValue('עבודה טובה');
      await user.clear(editor);
      await user.type(editor, 'עבודה טובה מאוד');
      await user.click(screen.getByRole('button', { name: 'שמירת משוב' }));

      expect(await screen.findByText('עבודה טובה מאוד')).toBeInTheDocument();
      const [[, init]] = callsTo(fetchMock, 'PUT /api/submissions/sub1/feedback') as [[string, RequestInit]];
      expect(JSON.parse(String(init.body))).toEqual({ content: 'עבודה טובה מאוד' });
    });

    it('שגיאת שרת בשמירת משוב מוצגת', async () => {
      const fetchMock = setup();
      const user = userEvent.setup();
      await user.type(await screen.findByLabelText('משוב לתלמידה'), 'משוב');
      fetchMock.mockImplementation(async (input: RequestInfo | URL, init?: RequestInit) => {
        if (init?.method === 'PUT') {
          return jsonResponse({ error: { code: 'FORBIDDEN', message: 'ההגשה אינה של שיעור שלך' } }, 403);
        }
        const url = new URL(String(input));
        if (url.pathname === '/api/notifications') return jsonResponse({ items: [], unreadCount: 0 });
        return jsonResponse([]);
      });
      await user.click(screen.getByRole('button', { name: 'שמירת משוב' }));
      expect(await screen.findByRole('alert')).toHaveTextContent('ההגשה אינה של שיעור שלך');
    });
  });
});
