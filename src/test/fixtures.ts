import { vi } from 'vitest';
import type { AuthState } from '@/features/auth/authSlice';
import type { Homework, Lesson, Note, Role, Submission, User } from '@/types/api';

const NAMES: Record<Role, string> = {
  ADMIN: 'שרה המזכירה',
  TEACHER: 'רחל כהן',
  STUDENT: 'מרים לוי'
};

export function makeUser(role: Role = 'STUDENT', overrides: Partial<User> = {}): User {
  return {
    id: `${role.toLowerCase()}-1`,
    fullName: NAMES[role],
    email: `${role.toLowerCase()}@example.com`,
    role,
    classId: role === 'STUDENT' ? 'class-1' : null,
    isActive: true,
    createdAt: '2026-09-01T08:00:00.000Z',
    ...overrides
  };
}

/** מצב Redux של משתמשת מחוברת, לשימוש כ-preloadedState בבדיקות */
export function authenticated(role: Role = 'STUDENT'): { auth: AuthState } {
  return {
    auth: {
      status: 'authenticated',
      user: makeUser(role),
      sessionKey: 'test-key',
      expiresAt: '2999-01-01T00:00:00.000Z'
    }
  };
}

export function checking(role: Role = 'STUDENT'): { auth: AuthState } {
  const state = authenticated(role);
  return { auth: { ...state.auth, status: 'checking' } };
}

export const jsonResponse = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

export const noContent = () => new Response(null, { status: 204 });

type HandlerFn = (init: RequestInit | undefined, url: URL) => Response | Promise<Response>;
// ערך רגיל (JSON) או פונקציה שמחזירה Response. לא unknown, כדי ש-TypeScript יזהה את הפרמטרים של הפונקציה
type RouteHandler = HandlerFn | object | string | number | boolean | null;

/**
 * מחליפה את fetch בשרת מדומה לפי "METHOD /path". ערך רגיל מוחזר כ-JSON,
 * ופונקציה מחזירה Response מלא. בקשה שלא הוגדרה מחזירה 404.
 * ברירת מחדל: התראות ריקות, כי המסגרת של האפליקציה טוענת אותן בכל מסך.
 */
export function mockApi(routes: Record<string, RouteHandler> = {}) {
  const all: Record<string, RouteHandler> = {
    'GET /api/notifications': { items: [], unreadCount: 0 },
    ...routes
  };
  const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = new URL(String(input));
    const key = `${init?.method ?? 'GET'} ${url.pathname}`;
    const handler = all[key];
    if (handler === undefined) {
      return jsonResponse({ error: { code: 'NOT_MOCKED', message: `לא הוגדרה תשובה ל-${key}` } }, 404);
    }
    return typeof handler === 'function'
      ? (handler as HandlerFn)(init, url)
      : jsonResponse(handler);
  });
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

/** כל הקריאות ל-"METHOD /path" מסוים, לבדיקת מה נשלח */
export function callsTo(fetchMock: ReturnType<typeof vi.fn>, key: string) {
  return fetchMock.mock.calls.filter(([input, init]) => {
    const url = new URL(String(input));
    return `${(init as RequestInit | undefined)?.method ?? 'GET'} ${url.pathname}` === key;
  }) as [string, RequestInit][];
}

export const makeLesson = (over: Partial<Lesson> = {}): Lesson => ({
  id: 'l1',
  subject: { id: 's1', name: 'מבני נתונים' },
  teacher: { id: 't1', fullName: 'רחל כהן' },
  class: { id: 'c1', name: 'ה1', grade: 'HEH' },
  dayOfWeek: 0,
  startTime: '09:00',
  endTime: '10:30',
  room: '101',
  status: 'ACTIVE',
  changeNote: null,
  ...over
});

export const makeHomework = (over: Partial<Homework> = {}): Homework => ({
  id: 'h1',
  title: 'תרגיל 3 - מערכים',
  description: 'פתרי את שאלות 1-5 בעמוד 42',
  lessonDate: '2026-10-26',
  dueDate: '2999-01-01',
  createdAt: '2026-10-26T08:00:00.000Z',
  createdBy: { id: 't1', fullName: 'רחל כהן' },
  lesson: {
    id: 'l1',
    subject: { id: 's1', name: 'מבני נתונים' },
    class: { id: 'c1', name: 'ה1' },
    dayOfWeek: 0,
    startTime: '09:00',
    endTime: '10:30',
    room: '101'
  },
  mySubmission: null,
  ...over
});

export const makeSubmission = (over: Partial<Submission> = {}): Submission => ({
  id: 'sub1',
  comment: null,
  submittedAt: '2026-10-27T10:00:00.000Z',
  updatedAt: '2026-10-27T10:00:00.000Z',
  isLate: false,
  files: [{ id: 'f1', fileName: 'exercise1.zip', mimeType: 'application/zip', sizeBytes: 2048 }],
  student: { id: 'student-1', fullName: 'מרים לוי', class: { id: 'c1', name: 'ה1' } },
  homework: {
    id: 'h1',
    title: 'תרגיל 3 - מערכים',
    dueDate: '2999-01-01',
    lesson: { id: 'l1', subject: { id: 's1', name: 'מבני נתונים' }, class: { id: 'c1', name: 'ה1' } }
  },
  feedback: null,
  ...over
});

export const makeNote = (over: Partial<Note> = {}): Note => ({
  id: 'n1',
  content: 'לחזור על רקורסיה',
  createdAt: '2026-10-27T08:00:00.000Z',
  updatedAt: '2026-10-27T08:00:00.000Z',
  lesson: { id: 'l1', subject: 'מבני נתונים', class: 'ה1', dayOfWeek: 0, startTime: '09:00' },
  ...over
});
