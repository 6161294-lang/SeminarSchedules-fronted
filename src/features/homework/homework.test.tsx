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
import { MAX_FILE_BYTES } from './submissionRules';

afterEach(() => {
  vi.unstubAllGlobals();
});

const openStudent = (route: string) =>
  renderWithProviders(<App />, { route, preloadedState: authenticated('STUDENT') });

const SUBMIT = 'POST /api/homeworks/h1/submission';
const fileInput = () => screen.getByLabelText(/^קבצים/);

describe('רשימת שיעורי בית', () => {
  it('מציג סטטוס הגשה לכל שיעורי בית', async () => {
    mockApi({
      'GET /api/homeworks': [
        makeHomework({ id: 'a', title: 'עוד לא הוגש' }),
        makeHomework({ id: 'b', title: 'כבר הוגש', mySubmission: { id: 's', submittedAt: '2026-10-27T10:00:00.000Z' } }),
        makeHomework({ id: 'c', title: 'עבר הזמן', dueDate: '2000-01-01' })
      ]
    });
    openStudent('/student/homework');

    expect(await screen.findByRole('link', { name: 'עוד לא הוגש' })).toHaveAttribute('href', '/student/homework/a');
    expect(screen.getByText('טרם הוגש')).toBeInTheDocument();
    expect(screen.getByText('הוגש')).toBeInTheDocument();
    expect(screen.getByText('עבר מועד ההגשה')).toBeInTheDocument();
  });

  it('סינון "מועד ההגשה לא עבר" שולח upcoming לשרת', async () => {
    const fetchMock = mockApi({ 'GET /api/homeworks': [makeHomework()] });
    openStudent('/student/homework');
    await screen.findByText('תרגיל 3 - מערכים');

    await userEvent.selectOptions(screen.getByLabelText('הצגה'), 'upcoming');
    await waitFor(() =>
      expect(callsTo(fetchMock, 'GET /api/homeworks').some(([url]) => url.includes('upcoming=true'))).toBe(true)
    );
  });

  it('בלי שיעורי בית מציג הודעה', async () => {
    mockApi({ 'GET /api/homeworks': [] });
    openStudent('/student/homework');
    expect(await screen.findByText('אין שיעורי בית להצגה')).toBeInTheDocument();
  });
});

describe('עמוד שיעורי בית והגשה', () => {
  const setup = (opts: { submissions?: Submission[]; homework?: ReturnType<typeof makeHomework> } = {}) => {
    const state = { submissions: opts.submissions ?? [] };
    const fetchMock = mockApi({
      'GET /api/homeworks/h1': opts.homework ?? makeHomework(),
      'GET /api/submissions/mine': () => jsonResponse(state.submissions),
      [SUBMIT]: (init) => {
        const form = init?.body as FormData;
        const submission = makeSubmission({
          comment: String(form.get('comment') ?? '') || null,
          updatedAt: '2026-10-28T09:00:00.000Z',
          files: form.getAll('files').map((f, i) => ({
            id: `new${i}`,
            fileName: (f as File).name,
            mimeType: 'text/plain',
            sizeBytes: (f as File).size
          }))
        });
        state.submissions = [submission];
        return jsonResponse(submission, 201);
      }
    });
    openStudent('/student/homework/h1');
    return { fetchMock, state };
  };

  it('מציג את ההסבר, התאריך וטופס הגשה', async () => {
    setup();
    expect(await screen.findByRole('heading', { name: 'תרגיל 3 - מערכים' })).toBeInTheDocument();
    expect(screen.getByText('פתרי את שאלות 1-5 בעמוד 42')).toBeInTheDocument();
    expect(screen.getByText(/להגשה עד 01\.01\.2999/)).toBeInTheDocument();
    expect(await screen.findByRole('heading', { name: 'הגשת שיעורי הבית' })).toBeInTheDocument();
    expect(screen.queryByText('ההגשה שלי')).not.toBeInTheDocument();
  });

  it('הגשה בלי קבצים נדחית בצד הלקוח', async () => {
    const { fetchMock } = setup();
    await userEvent.click(await screen.findByRole('button', { name: 'הגשה' }));
    expect(await screen.findByText('חובה לצרף לפחות קובץ אחד')).toBeInTheDocument();
    expect(callsTo(fetchMock, SUBMIT)).toHaveLength(0);
  });

  it('דוחה סוג קובץ לא מותר', async () => {
    const { fetchMock } = setup();
    const user = userEvent.setup({ applyAccept: false });
    await user.upload(await screen.findByLabelText(/^קבצים/), new File(['MZ'], 'virus.exe'));
    await user.click(screen.getByRole('button', { name: 'הגשה' }));
    expect(await screen.findByText('סוג הקובץ "virus.exe" אינו מותר')).toBeInTheDocument();
    expect(callsTo(fetchMock, SUBMIT)).toHaveLength(0);
  });

  it('דוחה יותר מ-5 קבצים וקובץ גדול מדי', async () => {
    const { fetchMock } = setup();
    const user = userEvent.setup();
    await screen.findByRole('button', { name: 'הגשה' });

    await user.upload(fileInput(), Array.from({ length: 6 }, (_, i) => new File(['x'], `f${i}.txt`)));
    await user.click(screen.getByRole('button', { name: 'הגשה' }));
    expect(await screen.findByText('אפשר להעלות עד 5 קבצים')).toBeInTheDocument();

    await user.upload(fileInput(), new File([new Uint8Array(MAX_FILE_BYTES + 1)], 'big.zip'));
    await user.click(screen.getByRole('button', { name: 'הגשה' }));
    expect(await screen.findByText(/הקובץ "big.zip" גדול מדי/)).toBeInTheDocument();
    expect(callsTo(fetchMock, SUBMIT)).toHaveLength(0);
  });

  it('הגשה מוצלחת שולחת multipart עם הקבצים וההערה, ואז מציגה את ההגשה', async () => {
    const { fetchMock } = setup();
    const user = userEvent.setup();
    await screen.findByRole('button', { name: 'הגשה' });

    await user.upload(fileInput(), [new File(['hello'], 'a.txt'), new File(['zip'], 'b.zip')]);
    await user.type(screen.getByLabelText('הערה להגשה (אופציונלי)'), 'לא הצלחתי את שאלה 5');
    await user.click(screen.getByRole('button', { name: 'הגשה' }));

    expect(await screen.findByText('ההגשה נשלחה בהצלחה')).toBeInTheDocument();

    const [[, init]] = callsTo(fetchMock, SUBMIT) as [[string, RequestInit]];
    const form = init.body as FormData;
    expect(form).toBeInstanceOf(FormData);
    expect(form.getAll('files').map((f) => (f as File).name)).toEqual(['a.txt', 'b.zip']);
    expect(form.get('comment')).toBe('לא הצלחתי את שאלה 5');
    expect((init.headers as Headers).get('Content-Type')).toBeNull();
    expect((init.headers as Headers).get('Authorization')).toBe('Bearer test-key');

    // אחרי הרענון: ההגשה מוצגת והטופס הופך לשליחה חוזרת
    expect(await screen.findByRole('heading', { name: 'ההגשה שלי' })).toBeInTheDocument();
    expect(await screen.findByRole('heading', { name: 'שליחה חוזרת' })).toBeInTheDocument();
    expect(screen.getByText('a.txt', { exact: false })).toBeInTheDocument();
  });

  it('שגיאת שרת בהגשה מוצגת בטופס', async () => {
    const { fetchMock } = setup();
    fetchMock.mockImplementation(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = new URL(String(input));
      if (init?.method === 'POST' && url.pathname.endsWith('/submission')) {
        return jsonResponse({ error: { code: 'FILE_TOO_LARGE', message: 'הקובץ גדול מדי (עד 5MB לקובץ)' } }, 413);
      }
      if (url.pathname === '/api/homeworks/h1') return jsonResponse(makeHomework());
      if (url.pathname === '/api/submissions/mine') return jsonResponse([]);
      return jsonResponse({ items: [], unreadCount: 0 });
    });
    const user = userEvent.setup();
    await screen.findByRole('button', { name: 'הגשה' });
    await user.upload(fileInput(), new File(['x'], 'a.txt'));
    await user.click(screen.getByRole('button', { name: 'הגשה' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('הקובץ גדול מדי (עד 5MB לקובץ)');
  });

  it('בזמן שליחה הכפתור מושבת ומציג "שולחת..."', async () => {
    const { fetchMock } = setup();
    fetchMock.mockImplementation(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = new URL(String(input));
      if (init?.method === 'POST') return new Promise<Response>(() => undefined);
      if (url.pathname === '/api/homeworks/h1') return jsonResponse(makeHomework());
      if (url.pathname === '/api/submissions/mine') return jsonResponse([]);
      return jsonResponse({ items: [], unreadCount: 0 });
    });
    const user = userEvent.setup();
    await screen.findByRole('button', { name: 'הגשה' });
    await user.upload(fileInput(), new File(['x'], 'a.txt'));
    await user.click(screen.getByRole('button', { name: 'הגשה' }));
    expect(await screen.findByRole('button', { name: 'שולחת...' })).toBeDisabled();
  });

  it('הגשה קיימת: מציגה קבצים, משוב ואיחור, ומאפשרת עדכון הערה בלבד', async () => {
    const { fetchMock } = setup({
      submissions: [
        makeSubmission({
          comment: 'ההערה הישנה',
          isLate: true,
          feedback: {
            content: 'עבודה טובה מאוד',
            createdAt: '2026-10-28T09:00:00.000Z',
            updatedAt: '2026-10-28T09:00:00.000Z',
            teacher: { id: 't1', fullName: 'רחל כהן' }
          }
        })
      ]
    });
    const user = userEvent.setup();

    expect(await screen.findByRole('heading', { name: 'ההגשה שלי' })).toBeInTheDocument();
    expect(screen.getByText('באיחור')).toBeInTheDocument();
    expect(screen.getByText('עבודה טובה מאוד')).toBeInTheDocument();
    expect(screen.getByText(/exercise1\.zip/)).toBeInTheDocument();

    const comment = await screen.findByLabelText('הערה להגשה (אופציונלי)');
    expect(comment).toHaveValue('ההערה הישנה');
    await user.clear(comment);
    await user.type(comment, 'הערה חדשה');
    await user.click(screen.getByRole('button', { name: 'שליחה חוזרת' }));

    expect(await screen.findByText('ההגשה עודכנה')).toBeInTheDocument();
    const [[, init]] = callsTo(fetchMock, SUBMIT) as [[string, RequestInit]];
    const form = init.body as FormData;
    expect(form.getAll('files')).toHaveLength(0);
    expect(form.get('comment')).toBe('הערה חדשה');
  });

  it('מועד הגשה שעבר מציג הודעה מראש', async () => {
    setup({ homework: makeHomework({ dueDate: '2000-01-01' }) });
    expect(await screen.findByText('מועד ההגשה עבר. ההגשה תסומן כמאוחרת.')).toBeInTheDocument();
  });

  it('שיעורי בית שלא נמצאו (404) מציגים את הודעת השרת', async () => {
    mockApi({
      'GET /api/homeworks/h1': () =>
        jsonResponse({ error: { code: 'NOT_FOUND', message: 'שיעור הבית לא נמצא' } }, 404)
    });
    openStudent('/student/homework/h1');
    expect(await screen.findByText('שיעור הבית לא נמצא')).toBeInTheDocument();
  });
});
