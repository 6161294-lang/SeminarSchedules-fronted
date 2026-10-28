import { screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import App from '@/App';
import { DAY_NAMES } from '@/utils/format';
import { authenticated, makeLesson, mockApi } from '@/test/fixtures';
import { renderWithProviders } from '@/test/utils';

afterEach(() => {
  vi.unstubAllGlobals();
});

const openTeacher = (route: string) =>
  renderWithProviders(<App />, { route, preloadedState: authenticated('TEACHER') });

describe('מערכת המורה', () => {
  it('מערכת שבועית עם קישור לכל יום', async () => {
    mockApi({
      'GET /api/lessons/week': {
        days: DAY_NAMES.map((name, dayOfWeek) => ({
          dayOfWeek,
          name,
          lessons: dayOfWeek === 0 ? [makeLesson()] : []
        }))
      }
    });
    openTeacher('/teacher');

    expect(await screen.findByRole('heading', { name: 'המערכת שלי' })).toBeInTheDocument();
    expect(await screen.findByText('מבני נתונים')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /יום ראשון/ })).toHaveAttribute('href', '/teacher/day/0');
  });

  it('מערכת יומית: מקצוע, כיתה, שעות וחדר, עם קישור לפרטי השיעור', async () => {
    mockApi({
      'GET /api/lessons/day/0': {
        dayOfWeek: 0,
        name: 'ראשון',
        lessons: [makeLesson({ room: '305' })]
      }
    });
    openTeacher('/teacher/day/0');

    expect(await screen.findByText('מבני נתונים')).toBeInTheDocument();
    expect(screen.getByText('כיתה: ה1')).toBeInTheDocument();
    expect(screen.getByText('חדר 305')).toBeInTheDocument();
    expect(screen.getByText('09:00–10:30')).toBeInTheDocument();
    expect(screen.queryByText(/מורה:/)).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'פרטי שיעור, שיעורי בית והערות' })).toHaveAttribute(
      'href',
      '/teacher/lesson/l1'
    );
  });

  it('מורה לא נכנסת למסכי התלמידה', () => {
    mockApi();
    openTeacher('/student/homework');
    expect(screen.getByRole('heading', { name: 'אין לך הרשאה' })).toBeInTheDocument();
  });
});
