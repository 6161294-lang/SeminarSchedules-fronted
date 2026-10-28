import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import App from '@/App';
import type { Lesson } from '@/types/api';
import {
  authenticated,
  callsTo,
  jsonResponse,
  makeLesson,
  makeUser,
  mockApi,
  noContent
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
const teachers = [
  makeUser('TEACHER', { id: 't1', fullName: 'רחל כהן' }),
  makeUser('TEACHER', { id: 't2', fullName: 'לאה מזרחי' })
];

const active = makeLesson({ id: 'l1' });
const cancelled = makeLesson({
  id: 'l2',
  class: { id: 'c2', name: 'ו1', grade: 'VAV' },
  dayOfWeek: 1,
  status: 'CANCELLED',
  changeNote: 'השיעור בוטל'
});

function setup(initial: Lesson[] = [active, cancelled]) {
  let list = [...initial];
  const fetchMock = mockApi({
    'GET /api/classes': classes,
    'GET /api/subjects': subjects,
    'GET /api/users': { items: teachers, total: 2, page: 1, limit: 200 },
    'GET /api/lessons': (_init, url) => {
      const p = url.searchParams;
      return jsonResponse(
        list.filter(
          (l) =>
            (!p.get('classId') || l.class.id === p.get('classId')) &&
            (!p.get('teacherId') || l.teacher.id === p.get('teacherId')) &&
            (!p.has('dayOfWeek') || l.dayOfWeek === Number(p.get('dayOfWeek'))) &&
            (!p.get('status') || l.status === p.get('status'))
        )
      );
    },
    'POST /api/lessons': (init) => {
      const body = JSON.parse(String(init?.body)) as Record<string, unknown>;
      const created = makeLesson({
        id: 'l9',
        room: String(body.room),
        dayOfWeek: Number(body.dayOfWeek),
        startTime: String(body.startTime),
        endTime: String(body.endTime)
      });
      list = [...list, created];
      return jsonResponse(created, 201);
    },
    'PATCH /api/lessons/l1': (init) => {
      const body = JSON.parse(String(init?.body)) as Partial<Lesson>;
      list = list.map((l) => (l.id === 'l1' ? { ...l, ...body } : l));
      return jsonResponse(list.find((l) => l.id === 'l1'));
    },
    'PATCH /api/lessons/l2': (init) => {
      const body = JSON.parse(String(init?.body)) as Partial<Lesson>;
      list = list.map((l) => (l.id === 'l2' ? { ...l, ...body } : l));
      return jsonResponse(list.find((l) => l.id === 'l2'));
    },
    'DELETE /api/lessons/l1': () => {
      list = list.filter((l) => l.id !== 'l1');
      return noContent();
    }
  });
  renderWithProviders(<App />, { route: '/admin', preloadedState: authenticated('ADMIN') });
  return fetchMock;
}

const card = (name: string) => within(screen.getByRole('heading', { name }).closest('li')!);
const lastLessonsUrl = (fetchMock: ReturnType<typeof vi.fn>) =>
  new URL(callsTo(fetchMock, 'GET /api/lessons').at(-1)![0]);

async function fillLessonForm(room = '305') {
  const form = screen.getByRole('heading', { name: 'הוספת שיעור' }).closest('form')!;
  const f = within(form);
  await f.findByRole('option', { name: 'רחל כהן' });
  await userEvent.selectOptions(f.getByLabelText('מקצוע'), 's2');
  await userEvent.selectOptions(f.getByLabelText('מורה'), 't1');
  await userEvent.selectOptions(f.getByLabelText('כיתה'), 'c1');
  await userEvent.selectOptions(f.getByLabelText('יום'), '2');
  fireEvent.change(f.getByLabelText('שעת התחלה'), { target: { value: '11:00' } });
  fireEvent.change(f.getByLabelText('שעת סיום'), { target: { value: '12:30' } });
  await userEvent.type(f.getByLabelText('חדר'), room);
  return form;
}

describe('ניהול לוח זמנים', () => {
  it('מציג את כל השיעורים, והמבוטלים מסומנים', async () => {
    setup();
    expect(await screen.findByRole('heading', { name: 'מבני נתונים · ה1' })).toBeInTheDocument();
    expect(card('מבני נתונים · ו1').getByText('מבוטל')).toBeInTheDocument();
    expect(card('מבני נתונים · ו1').getByText('השיעור בוטל')).toBeInTheDocument();
    expect(card('מבני נתונים · ה1').queryByText('מבוטל')).not.toBeInTheDocument();
    expect(screen.getByText(/יום ראשון 09:00–10:30 · חדר 101/)).toBeInTheDocument();
  });

  it('סינון לפי סטטוס, כיתה ויום נשלח לשרת', async () => {
    const fetchMock = setup();
    const user = userEvent.setup();
    await screen.findByRole('heading', { name: 'מבני נתונים · ה1' });
    await screen.findByRole('option', { name: 'ו1' });

    await user.selectOptions(screen.getByLabelText('סטטוס'), 'CANCELLED');
    await waitFor(() => expect(screen.queryByRole('heading', { name: 'מבני נתונים · ה1' })).not.toBeInTheDocument());
    expect(lastLessonsUrl(fetchMock).searchParams.get('status')).toBe('CANCELLED');

    await user.selectOptions(screen.getByLabelText('סטטוס'), '');
    await user.selectOptions(screen.getByLabelText('כיתה'), 'c1');
    await waitFor(() => expect(lastLessonsUrl(fetchMock).searchParams.get('classId')).toBe('c1'));

    await user.selectOptions(screen.getByLabelText('יום'), '1'); // שני
    await waitFor(() => expect(lastLessonsUrl(fetchMock).searchParams.get('dayOfWeek')).toBe('1'));
    expect(await screen.findByText('אין שיעורים שמתאימים לסינון')).toBeInTheDocument();
  });

  describe('הוספה', () => {
    it('ולידציה: כל השדות חובה, וסיום חייב להיות אחרי ההתחלה', async () => {
      const fetchMock = setup();
      const user = userEvent.setup();
      await user.click(await screen.findByRole('button', { name: 'הוספת שיעור' }));

      await user.click(within(screen.getByRole('heading', { name: 'הוספת שיעור' }).closest('form')!).getByRole('button', { name: 'הוספה' }));
      for (const message of ['חובה לבחור מקצוע', 'חובה לבחור מורה', 'חובה לבחור כיתה', 'חובה לבחור יום', 'חובה להזין חדר']) {
        expect(await screen.findByText(message)).toBeInTheDocument();
      }
      expect(screen.getAllByText('חובה לבחור שעה')).toHaveLength(2);

      const form = await fillLessonForm();
      fireEvent.change(within(form).getByLabelText('שעת סיום'), { target: { value: '10:00' } });
      await user.click(within(form).getByRole('button', { name: 'הוספה' }));
      expect(await screen.findByText('שעת הסיום חייבת להיות אחרי שעת ההתחלה')).toBeInTheDocument();
      expect(callsTo(fetchMock, 'POST /api/lessons')).toHaveLength(0);
    });

    it('הוספה מוצלחת שולחת את הנתונים (היום כמספר) ומציגה את השיעור', async () => {
      const fetchMock = setup();
      const user = userEvent.setup();
      await user.click(await screen.findByRole('button', { name: 'הוספת שיעור' }));
      const form = await fillLessonForm('305');
      await user.click(within(form).getByRole('button', { name: 'הוספה' }));

      expect(await screen.findByText('השיעור נוסף, והתלמידות והמורה קיבלו התראה')).toBeInTheDocument();
      const [[, init]] = callsTo(fetchMock, 'POST /api/lessons') as [[string, RequestInit]];
      expect(JSON.parse(String(init.body))).toEqual({
        subjectId: 's2',
        teacherId: 't1',
        classId: 'c1',
        dayOfWeek: 2,
        startTime: '11:00',
        endTime: '12:30',
        room: '305'
      });
      expect(await screen.findByText(/יום שלישי 11:00–12:30 · חדר 305/)).toBeInTheDocument();
      expect(screen.queryByRole('heading', { name: 'הוספת שיעור' })).not.toBeInTheDocument();
    });

    it('התנגשות בלוח (409) מציגה את הסיבות', async () => {
      const fetchMock = setup();
      const user = userEvent.setup();
      await user.click(await screen.findByRole('button', { name: 'הוספת שיעור' }));
      const form = await fillLessonForm();
      fetchMock.mockImplementation(async (input: RequestInfo | URL, init?: RequestInit) => {
        const url = new URL(String(input));
        if (init?.method === 'POST') {
          return jsonResponse(
            {
              error: {
                code: 'LESSON_CONFLICT',
                message: 'יש התנגשות עם שיעור קיים במערכת',
                details: [{ lessonId: 'l1', reasons: ['המורה כבר מלמדת בשעה זו', 'החדר תפוס בשעה זו'] }]
              }
            },
            409
          );
        }
        if (url.pathname === '/api/notifications') return jsonResponse({ items: [], unreadCount: 0 });
        if (url.pathname === '/api/users') return jsonResponse({ items: teachers, total: 2, page: 1, limit: 200 });
        if (url.pathname === '/api/classes') return jsonResponse(classes);
        if (url.pathname === '/api/subjects') return jsonResponse(subjects);
        return jsonResponse([]);
      });

      await user.click(within(form).getByRole('button', { name: 'הוספה' }));
      const alert = await within(form).findByRole('alert');
      expect(alert).toHaveTextContent('יש התנגשות עם שיעור קיים במערכת');
      expect(within(alert).getByText('המורה כבר מלמדת בשעה זו')).toBeInTheDocument();
      expect(within(alert).getByText('החדר תפוס בשעה זו')).toBeInTheDocument();
    });

    it('ביטול סוגר את הטופס', async () => {
      setup();
      const user = userEvent.setup();
      await user.click(await screen.findByRole('button', { name: 'הוספת שיעור' }));
      const form = screen.getByRole('heading', { name: 'הוספת שיעור' }).closest('form')!;
      await user.click(within(form).getByRole('button', { name: 'ביטול' }));
      expect(screen.queryByRole('heading', { name: 'הוספת שיעור' })).not.toBeInTheDocument();
    });
  });

  it('עריכה והעברה: הטופס ממולא, ושולח את השיעור המעודכן', async () => {
    const fetchMock = setup();
    const user = userEvent.setup();
    await screen.findByRole('heading', { name: 'מבני נתונים · ה1' });

    await user.click(card('מבני נתונים · ה1').getByRole('button', { name: 'עריכה והעברה' }));
    const form = (await screen.findByRole('heading', { name: 'עריכת שיעור' })).closest('form')!;
    const f = within(form);
    await f.findByRole('option', { name: 'רחל כהן' });
    expect(f.getByLabelText('חדר')).toHaveValue('101');
    expect(f.getByLabelText('יום')).toHaveValue('0');

    const room = f.getByLabelText('חדר');
    await user.clear(room);
    await user.type(room, '202');
    await user.selectOptions(f.getByLabelText('יום'), '3');
    await user.click(f.getByRole('button', { name: 'שמירה' }));

    expect(await screen.findByText('השיעור עודכן, והתלמידות והמורה קיבלו התראה')).toBeInTheDocument();
    const [[, init]] = callsTo(fetchMock, 'PATCH /api/lessons/l1') as [[string, RequestInit]];
    expect(JSON.parse(String(init.body))).toMatchObject({ room: '202', dayOfWeek: 3, classId: 'c1' });
    expect(await screen.findByText(/יום רביעי 09:00–10:30 · חדר 202/)).toBeInTheDocument();
  });

  it('ביטול שיעור דורש אישור, ואז השיעור מסומן כמבוטל', async () => {
    const fetchMock = setup();
    const user = userEvent.setup();
    await screen.findByRole('heading', { name: 'מבני נתונים · ה1' });
    const c = card('מבני נתונים · ה1');

    await user.click(c.getByRole('button', { name: 'ביטול השיעור' }));
    expect(callsTo(fetchMock, 'PATCH /api/lessons/l1')).toHaveLength(0);
    await user.click(c.getByRole('button', { name: 'כן, ביטול השיעור' }));

    expect(await screen.findByText('השיעור בוטל, והתלמידות והמורה קיבלו התראה')).toBeInTheDocument();
    const [[, init]] = callsTo(fetchMock, 'PATCH /api/lessons/l1') as [[string, RequestInit]];
    expect(JSON.parse(String(init.body))).toEqual({ status: 'CANCELLED' });
    await waitFor(() => expect(card('מבני נתונים · ה1').getByText('מבוטל')).toBeInTheDocument());
  });

  it('החזרת שיעור מבוטל', async () => {
    const fetchMock = setup();
    const user = userEvent.setup();
    await screen.findByRole('heading', { name: 'מבני נתונים · ו1' });

    await user.click(card('מבני נתונים · ו1').getByRole('button', { name: 'החזרת השיעור' }));
    expect(await screen.findByText('השיעור הוחזר ללוח')).toBeInTheDocument();
    const [[, init]] = callsTo(fetchMock, 'PATCH /api/lessons/l2') as [[string, RequestInit]];
    expect(JSON.parse(String(init.body))).toEqual({ status: 'ACTIVE' });
    await waitFor(() => expect(card('מבני נתונים · ו1').queryByText('מבוטל')).not.toBeInTheDocument());
  });

  it('מחיקת שיעור דורשת אישור', async () => {
    const fetchMock = setup();
    const user = userEvent.setup();
    await screen.findByRole('heading', { name: 'מבני נתונים · ה1' });
    const c = card('מבני נתונים · ה1');

    await user.click(c.getByRole('button', { name: 'מחיקה' }));
    await user.click(c.getByRole('button', { name: 'כן, מחיקה' }));

    expect(await screen.findByText('השיעור נמחק')).toBeInTheDocument();
    expect(callsTo(fetchMock, 'DELETE /api/lessons/l1')).toHaveLength(1);
    await waitFor(() => expect(screen.queryByRole('heading', { name: 'מבני נתונים · ה1' })).not.toBeInTheDocument());
  });
});
