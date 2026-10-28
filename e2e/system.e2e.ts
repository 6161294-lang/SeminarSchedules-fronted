import { describe, expect, it } from 'vitest';
import { ApiError, configureApiClient } from '@/api/client';
import {
  authApi,
  catalogApi,
  homeworksApi,
  lessonsApi,
  messagingApi,
  notesApi,
  notificationsApi,
  submissionsApi,
  usersApi
} from '@/api/endpoints';
import type { Lesson, User } from '@/types/api';
import { israelToday } from '@/utils/today';

/**
 * בדיקות מקצה לקצה: אותו קוד API שה-React משתמש בו, מול Backend אמיתי ומסד PostgreSQL אמיתי.
 * מריצים רק מול מסד לבדיקות עם נתוני Seed (npm run test:e2e).
 */
const PASSWORD = 'Password123!';
const runId = Date.now().toString(36);

let token: string | null = null;
let unauthorizedCalls = 0;
configureApiClient({
  getToken: () => token,
  onUnauthorized: () => {
    unauthorizedCalls += 1;
  }
});

async function loginAs(email: string, password = PASSWORD) {
  const result = await authApi.login({ email, password });
  token = result.sessionKey;
  return result;
}

async function expectApiError(promise: Promise<unknown>, status: number, code?: string) {
  const error = await promise.then(
    () => null,
    (e: unknown) => e
  );
  expect(error, `ציפינו לשגיאה ${status}`).toBeInstanceOf(ApiError);
  expect((error as ApiError).status).toBe(status);
  if (code) expect((error as ApiError).code).toBe(code);
  return error as ApiError;
}

function addDays(dateString: string, days: number): string {
  const d = new Date(`${dateString}T00:00:00.000Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

const today = israelToday();
// שיעורי בית אפשר ליצור רק ביום השיעור. בשבת אין שיעורים, ולכן הבדיקות האלה מדולגות
const canTestHomework = today.dayOfWeek <= 5;
const lessonDay = canTestHomework ? today.dayOfWeek : 0;

const accounts = {
  admin: 'secretary@example.com',
  student: `e2e.student.${runId}@example.com`,
  teacher: `e2e.teacher.${runId}@example.com`,
  otherStudent: 'dina.student@example.com',
  otherClassStudent: 'tamar.student@example.com'
};

// מצב משותף בין השלבים (הם רצים לפי הסדר)
const s: {
  classId: string;
  subjectId: string;
  teacher: User;
  student: User;
  lesson: Lesson;
  homeworkId: string;
  submissionId: string;
  fileId: string;
} = {} as never;

describe.runIf(process.env.E2E_RUN === '1')('מערכת מלאה מול Backend אמיתי', () => {
  it('התחברות לכל תפקיד, ושום סוד לא חוזר', async () => {
    for (const [email, role] of [
      [accounts.admin, 'ADMIN'],
      ['rachel.teacher@example.com', 'TEACHER'],
      [accounts.otherStudent, 'STUDENT']
    ] as const) {
      const result = await loginAs(email);
      expect(result.user.role).toBe(role);
      expect(result.sessionKey).toHaveLength(43);
      expect(result.sessionKey.startsWith('eyJ')).toBe(false); // המפתח אקראי, לא JWT
      expect(JSON.stringify(result)).not.toMatch(/passwordHash|password/i);
      expect((await authApi.me()).id).toBe(result.user.id);
    }
  });

  it('התחברות שגויה מחזירה 401 עם קוד ברור', async () => {
    token = null;
    await expectApiError(authApi.login({ email: accounts.admin, password: 'wrong-password' }), 401, 'INVALID_CREDENTIALS');
    await expectApiError(authApi.login({ email: 'nobody@example.com', password: PASSWORD }), 401, 'INVALID_CREDENTIALS');
  });

  it('בלי מפתח: 401', async () => {
    token = null;
    await expectApiError(authApi.me(), 401);
    await expectApiError(lessonsApi.list(), 401);
  });

  it('הרשאות: כל תפקיד נחסם ב-403 במה שלא שלו', async () => {
    await loginAs(accounts.otherStudent);
    await expectApiError(usersApi.list(), 403);
    await expectApiError(
      lessonsApi.create({ subjectId: 'x', teacherId: 'x', classId: 'x', dayOfWeek: 0, startTime: '09:00', endTime: '10:00', room: '1' }),
      403
    );
    await expectApiError(submissionsApi.list(), 403);

    await loginAs('rachel.teacher@example.com');
    await expectApiError(
      messagingApi.createAnnouncement({ audience: 'ALL_STUDENTS', title: 'x', body: 'x' }),
      403
    );
    await expectApiError(usersApi.list(), 403);

    await loginAs(accounts.admin);
    await expectApiError(homeworksApi.list(), 403);
    await expectApiError(submissionsApi.list(), 403);
    await expectApiError(submissionsApi.mine(), 403);
  });

  it('מזכירה פותחת כיתה, מקצוע, מורה ותלמידה', async () => {
    await loginAs(accounts.admin);
    const cls = await catalogApi.createClass({ name: `E2E-${runId}`, grade: 'HEH' });
    const subject = await catalogApi.createSubject({ name: `מקצוע E2E ${runId}` });
    s.classId = cls.id;
    s.subjectId = subject.id;

    s.teacher = await usersApi.create({
      fullName: 'מורת בדיקה',
      email: accounts.teacher,
      password: PASSWORD,
      role: 'TEACHER'
    });
    s.student = await usersApi.create({
      fullName: 'תלמידת בדיקה',
      email: accounts.student,
      password: PASSWORD,
      role: 'STUDENT',
      classId: cls.id
    });
    expect(s.student.classId).toBe(cls.id);
    expect(JSON.stringify(s)).not.toContain('passwordHash');

    // כללי יצירה: תלמידה בלי כיתה, כפילות אימייל
    await expectApiError(
      usersApi.create({ fullName: 'א', email: `x.${runId}@example.com`, password: PASSWORD, role: 'STUDENT' }),
      400,
      'VALIDATION_ERROR'
    );
    await expectApiError(
      usersApi.create({ fullName: 'ב', email: accounts.teacher, password: PASSWORD, role: 'TEACHER' }),
      409
    );
    await expectApiError(catalogApi.createClass({ name: `E2E-${runId}`, grade: 'HEH' }), 409);
  });

  it('מזכירה יוצרת שיעור, והתנגשות נחסמת עם סיבות', async () => {
    await loginAs(accounts.admin);
    s.lesson = await lessonsApi.create({
      subjectId: s.subjectId,
      teacherId: s.teacher.id,
      classId: s.classId,
      dayOfWeek: lessonDay,
      startTime: '06:00',
      endTime: '07:00',
      room: `חדר E2E ${runId}`
    });
    expect(s.lesson).toMatchObject({ status: 'ACTIVE', class: { id: s.classId }, teacher: { id: s.teacher.id } });

    const conflict = await expectApiError(
      lessonsApi.create({
        subjectId: s.subjectId,
        teacherId: s.teacher.id,
        classId: s.classId,
        dayOfWeek: lessonDay,
        startTime: '06:30',
        endTime: '07:30',
        room: 'חדר אחר'
      }),
      409,
      'LESSON_CONFLICT'
    );
    const reasons = (conflict.rawDetails as { reasons: string[] }[]).flatMap((d) => d.reasons);
    expect(reasons).toContain('המורה כבר מלמדת בשעה זו');
    expect(reasons).toContain('לכיתה כבר יש שיעור בשעה זו');

    await expectApiError(
      lessonsApi.create({ subjectId: s.subjectId, teacherId: s.teacher.id, classId: s.classId, dayOfWeek: lessonDay, startTime: '09:00', endTime: '08:00', room: '1' }),
      400,
      'VALIDATION_ERROR'
    );
  });

  it('תלמידה ומורה רואות את השיעור במערכת השבועית והיומית', async () => {
    await loginAs(accounts.student);
    const week = await lessonsApi.week();
    expect(week.days).toHaveLength(6);
    expect(week.days[lessonDay]!.lessons.map((l) => l.id)).toContain(s.lesson.id);
    const day = await lessonsApi.day(lessonDay);
    expect(day.lessons).toEqual([expect.objectContaining({ id: s.lesson.id, room: s.lesson.room, startTime: '06:00' })]);

    await loginAs(accounts.teacher);
    expect((await lessonsApi.day(lessonDay)).lessons[0]).toMatchObject({ id: s.lesson.id, class: { id: s.classId } });

    // תלמידה מכיתה אחרת לא רואה אותו
    await loginAs(accounts.otherClassStudent);
    const other = await lessonsApi.list();
    expect(other.map((l) => l.id)).not.toContain(s.lesson.id);
    await expectApiError(lessonsApi.get(s.lesson.id), 404);
  });

  it('ביטול שיעור מסתיר אותו ממורה ומתלמידה, והחזרה מחזירה', async () => {
    await loginAs(accounts.admin);
    await lessonsApi.update(s.lesson.id, { status: 'CANCELLED' });
    expect((await lessonsApi.list({ status: 'CANCELLED', classId: s.classId })).map((l) => l.id)).toEqual([s.lesson.id]);

    await loginAs(accounts.student);
    expect((await lessonsApi.day(lessonDay)).lessons).toEqual([]);
    await expectApiError(lessonsApi.get(s.lesson.id), 404);
    const notifications = await notificationsApi.list();
    expect(notifications.items[0]).toMatchObject({ type: 'LESSON_CHANGED', title: 'שיעור בוטל', isRead: false });

    await loginAs(accounts.teacher);
    expect((await lessonsApi.week()).days[lessonDay]!.lessons).toEqual([]);

    await loginAs(accounts.admin);
    await lessonsApi.update(s.lesson.id, { status: 'ACTIVE' });
    await loginAs(accounts.student);
    expect((await lessonsApi.day(lessonDay)).lessons).toHaveLength(1);
  });

  it('העברת שיעור: מופיע רק ביום החדש', async () => {
    const newDay = (lessonDay + 1) % 6;
    await loginAs(accounts.admin);
    await lessonsApi.update(s.lesson.id, { dayOfWeek: newDay });

    await loginAs(accounts.student);
    expect((await lessonsApi.day(lessonDay)).lessons).toEqual([]);
    expect((await lessonsApi.day(newDay)).lessons.map((l) => l.id)).toEqual([s.lesson.id]);

    await loginAs(accounts.admin);
    await lessonsApi.update(s.lesson.id, { dayOfWeek: lessonDay });
  });

  describe.runIf(canTestHomework)('שיעורי בית והגשות (ביום שיש בו שיעור)', () => {
    it('מורה יוצרת שיעורי בית לשיעור של היום, ותלמידה רואה אותם', async () => {
      await loginAs(accounts.teacher);
      const dueDate = addDays(today.dateString, 3);
      const homework = await homeworksApi.create({
        lessonId: s.lesson.id,
        title: `תרגיל E2E ${runId}`,
        description: 'לפתור שאלות 1-3',
        dueDate
      });
      s.homeworkId = homework.id;
      expect(homework).toMatchObject({ lessonDate: today.dateString, dueDate });

      // כללים: תאריך הגשה חייב להיות אחרי היום
      await expectApiError(
        homeworksApi.create({ lessonId: s.lesson.id, title: 'x', description: 'x', dueDate: today.dateString }),
        400,
        'INVALID_DUE_DATE'
      );

      await loginAs(accounts.student);
      const list = await homeworksApi.list();
      expect(list).toEqual([expect.objectContaining({ id: homework.id, mySubmission: null })]);

      await loginAs(accounts.otherClassStudent);
      expect(await homeworksApi.list()).toEqual([]);
      await expectApiError(homeworksApi.get(homework.id), 403);
    });

    it('תלמידה מגישה קבצים, והגשה חוזרת מחליפה אותם', async () => {
      await loginAs(accounts.student);
      const first = new FormData();
      first.append('files', new File(['print("שלום")\n'], 'main.py', { type: 'text/x-python' }));
      first.append('files', new File(['notes'], 'notes.txt', { type: 'text/plain' }));
      first.append('comment', 'לא הצלחתי את שאלה 3');

      const created = await homeworksApi.submit(s.homeworkId, first);
      s.submissionId = created.id;
      expect(created.files.map((f) => f.fileName).sort()).toEqual(['main.py', 'notes.txt']);
      expect(created).toMatchObject({ comment: 'לא הצלחתי את שאלה 3', isLate: false, feedback: null });

      const again = new FormData();
      again.append('files', new File(['v2'], 'שלום.txt', { type: 'text/plain' }));
      again.append('comment', 'גרסה שנייה');
      const replaced = await homeworksApi.submit(s.homeworkId, again);
      expect(replaced.id).toBe(s.submissionId);
      expect(replaced.files.map((f) => f.fileName)).toEqual(['שלום.txt']); // שם בעברית נשמר
      s.fileId = replaced.files[0]!.id;

      const mine = await submissionsApi.mine();
      expect(mine).toHaveLength(1);
      expect((await homeworksApi.list())[0]!.mySubmission?.id).toBe(s.submissionId);
    });

    it('כללי קבצים: סוג אסור, בלי קבצים וקובץ גדול נדחים', async () => {
      await loginAs(accounts.student);
      const exe = new FormData();
      exe.append('files', new File(['MZ'], 'virus.exe'));
      await expectApiError(homeworksApi.submit(s.homeworkId, exe), 400, 'FILE_TYPE_NOT_ALLOWED');

      const big = new FormData();
      big.append('files', new File([new Uint8Array(5 * 1024 * 1024 + 1)], 'big.zip'));
      await expectApiError(homeworksApi.submit(s.homeworkId, big), 413, 'FILE_TOO_LARGE');

      // הגשה שלא של הכיתה שלה
      await loginAs(accounts.otherClassStudent);
      const ok = new FormData();
      ok.append('files', new File(['x'], 'a.txt'));
      await expectApiError(homeworksApi.submit(s.homeworkId, ok), 403);
    });

    it('הורדת קובץ מחזירה את התוכן המדויק, ורק לתלמידה ולמורה', async () => {
      await loginAs(accounts.student);
      const own = await submissionsApi.downloadFile(s.fileId);
      expect(own.fileName).toBe('שלום.txt');
      expect(await own.blob.text()).toBe('v2');

      await loginAs(accounts.teacher);
      expect(await (await submissionsApi.downloadFile(s.fileId)).blob.text()).toBe('v2');

      await loginAs(accounts.otherStudent);
      await expectApiError(submissionsApi.downloadFile(s.fileId), 403);
      await expectApiError(submissionsApi.get(s.submissionId), 403);

      await loginAs(accounts.admin);
      await expectApiError(submissionsApi.downloadFile(s.fileId), 403);
      await expectApiError(submissionsApi.get(s.submissionId), 403);
    });

    it('מורה רואה את ההגשות עם סינון, חיפוש ומיון', async () => {
      await loginAs(accounts.teacher);
      expect((await submissionsApi.list()).map((x) => x.id)).toEqual([s.submissionId]);
      expect(await submissionsApi.list({ classId: s.classId, subjectId: s.subjectId, homeworkId: s.homeworkId })).toHaveLength(1);
      expect(await submissionsApi.list({ search: 'תלמידת' })).toHaveLength(1);
      expect(await submissionsApi.list({ search: 'אין כזאת' })).toEqual([]);
      expect(await submissionsApi.list({ classId: 'ffffffff-ffff-4fff-8fff-ffffffffffff' })).toEqual([]);
      expect(await submissionsApi.list({ sortBy: 'studentName', order: 'asc' })).toHaveLength(1);

      // מורה אחרת לא רואה
      await loginAs('leah.teacher@example.com');
      expect(await submissionsApi.list()).toEqual([]);
      await expectApiError(submissionsApi.get(s.submissionId), 403);
    });

    it('משוב: רק מורת השיעור נותנת, והתלמידה מקבלת התראה ורואה אותו', async () => {
      await loginAs(accounts.student);
      await expectApiError(submissionsApi.saveFeedback(s.submissionId, 'x'), 403);

      await loginAs('leah.teacher@example.com');
      await expectApiError(submissionsApi.saveFeedback(s.submissionId, 'x'), 403);

      await loginAs(accounts.teacher);
      const feedback = await submissionsApi.saveFeedback(s.submissionId, 'עבודה טובה');
      expect(feedback).toMatchObject({ content: 'עבודה טובה', teacher: { id: s.teacher.id } });
      expect((await submissionsApi.saveFeedback(s.submissionId, 'עבודה מצוינת')).content).toBe('עבודה מצוינת');

      await loginAs(accounts.student);
      expect((await submissionsApi.mine())[0]!.feedback?.content).toBe('עבודה מצוינת');
      const types = (await notificationsApi.list()).items.map((n) => n.type);
      expect(types).toContain('FEEDBACK_ADDED');
      expect(types).toContain('HOMEWORK_ADDED');

      await loginAs(accounts.otherStudent);
      await expectApiError(submissionsApi.get(s.submissionId), 403);
    });

    it('עריכה ומחיקה של שיעורי בית רק ליוצרת', async () => {
      await loginAs('leah.teacher@example.com');
      await expectApiError(homeworksApi.update(s.homeworkId, { title: 'פריצה' }), 403);
      await expectApiError(homeworksApi.remove(s.homeworkId), 403);

      await loginAs(accounts.teacher);
      expect((await homeworksApi.update(s.homeworkId, { title: 'כותרת חדשה' })).title).toBe('כותרת חדשה');
    });
  });

  it('הערות אישיות: כל אחת רואה רק את שלה', async () => {
    await loginAs(accounts.student);
    const studentNote = await notesApi.create({ lessonId: s.lesson.id, content: 'הערה של התלמידה' });
    expect(studentNote.lesson).toMatchObject({ id: s.lesson.id, class: `E2E-${runId}` });

    await loginAs(accounts.teacher);
    await notesApi.create({ lessonId: s.lesson.id, content: 'הערה של המורה' });
    expect((await notesApi.list()).map((n) => n.content)).toEqual(['הערה של המורה']);
    await expectApiError(notesApi.update(studentNote.id, 'פריצה'), 403);
    await expectApiError(notesApi.remove(studentNote.id), 403);

    await loginAs(accounts.student);
    expect((await notesApi.list()).map((n) => n.content)).toEqual(['הערה של התלמידה']);
    expect((await notesApi.update(studentNote.id, 'עודכן')).content).toBe('עודכן');

    // שיעור של כיתה אחרת
    await loginAs(accounts.admin);
    const otherLesson = (await lessonsApi.list()).find((l) => l.class.id !== s.classId)!;
    await loginAs(accounts.student);
    await expectApiError(notesApi.create({ lessonId: otherLesson.id, content: 'x' }), 403);

    await loginAs(accounts.admin);
    await expectApiError(notesApi.list(), 403);
  });

  it('הודעה מהמזכירה לכיתה מגיעה רק לנמענות שלה', async () => {
    await loginAs(accounts.admin);
    const sent = await messagingApi.createAnnouncement({
      audience: 'CLASS',
      classId: s.classId,
      title: 'הודעת E2E',
      body: 'שלום לכיתה'
    });
    expect(sent.recipientCount).toBe(1);
    await expectApiError(
      messagingApi.createAnnouncement({ audience: 'GRADE', title: 'x', body: 'x' }),
      400,
      'VALIDATION_ERROR'
    );

    await loginAs(accounts.student);
    expect((await messagingApi.announcements()).map((a) => a.title)).toContain('הודעת E2E');
    expect((await notificationsApi.list()).items.some((n) => n.type === 'ANNOUNCEMENT')).toBe(true);

    await loginAs(accounts.teacher);
    expect((await messagingApi.announcements()).map((a) => a.title)).not.toContain('הודעת E2E');
  });

  it('שיחה בין מורה למזכירה, כולל מונה "לא נקראו"', async () => {
    await loginAs(accounts.teacher);
    const sent = await messagingApi.sendMessage({ body: 'אפשר להחליף חדר?' });
    expect(sent).toMatchObject({ isMine: true, sender: { role: 'TEACHER' } });

    await loginAs(accounts.admin);
    const before = (await messagingApi.threads()).find((t) => t.teacher.id === s.teacher.id);
    expect(before?.unreadCount).toBe(1);

    const thread = await messagingApi.thread(s.teacher.id);
    expect(thread).toEqual([expect.objectContaining({ body: 'אפשר להחליף חדר?', isMine: false })]);
    expect((await messagingApi.threads()).find((t) => t.teacher.id === s.teacher.id)?.unreadCount).toBe(0);

    await messagingApi.sendMessage({ teacherId: s.teacher.id, body: 'בוודאי' });
    await expectApiError(messagingApi.sendMessage({ body: 'בלי מורה' }), 400);

    await loginAs(accounts.teacher);
    expect((await messagingApi.thread()).map((m) => [m.body, m.isMine])).toEqual([
      ['אפשר להחליף חדר?', true],
      ['בוודאי', false]
    ]);
    expect((await notificationsApi.list()).items.some((n) => n.type === 'MESSAGE')).toBe(true);

    // מורה אחרת לא רואה את השיחה
    await loginAs('leah.teacher@example.com');
    expect((await messagingApi.thread()).map((m) => m.body)).not.toContain('בוודאי');
  });

  it('התראות: סימון אחת וסימון הכול', async () => {
    await loginAs(accounts.student);
    const before = await notificationsApi.list();
    expect(before.unreadCount).toBeGreaterThan(1);

    const one = before.items[0]!;
    expect((await notificationsApi.markRead(one.id)).isRead).toBe(true);
    expect((await notificationsApi.list()).unreadCount).toBe(before.unreadCount - 1);

    const all = await notificationsApi.markAllRead();
    expect(all.updated).toBe(before.unreadCount - 1);
    expect((await notificationsApi.list()).unreadCount).toBe(0);
    expect((await notificationsApi.list(true)).items).toEqual([]);

    // התראה של משתמשת אחרת
    await loginAs(accounts.teacher);
    await expectApiError(notificationsApi.markRead(one.id), 404);
  });

  it('מחיקת שיעור מוחקת את שיעורי הבית וההגשות שלו', async () => {
    await loginAs(accounts.admin);
    await lessonsApi.remove(s.lesson.id);
    await expectApiError(lessonsApi.get(s.lesson.id), 404);

    await loginAs(accounts.student);
    expect(await homeworksApi.list()).toEqual([]);
    expect(await submissionsApi.mine()).toEqual([]);
  });

  it('התנתקות מבטלת את המפתח בשרת ומפעילה את טיפול ה-401', async () => {
    await loginAs(accounts.student);
    const key = token;
    const before = unauthorizedCalls;
    await authApi.logout();
    await expectApiError(authApi.me(), 401);
    expect(unauthorizedCalls).toBe(before + 1);

    token = key; // אותו מפתח, אחרי התנתקות
    await expectApiError(lessonsApi.list(), 401);
  });

  it('השבתת חשבון חוסמת התחברות ומנתקת התחברות קיימת', async () => {
    await loginAs(accounts.student);
    const key = token;

    await loginAs(accounts.admin);
    await usersApi.update(s.student.id, { isActive: false });

    token = null;
    await expectApiError(authApi.login({ email: accounts.student, password: PASSWORD }), 401, 'INVALID_CREDENTIALS');
    token = key;
    await expectApiError(authApi.me(), 401);

    await loginAs(accounts.admin);
    await expectApiError(usersApi.update(s.student.id, { isActive: 'כן' as never }), 400);
    expect((await usersApi.update(s.student.id, { isActive: true })).isActive).toBe(true);
    expect((await loginAs(accounts.student)).user.id).toBe(s.student.id);
  });
});
