import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import App from '@/App';
import { DAY_NAMES } from '@/utils/format';
import { authenticated, callsTo, makeLesson, mockApi } from '@/test/fixtures';
import { renderWithProviders } from '@/test/utils';

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

const week = (lessonsByDay: Record<number, ReturnType<typeof makeLesson>[]> = {}) => ({
  days: DAY_NAMES.map((name, dayOfWeek) => ({ dayOfWeek, name, lessons: lessonsByDay[dayOfWeek] ?? [] }))
});

const openStudent = (route: string) =>
  renderWithProviders(<App />, { route, preloadedState: authenticated('STUDENT') });

describe('מערכת שבועית', () => {
  it('מציג שישה ימים עם השיעורים וקישור לכל יום', async () => {
    mockApi({
      'GET /api/lessons/week': week({
        0: [makeLesson({ room: '101' }), makeLesson({ id: 'l2', subject: { id: 's2', name: 'פיתוח Web' }, startTime: '11:00', endTime: '12:30' })]
      })
    });
    openStudent('/student');

    expect(await screen.findByText('מבני נתונים')).toBeInTheDocument();
    expect(screen.getByText('פיתוח Web')).toBeInTheDocument();
    expect(screen.getAllByText('אין שיעורים')).toHaveLength(5);

    const sunday = screen.getByRole('region', { name: 'יום ראשון' });
    expect(within(sunday).getByRole('link', { name: /יום ראשון/ })).toHaveAttribute('href', '/student/day/0');
    expect(screen.getByRole('link', { name: 'יום שישי' })).toHaveAttribute('href', '/student/day/5');
  });

  it('מדגיש את היום הנוכחי לפי שעון ישראל', async () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2026-11-03T09:00:00+02:00')); // יום שלישי
    mockApi({ 'GET /api/lessons/week': week() });
    openStudent('/student');

    const tuesday = await screen.findByRole('region', { name: 'יום שלישי' });
    expect(within(tuesday).getByText('היום')).toBeInTheDocument();
    expect(screen.getAllByText('היום')).toHaveLength(1);
  });

  it('לחיצה על יום פותחת את המערכת היומית עם שם שיעור, שעות וחדר', async () => {
    const fetchMock = mockApi({
      'GET /api/lessons/week': week({ 0: [makeLesson()] }),
      'GET /api/lessons/day/0': { dayOfWeek: 0, name: 'ראשון', lessons: [makeLesson({ room: '305' })] }
    });
    openStudent('/student');

    await userEvent.click(await screen.findByRole('link', { name: /יום ראשון/ }));

    expect(await screen.findByRole('heading', { name: 'יום ראשון' })).toBeInTheDocument();
    expect(screen.getByText('חדר 305')).toBeInTheDocument();
    expect(screen.getByText('09:00–10:30')).toBeInTheDocument();
    expect(screen.getByText('מורה: רחל כהן')).toBeInTheDocument();
    expect(callsTo(fetchMock, 'GET /api/lessons/day/0')).toHaveLength(1);
  });

  it('מציג הערת שינוי של שיעור שהועבר', async () => {
    mockApi({
      'GET /api/lessons/day/2': {
        dayOfWeek: 2,
        name: 'שלישי',
        lessons: [makeLesson({ dayOfWeek: 2, changeNote: 'הועבר מיום ראשון' })]
      }
    });
    openStudent('/student/day/2');
    expect(await screen.findByText('הועבר מיום ראשון')).toBeInTheDocument();
  });

  it('יום בלי שיעורים מציג הודעה', async () => {
    mockApi({ 'GET /api/lessons/day/1': { dayOfWeek: 1, name: 'שני', lessons: [] } });
    openStudent('/student/day/1');
    expect(await screen.findByText('אין שיעורים ביום הזה')).toBeInTheDocument();
  });

  it('יום לא תקין לא פונה לשרת ומציג הודעה', () => {
    const fetchMock = mockApi();
    openStudent('/student/day/9');
    expect(screen.getByRole('heading', { name: 'יום לא תקין' })).toBeInTheDocument();
    expect(callsTo(fetchMock, 'GET /api/lessons/day/9')).toHaveLength(0);
  });

  it('שגיאת שרת מציגה הודעה וכפתור לנסות שוב', async () => {
    mockApi({
      'GET /api/lessons/week': () =>
        new Response(JSON.stringify({ error: { code: 'INTERNAL_ERROR', message: 'שגיאה פנימית בשרת' } }), {
          status: 400
        })
    });
    openStudent('/student');
    expect(await screen.findByText('שגיאה פנימית בשרת')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'נסי שוב' })).toBeInTheDocument();
  });
});
