import { fireEvent, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import App from '@/App';
import type { Homework } from '@/types/api';
import {
  authenticated,
  callsTo,
  jsonResponse,
  makeHomework,
  makeLesson,
  mockApi,
  noContent
} from '@/test/fixtures';
import { renderWithProviders } from '@/test/utils';

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

const setDate = (iso: string) => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date(iso));
};

const open = () =>
  renderWithProviders(<App />, { route: '/teacher/homework', preloadedState: authenticated('TEACHER') });

describe('שיעורי בית של המורה', () => {
  it('מציג את שיעורי היום עם קישור להוספת שיעורי בית', async () => {
    setDate('2026-11-01T09:00:00+02:00'); // ראשון
    mockApi({
      'GET /api/lessons/day/0': { dayOfWeek: 0, name: 'ראשון', lessons: [makeLesson()] },
      'GET /api/homeworks': []
    });
    open();

    expect(await screen.findByRole('heading', { name: 'שיעורי היום (יום ראשון)' })).toBeInTheDocument();
    expect(await screen.findByText(/מבני נתונים · ה1/)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'הוספת שיעורי בית' })).toHaveAttribute('href', '/teacher/lesson/l1');
    expect(await screen.findByText('עוד לא נוספו שיעורי בית')).toBeInTheDocument();
  });

  it('בשבת אין שיעורים ולא פונים לשרת בשביל היום', async () => {
    setDate('2026-10-31T10:00:00+02:00'); // שבת
    const fetchMock = mockApi({ 'GET /api/homeworks': [] });
    open();

    expect(await screen.findByText('היום שבת, אין שיעורים.')).toBeInTheDocument();
    expect(fetchMock.mock.calls.some(([url]) => String(url).includes('/api/lessons/day'))).toBe(false);
  });

  it('מציג מספר הגשות וקישור להגשות של שיעורי הבית', async () => {
    setDate('2026-11-01T09:00:00+02:00');
    mockApi({
      'GET /api/lessons/day/0': { dayOfWeek: 0, name: 'ראשון', lessons: [] },
      'GET /api/homeworks': [makeHomework({ submissionsCount: 3 })]
    });
    open();

    expect(await screen.findByText('3 הגשות')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'צפייה בהגשות' })).toHaveAttribute(
      'href',
      '/teacher/submissions?homeworkId=h1'
    );
    expect(screen.getByText('אין לך שיעורים היום')).toBeInTheDocument();
  });

  describe('עריכה ומחיקה', () => {
    const setup = (initial: Homework[] = [makeHomework({ submissionsCount: 1 })]) => {
      let list = [...initial];
      const fetchMock = mockApi({
        'GET /api/lessons/day/0': { dayOfWeek: 0, name: 'ראשון', lessons: [] },
        'GET /api/homeworks': () => jsonResponse(list),
        'PATCH /api/homeworks/h1': (init) => {
          const body = JSON.parse(String(init?.body)) as Partial<Homework>;
          list = list.map((h) => (h.id === 'h1' ? { ...h, ...body } : h));
          return jsonResponse(list[0]);
        },
        'DELETE /api/homeworks/h1': () => {
          list = [];
          return noContent();
        }
      });
      setDate('2026-11-01T09:00:00+02:00');
      open();
      return fetchMock;
    };

    it('עריכה שולחת PATCH ומעדכנת את הרשימה', async () => {
      const fetchMock = setup();
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      await screen.findByText('3 הגשות', {}, { timeout: 100 }).catch(() => undefined);
      await user.click(await screen.findByRole('button', { name: 'עריכה' }));

      const title = screen.getByLabelText('כותרת');
      expect(title).toHaveValue('תרגיל 3 - מערכים');
      fireEvent.change(title, { target: { value: 'תרגיל 3 מעודכן' } });
      fireEvent.change(screen.getByLabelText('תאריך הגשה'), { target: { value: '2026-11-10' } });
      await user.click(screen.getByRole('button', { name: 'שמירה' }));

      expect(await screen.findByText('שיעורי הבית עודכנו')).toBeInTheDocument();
      const [[, init]] = callsTo(fetchMock, 'PATCH /api/homeworks/h1') as [[string, RequestInit]];
      expect(JSON.parse(String(init.body))).toEqual({
        title: 'תרגיל 3 מעודכן',
        description: 'פתרי את שאלות 1-5 בעמוד 42',
        dueDate: '2026-11-10'
      });
      expect(await screen.findByRole('heading', { name: 'תרגיל 3 מעודכן' })).toBeInTheDocument();
    });

    it('בעריכה תאריך הגשה חייב להיות אחרי תאריך השיעור', async () => {
      const fetchMock = setup();
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      await user.click(await screen.findByRole('button', { name: 'עריכה' }));

      fireEvent.change(screen.getByLabelText('תאריך הגשה'), { target: { value: '2026-10-26' } }); // תאריך השיעור
      await user.click(screen.getByRole('button', { name: 'שמירה' }));

      expect(await screen.findByText('תאריך ההגשה חייב להיות אחרי תאריך השיעור')).toBeInTheDocument();
      expect(callsTo(fetchMock, 'PATCH /api/homeworks/h1')).toHaveLength(0);
    });

    it('ביטול עריכה סוגר את הטופס', async () => {
      setup();
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      await user.click(await screen.findByRole('button', { name: 'עריכה' }));
      await user.click(screen.getByRole('button', { name: 'ביטול' }));
      expect(screen.queryByLabelText('כותרת')).not.toBeInTheDocument();
    });

    it('מחיקה דורשת אישור ואז מוחקת', async () => {
      const fetchMock = setup();
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      await user.click(await screen.findByRole('button', { name: 'מחיקה' }));
      expect(callsTo(fetchMock, 'DELETE /api/homeworks/h1')).toHaveLength(0);
      await user.click(screen.getByRole('button', { name: 'כן, מחיקה' }));

      expect(await screen.findByText('שיעורי הבית נמחקו')).toBeInTheDocument();
      expect(callsTo(fetchMock, 'DELETE /api/homeworks/h1')).toHaveLength(1);
      expect(await screen.findByText('עוד לא נוספו שיעורי בית')).toBeInTheDocument();
    });
  });
});
