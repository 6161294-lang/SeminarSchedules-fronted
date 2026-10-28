import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import App from '@/App';
import type { ClassItem, Subject } from '@/types/api';
import { authenticated, callsTo, jsonResponse, mockApi } from '@/test/fixtures';
import { renderWithProviders } from '@/test/utils';

afterEach(() => {
  vi.unstubAllGlobals();
});

function setup() {
  let classes: ClassItem[] = [{ id: 'c1', name: 'ה1', grade: 'HEH' }];
  let subjects: Subject[] = [{ id: 's1', name: 'מבני נתונים' }];
  const duplicate = () => jsonResponse({ error: { code: 'ALREADY_EXISTS', message: 'הערך כבר קיים במערכת' } }, 409);

  const fetchMock = mockApi({
    'GET /api/classes': () => jsonResponse(classes),
    'GET /api/subjects': () => jsonResponse(subjects),
    'POST /api/classes': (init) => {
      const body = JSON.parse(String(init?.body)) as Omit<ClassItem, 'id'>;
      if (classes.some((c) => c.name === body.name)) return duplicate();
      const created = { id: `c${classes.length + 1}`, ...body };
      classes = [...classes, created];
      return jsonResponse(created, 201);
    },
    'PATCH /api/classes/c1': (init) => {
      const body = JSON.parse(String(init?.body)) as Partial<ClassItem>;
      classes = classes.map((c) => (c.id === 'c1' ? { ...c, ...body } : c));
      return jsonResponse(classes[0]);
    },
    'POST /api/subjects': (init) => {
      const body = JSON.parse(String(init?.body)) as { name: string };
      if (subjects.some((s) => s.name === body.name)) return duplicate();
      const created = { id: `s${subjects.length + 1}`, name: body.name };
      subjects = [...subjects, created];
      return jsonResponse(created, 201);
    },
    'PATCH /api/subjects/s1': (init) => {
      const body = JSON.parse(String(init?.body)) as { name: string };
      subjects = subjects.map((s) => (s.id === 's1' ? { ...s, ...body } : s));
      return jsonResponse(subjects[0]);
    }
  });
  renderWithProviders(<App />, { route: '/admin/catalog', preloadedState: authenticated('ADMIN') });
  return fetchMock;
}

describe('כיתות ומקצועות', () => {
  it('מציג כיתות עם המחזור שלהן, ומקצועות', async () => {
    setup();
    expect(await screen.findByText('ה1')).toBeInTheDocument();
    expect(screen.getByText(/מחזור ה׳/)).toBeInTheDocument();
    expect(await screen.findByText('מבני נתונים')).toBeInTheDocument();
  });

  describe('כיתות', () => {
    it('הוספת כיתה: ולידציה ואז שמירה עם המחזור', async () => {
      const fetchMock = setup();
      const user = userEvent.setup();
      await user.click(await screen.findByRole('button', { name: 'הוספת כיתה' }));

      await user.click(screen.getByRole('button', { name: 'הוספת כיתה' }));
      expect(await screen.findByText('חובה להזין שם כיתה')).toBeInTheDocument();
      expect(callsTo(fetchMock, 'POST /api/classes')).toHaveLength(0);

      await user.type(screen.getByLabelText('שם כיתה'), 'ו1');
      await user.selectOptions(screen.getByLabelText('מחזור'), 'VAV');
      await user.click(screen.getByRole('button', { name: 'הוספת כיתה' }));

      expect(await screen.findByText('הכיתה נוספה')).toBeInTheDocument();
      const [[, init]] = callsTo(fetchMock, 'POST /api/classes') as [[string, RequestInit]];
      expect(JSON.parse(String(init.body))).toEqual({ name: 'ו1', grade: 'VAV' });
      expect(await screen.findByText('ו1')).toBeInTheDocument();
    });

    it('שם כיתה שכבר קיים מציג את הודעת השרת', async () => {
      setup();
      const user = userEvent.setup();
      await user.click(await screen.findByRole('button', { name: 'הוספת כיתה' }));
      await user.type(screen.getByLabelText('שם כיתה'), 'ה1');
      await user.click(screen.getByRole('button', { name: 'הוספת כיתה' }));
      expect(await screen.findByRole('alert')).toHaveTextContent('הערך כבר קיים במערכת');
    });

    it('עריכת כיתה שולחת PATCH ומעדכנת את הרשימה', async () => {
      const fetchMock = setup();
      const user = userEvent.setup();
      await user.click(await screen.findByRole('button', { name: 'עריכת ה1' }));

      const name = screen.getByLabelText('שם כיתה');
      expect(name).toHaveValue('ה1');
      await user.clear(name);
      await user.type(name, 'ה1 א');
      await user.click(screen.getByRole('button', { name: 'שמירה' }));

      expect(await screen.findByText('הכיתה עודכנה')).toBeInTheDocument();
      const [[, init]] = callsTo(fetchMock, 'PATCH /api/classes/c1') as [[string, RequestInit]];
      expect(JSON.parse(String(init.body))).toEqual({ name: 'ה1 א', grade: 'HEH' });
      expect(await screen.findByText('ה1 א')).toBeInTheDocument();
    });
  });

  describe('מקצועות', () => {
    it('הוספת מקצוע: ולידציה ואז שמירה', async () => {
      const fetchMock = setup();
      const user = userEvent.setup();
      await user.click(await screen.findByRole('button', { name: 'הוספת מקצוע' }));

      await user.click(screen.getByRole('button', { name: 'הוספת מקצוע' }));
      expect(await screen.findByText('חובה להזין שם מקצוע')).toBeInTheDocument();

      await user.type(screen.getByLabelText('שם מקצוע'), 'אלגוריתמים');
      await user.click(screen.getByRole('button', { name: 'הוספת מקצוע' }));

      expect(await screen.findByText('המקצוע נוסף')).toBeInTheDocument();
      const [[, init]] = callsTo(fetchMock, 'POST /api/subjects') as [[string, RequestInit]];
      expect(JSON.parse(String(init.body))).toEqual({ name: 'אלגוריתמים' });
      expect(await screen.findByText('אלגוריתמים')).toBeInTheDocument();
    });

    it('מקצוע שכבר קיים מציג את הודעת השרת', async () => {
      setup();
      const user = userEvent.setup();
      await user.click(await screen.findByRole('button', { name: 'הוספת מקצוע' }));
      await user.type(screen.getByLabelText('שם מקצוע'), 'מבני נתונים');
      await user.click(screen.getByRole('button', { name: 'הוספת מקצוע' }));
      expect(await screen.findByRole('alert')).toHaveTextContent('הערך כבר קיים במערכת');
    });

    it('עריכת מקצוע, וביטול סוגר את הטופס', async () => {
      const fetchMock = setup();
      const user = userEvent.setup();
      await user.click(await screen.findByRole('button', { name: 'עריכת מבני נתונים' }));
      await user.click(screen.getByRole('button', { name: 'ביטול' }));
      expect(screen.queryByLabelText('שם מקצוע')).not.toBeInTheDocument();

      await user.click(screen.getByRole('button', { name: 'עריכת מבני נתונים' }));
      const name = screen.getByLabelText('שם מקצוע');
      await user.clear(name);
      await user.type(name, 'מבני נתונים מתקדם');
      await user.click(screen.getByRole('button', { name: 'שמירה' }));

      expect(await screen.findByText('המקצוע עודכן')).toBeInTheDocument();
      const [[, init]] = callsTo(fetchMock, 'PATCH /api/subjects/s1') as [[string, RequestInit]];
      expect(JSON.parse(String(init.body))).toEqual({ name: 'מבני נתונים מתקדם' });
      const subjectsSection = screen.getByRole('heading', { name: 'מקצועות' }).closest('section')!;
      expect(await within(subjectsSection).findByText('מבני נתונים מתקדם')).toBeInTheDocument();
    });
  });
});
