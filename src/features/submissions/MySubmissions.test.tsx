import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import App from '@/App';
import { authenticated, callsTo, jsonResponse, makeSubmission, mockApi } from '@/test/fixtures';
import { renderWithProviders } from '@/test/utils';

const createObjectURL = vi.fn(() => 'blob:fake');
const revokeObjectURL = vi.fn();
let clickSpy: ReturnType<typeof vi.spyOn>;
let downloads: string[];

beforeEach(() => {
  downloads = [];
  URL.createObjectURL = createObjectURL;
  URL.revokeObjectURL = revokeObjectURL;
  // לוכדת את ההורדה: שם הקובץ של הקישור שנלחץ
  clickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (this: HTMLAnchorElement) {
    downloads.push(this.download);
  });
});

afterEach(() => {
  clickSpy.mockRestore();
  createObjectURL.mockClear();
  revokeObjectURL.mockClear();
  vi.unstubAllGlobals();
});

const open = () =>
  renderWithProviders(<App />, { route: '/student/submissions', preloadedState: authenticated('STUDENT') });

const feedback = {
  content: 'עבודה טובה, שימי לב לשמות המשתנים',
  createdAt: '2026-10-28T09:00:00.000Z',
  updatedAt: '2026-10-28T09:00:00.000Z',
  teacher: { id: 't1', fullName: 'רחל כהן' }
};

describe('ההגשות שלי', () => {
  it('מציג הגשות עם הקבצים, ההערה והמשוב', async () => {
    mockApi({
      'GET /api/submissions/mine': [
        makeSubmission({ comment: 'לא הצלחתי את שאלה 5', feedback }),
        makeSubmission({ id: 'sub2', homework: { ...makeSubmission().homework, id: 'h2', title: 'תרגיל 4' }, isLate: true })
      ]
    });
    open();

    expect(await screen.findByRole('link', { name: 'תרגיל 3 - מערכים' })).toHaveAttribute('href', '/student/homework/h1');
    expect(screen.getByText('הערה: לא הצלחתי את שאלה 5')).toBeInTheDocument();
    expect(screen.getByText('עבודה טובה, שימי לב לשמות המשתנים')).toBeInTheDocument();
    expect(screen.getByText('משוב מרחל כהן')).toBeInTheDocument();
    expect(screen.getByText('עדיין אין משוב על ההגשה.')).toBeInTheDocument();
    expect(screen.getByText('באיחור')).toBeInTheDocument();
    expect(screen.getAllByText(/exercise1\.zip/)).toHaveLength(2);
  });

  it('בלי הגשות מציג הודעה', async () => {
    mockApi({ 'GET /api/submissions/mine': [] });
    open();
    expect(await screen.findByText('עוד לא הגשת שיעורי בית')).toBeInTheDocument();
  });

  it('הורדת קובץ שולחת את המפתח ושומרת בשם מהשרת', async () => {
    const fetchMock = mockApi({
      'GET /api/submissions/mine': [makeSubmission()],
      'GET /api/submission-files/f1': () =>
        new Response('zipdata', {
          headers: { 'Content-Disposition': `attachment; filename="x"; filename*=UTF-8''%D7%AA%D7%A8%D7%92%D7%99%D7%9C.zip` }
        })
    });
    open();

    await userEvent.click(await screen.findByRole('button', { name: 'הורדת exercise1.zip' }));
    await waitFor(() => expect(downloads).toEqual(['תרגיל.zip']));

    const [[url, init]] = callsTo(fetchMock, 'GET /api/submission-files/f1') as [[string, RequestInit]];
    expect(url).toBe('http://localhost:3000/api/submission-files/f1');
    expect((init.headers as Headers).get('Authorization')).toBe('Bearer test-key');
    expect(createObjectURL).toHaveBeenCalledTimes(1);
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:fake');
  });

  it('כשל בהורדה מציג הודעה קופצת ולא שומר קובץ', async () => {
    mockApi({
      'GET /api/submissions/mine': [makeSubmission()],
      'GET /api/submission-files/f1': () =>
        jsonResponse({ error: { code: 'FORBIDDEN', message: 'אין לך הרשאה לבצע פעולה זו' } }, 403)
    });
    open();

    await userEvent.click(await screen.findByRole('button', { name: 'הורדת exercise1.zip' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('אין לך הרשאה לבצע פעולה זו');
    expect(downloads).toEqual([]);
  });
});
