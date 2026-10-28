import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import App from '@/App';
import type { User } from '@/types/api';
import { authenticated, callsTo, jsonResponse, makeUser, mockApi } from '@/test/fixtures';
import { renderWithProviders } from '@/test/utils';

afterEach(() => {
  vi.unstubAllGlobals();
});

const classes = [
  { id: 'c1', name: 'ה1', grade: 'HEH' },
  { id: 'c2', name: 'ו1', grade: 'VAV' }
];

const me = makeUser('ADMIN');
const teacher = makeUser('TEACHER', { id: 't1', fullName: 'רחל כהן', email: 'rachel@example.com' });
const student = makeUser('STUDENT', {
  id: 's1',
  fullName: 'מרים לוי',
  email: 'miriam@example.com',
  classId: 'c1',
  class: { id: 'c1', name: 'ה1', grade: 'HEH' }
});

function setup(initial: User[] = [me, teacher, student]) {
  let list = [...initial];
  const fetchMock = mockApi({
    'GET /api/classes': classes,
    'GET /api/users': (_init, url) => {
      const p = url.searchParams;
      const items = list.filter(
        (u) =>
          (!p.get('role') || u.role === p.get('role')) &&
          (!p.get('classId') || u.classId === p.get('classId')) &&
          (!p.get('isActive') || String(u.isActive) === p.get('isActive')) &&
          (!p.get('search') || u.fullName.includes(p.get('search')!) || u.email.includes(p.get('search')!))
      );
      return jsonResponse({ items, total: items.length, page: 1, limit: 100 });
    },
    'POST /api/users': (init) => {
      const body = JSON.parse(String(init?.body)) as Record<string, string>;
      if (body.email === 'taken@example.com') {
        return jsonResponse({ error: { code: 'ALREADY_EXISTS', message: 'הערך כבר קיים במערכת' } }, 409);
      }
      const created = makeUser(body.role as User['role'], {
        id: `new${list.length}`,
        fullName: body.fullName,
        email: body.email,
        classId: body.classId ?? null
      });
      list = [...list, created];
      return jsonResponse(created, 201);
    },
    'PATCH /api/users/s1': (init) => {
      const body = JSON.parse(String(init?.body)) as Partial<User>;
      list = list.map((u) => (u.id === 's1' ? { ...u, ...body } : u));
      return jsonResponse(list.find((u) => u.id === 's1'));
    },
    'PATCH /api/users/admin-1': () => jsonResponse(me)
  });
  renderWithProviders(<App />, { route: '/admin/users', preloadedState: authenticated('ADMIN') });
  return fetchMock;
}

const lastUsersUrl = (fetchMock: ReturnType<typeof vi.fn>) =>
  new URL(callsTo(fetchMock, 'GET /api/users').at(-1)![0]);
const card = (name: string) => within(screen.getByRole('heading', { name }).closest('li')!);
const newForm = () => within(screen.getByRole('heading', { name: 'הוספת משתמשת' }).closest('form')!);

describe('ניהול משתמשים', () => {
  it('מציג משתמשות עם תפקיד, כיתה ומצב', async () => {
    setup([me, teacher, { ...student, isActive: false }]);
    expect(await screen.findByRole('heading', { name: 'מרים לוי' })).toBeInTheDocument();
    expect(card('מרים לוי').getByText('תלמידה')).toBeInTheDocument();
    expect(card('מרים לוי').getByText('ה1')).toBeInTheDocument();
    expect(card('מרים לוי').getByText('מושבתת')).toBeInTheDocument();
    expect(card('רחל כהן').getByText('מורה')).toBeInTheDocument();
    expect(screen.getByText('מוצגות 3 מתוך 3')).toBeInTheDocument();
  });

  it('סינון וחיפוש נשלחים לשרת', async () => {
    const fetchMock = setup();
    const user = userEvent.setup();
    await screen.findByRole('heading', { name: 'מרים לוי' });
    await screen.findByRole('option', { name: 'ו1' });

    await user.selectOptions(screen.getByLabelText('תפקיד'), 'TEACHER');
    await waitFor(() => expect(lastUsersUrl(fetchMock).searchParams.get('role')).toBe('TEACHER'));
    await waitFor(() => expect(screen.queryByRole('heading', { name: 'מרים לוי' })).not.toBeInTheDocument());

    await user.selectOptions(screen.getByLabelText('תפקיד'), '');
    await user.selectOptions(screen.getByLabelText('כיתה'), 'c1');
    await waitFor(() => expect(lastUsersUrl(fetchMock).searchParams.get('classId')).toBe('c1'));

    await user.selectOptions(screen.getByLabelText('מצב חשבון'), 'false');
    await waitFor(() => expect(lastUsersUrl(fetchMock).searchParams.get('isActive')).toBe('false'));
    expect(await screen.findByText('לא נמצאו משתמשות')).toBeInTheDocument();
  });

  it('חיפוש לפי שם נשלח אחרי שהפסקת להקליד', async () => {
    const fetchMock = setup();
    await screen.findByRole('heading', { name: 'מרים לוי' });
    await userEvent.type(screen.getByLabelText('חיפוש לפי שם או אימייל'), 'רחל');
    await waitFor(() => expect(lastUsersUrl(fetchMock).searchParams.get('search')).toBe('רחל'));
    expect(callsTo(fetchMock, 'GET /api/users').filter(([u]) => u.includes('search='))).toHaveLength(1);
  });

  describe('יצירת חשבון', () => {
    it('תלמידה חייבת כיתה, ושדה הכיתה מוסתר למורה', async () => {
      const fetchMock = setup();
      const user = userEvent.setup();
      await user.click(await screen.findByRole('button', { name: 'הוספת משתמשת' }));

      await user.click(newForm().getByRole('button', { name: 'יצירת חשבון' }));
      expect(await screen.findByText('חובה להזין שם מלא')).toBeInTheDocument();
      expect(screen.getByText('חובה להזין אימייל')).toBeInTheDocument();
      expect(screen.getByText('הסיסמה חייבת להכיל לפחות 8 תווים')).toBeInTheDocument();
      expect(screen.getByText('תלמידה חייבת להשתייך לכיתה')).toBeInTheDocument();

      await user.selectOptions(newForm().getByLabelText('תפקיד'), 'TEACHER');
      expect(newForm().queryByLabelText('כיתה')).not.toBeInTheDocument();
      expect(callsTo(fetchMock, 'POST /api/users')).toHaveLength(0);
    });

    it('אימייל לא תקין וסיסמה קצרה נדחים', async () => {
      setup();
      const user = userEvent.setup();
      await user.click(await screen.findByRole('button', { name: 'הוספת משתמשת' }));
      await user.type(newForm().getByLabelText('אימייל'), 'not-an-email');
      await user.type(newForm().getByLabelText('סיסמה ראשונית'), '123');
      await user.click(newForm().getByRole('button', { name: 'יצירת חשבון' }));
      expect(await screen.findByText('האימייל אינו תקין')).toBeInTheDocument();
      expect(screen.getByText('הסיסמה חייבת להכיל לפחות 8 תווים')).toBeInTheDocument();
    });

    it('יצירת תלמידה שולחת classId, ויצירת מורה לא שולחת', async () => {
      const fetchMock = setup();
      const user = userEvent.setup();
      await user.click(await screen.findByRole('button', { name: 'הוספת משתמשת' }));

      await user.type(newForm().getByLabelText('שם מלא'), 'דינה אברהם');
      await user.type(newForm().getByLabelText('אימייל'), 'dina@example.com');
      await user.type(newForm().getByLabelText('סיסמה ראשונית'), 'Password123!');
      await newForm().findByRole('option', { name: 'ו1' });
      await user.selectOptions(newForm().getByLabelText('כיתה'), 'c2');
      await user.click(newForm().getByRole('button', { name: 'יצירת חשבון' }));

      expect(await screen.findByText('החשבון של דינה אברהם נוצר')).toBeInTheDocument();
      let [[, init]] = callsTo(fetchMock, 'POST /api/users') as [[string, RequestInit]];
      expect(JSON.parse(String(init.body))).toEqual({
        fullName: 'דינה אברהם',
        email: 'dina@example.com',
        password: 'Password123!',
        role: 'STUDENT',
        classId: 'c2'
      });
      expect(await screen.findByRole('heading', { name: 'דינה אברהם' })).toBeInTheDocument();

      // מורה: בלי classId
      await user.click(screen.getByRole('button', { name: 'הוספת משתמשת' }));
      await user.type(newForm().getByLabelText('שם מלא'), 'לאה מזרחי');
      await user.type(newForm().getByLabelText('אימייל'), 'leah@example.com');
      await user.type(newForm().getByLabelText('סיסמה ראשונית'), 'Password123!');
      await user.selectOptions(newForm().getByLabelText('תפקיד'), 'TEACHER');
      await user.click(newForm().getByRole('button', { name: 'יצירת חשבון' }));
      await screen.findByRole('heading', { name: 'לאה מזרחי' });
      [, init] = callsTo(fetchMock, 'POST /api/users')[1] as [string, RequestInit];
      expect(JSON.parse(String(init.body))).not.toHaveProperty('classId');
    });

    it('אימייל שכבר קיים מציג את הודעת השרת', async () => {
      setup();
      const user = userEvent.setup();
      await user.click(await screen.findByRole('button', { name: 'הוספת משתמשת' }));
      await user.type(newForm().getByLabelText('שם מלא'), 'מישהי');
      await user.type(newForm().getByLabelText('אימייל'), 'taken@example.com');
      await user.type(newForm().getByLabelText('סיסמה ראשונית'), 'Password123!');
      await user.selectOptions(newForm().getByLabelText('תפקיד'), 'TEACHER');
      await user.click(newForm().getByRole('button', { name: 'יצירת חשבון' }));
      expect(await newForm().findByRole('alert')).toHaveTextContent('הערך כבר קיים במערכת');
    });
  });

  describe('עריכה', () => {
    it('עדכון פרטים, כיתה והשבתה', async () => {
      const fetchMock = setup();
      const user = userEvent.setup();
      await screen.findByRole('heading', { name: 'מרים לוי' });
      await user.click(card('מרים לוי').getByRole('button', { name: 'עריכה' }));

      const c = card('מרים לוי');
      expect(c.getByLabelText('שם מלא')).toHaveValue('מרים לוי');
      await user.clear(c.getByLabelText('שם מלא'));
      await user.type(c.getByLabelText('שם מלא'), 'מרים כהן');
      await user.selectOptions(c.getByLabelText('כיתה'), 'c2');
      await user.click(c.getByLabelText('חשבון פעיל'));
      await user.click(c.getByRole('button', { name: 'שמירה' }));

      expect(await screen.findByText('הפרטים עודכנו')).toBeInTheDocument();
      const [[, init]] = callsTo(fetchMock, 'PATCH /api/users/s1') as [[string, RequestInit]];
      expect(JSON.parse(String(init.body))).toEqual({
        fullName: 'מרים כהן',
        email: 'miriam@example.com',
        classId: 'c2',
        isActive: false
      });
      expect(await screen.findByText('מושבתת')).toBeInTheDocument();
    });

    it('איפוס סיסמה נשלח רק כשהוזנה סיסמה, ובדיקת אורך', async () => {
      const fetchMock = setup();
      const user = userEvent.setup();
      await screen.findByRole('heading', { name: 'מרים לוי' });
      await user.click(card('מרים לוי').getByRole('button', { name: 'עריכה' }));
      const c = card('מרים לוי');
      const password = c.getByLabelText(/סיסמה חדשה/);

      await user.type(password, '123');
      await user.click(c.getByRole('button', { name: 'שמירה' }));
      expect(await screen.findByText('הסיסמה חייבת להכיל לפחות 8 תווים')).toBeInTheDocument();
      expect(callsTo(fetchMock, 'PATCH /api/users/s1')).toHaveLength(0);

      await user.clear(password);
      await user.type(password, 'BrandNew123!');
      await user.click(c.getByRole('button', { name: 'שמירה' }));
      await screen.findByText('הפרטים עודכנו');
      const [[, init]] = callsTo(fetchMock, 'PATCH /api/users/s1') as [[string, RequestInit]];
      expect(JSON.parse(String(init.body))).toMatchObject({ password: 'BrandNew123!', isActive: true });
    });

    it('את לא יכולה להשבית את החשבון של עצמך', async () => {
      setup();
      const user = userEvent.setup();
      await screen.findByRole('heading', { name: 'שרה המזכירה' });
      await user.click(card('שרה המזכירה').getByRole('button', { name: 'עריכה' }));
      expect(card('שרה המזכירה').queryByLabelText('חשבון פעיל')).not.toBeInTheDocument();
      expect(card('שרה המזכירה').queryByLabelText('כיתה')).not.toBeInTheDocument();
    });

    it('ביטול סוגר את טופס העריכה', async () => {
      setup();
      const user = userEvent.setup();
      await screen.findByRole('heading', { name: 'רחל כהן' });
      await user.click(card('רחל כהן').getByRole('button', { name: 'עריכה' }));
      await user.click(card('רחל כהן').getByRole('button', { name: 'ביטול' }));
      expect(card('רחל כהן').queryByLabelText('שם מלא')).not.toBeInTheDocument();
    });
  });
});
