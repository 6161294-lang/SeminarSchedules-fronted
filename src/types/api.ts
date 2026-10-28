// הטיפוסים של ה-API. הם משקפים בדיוק את התשובות של ה-Backend (ראי FRONTEND-API-GUIDE.md)

export type Role = 'ADMIN' | 'TEACHER' | 'STUDENT';
/** HEH = מחזור ה׳, VAV = מחזור ו׳ */
export type Grade = 'HEH' | 'VAV';
export type LessonStatus = 'ACTIVE' | 'CANCELLED';
export type NotificationType =
  | 'LESSON_CHANGED'
  | 'ANNOUNCEMENT'
  | 'HOMEWORK_ADDED'
  | 'FEEDBACK_ADDED'
  | 'MESSAGE';
export type AnnouncementAudience = 'ALL_STUDENTS' | 'ALL_TEACHERS' | 'GRADE' | 'CLASS';

// ---------- כיתות, מקצועות ומשתמשים ----------

export interface ClassItem {
  id: string;
  name: string;
  grade: Grade;
}

export interface Subject {
  id: string;
  name: string;
}

export interface User {
  id: string;
  fullName: string;
  email: string;
  role: Role;
  classId: string | null;
  seminarId?: string;
  isActive: boolean;
  createdAt: string;
  class?: ClassItem | null;
}

export interface UserList {
  items: User[];
  total: number;
  page: number;
  limit: number;
}

export interface LoginResponse {
  sessionKey: string;
  expiresAt: string;
  user: User;
}

// ---------- לוח זמנים ----------

export interface Lesson {
  id: string;
  subject: Subject;
  teacher: { id: string; fullName: string };
  class: ClassItem;
  /** 0 = ראשון ... 5 = שישי */
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  room: string;
  status: LessonStatus;
  changeNote: string | null;
}

export interface DaySchedule {
  dayOfWeek: number;
  name: string;
  lessons: Lesson[];
}

export interface WeekSchedule {
  days: DaySchedule[];
}

// ---------- הערות אישיות ----------

export interface Note {
  id: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  lesson: { id: string; subject: string; class: string; dayOfWeek: number; startTime: string };
}

// ---------- שיעורי בית והגשות ----------

export interface Homework {
  id: string;
  title: string;
  description: string;
  lessonDate: string;
  dueDate: string;
  createdAt: string;
  createdBy: { id: string; fullName: string };
  lesson: {
    id: string;
    subject: Subject;
    class: { id: string; name: string };
    dayOfWeek: number;
    startTime: string;
    endTime: string;
    room: string;
  };
  /** מוחזר לתלמידה בלבד */
  mySubmission?: { id: string; submittedAt: string } | null;
  /** מוחזר למורה בלבד */
  submissionsCount?: number;
}

export interface SubmissionFile {
  id: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
}

export interface Feedback {
  content: string;
  createdAt: string;
  updatedAt: string;
  teacher: { id: string; fullName: string };
}

export interface Submission {
  id: string;
  comment: string | null;
  submittedAt: string;
  updatedAt: string;
  isLate: boolean;
  files: SubmissionFile[];
  student: { id: string; fullName: string; class: { id: string; name: string } | null };
  homework: {
    id: string;
    title: string;
    dueDate: string;
    lesson: { id: string; subject: Subject; class: { id: string; name: string } };
  };
  feedback: Feedback | null;
}

// ---------- התראות והודעות ----------

export interface AppNotification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  lessonId: string | null;
  announcementId: string | null;
  isRead: boolean;
  createdAt: string;
}

export interface NotificationList {
  items: AppNotification[];
  unreadCount: number;
}

export interface Announcement {
  id: string;
  audience: AnnouncementAudience;
  grade?: Grade | null;
  classId?: string | null;
  title: string;
  body: string;
  createdAt: string;
  sender?: { id: string; fullName: string };
  /** מוחזר למזכירה בלבד */
  recipientCount?: number;
}

export interface ThreadMessage {
  id: string;
  body: string;
  createdAt: string;
  readAt: string | null;
  sender: { id: string; fullName: string; role: Role };
  isMine: boolean;
}

export interface ThreadSummary {
  teacher: { id: string; fullName: string };
  lastMessage: { body: string; createdAt: string; senderId: string };
  unreadCount: number;
}

// ---------- קלטים (גופי בקשות) ----------

export interface LoginInput {
  email: string;
  password: string;
}

export interface RegisterInput {
  seminarName: string;
  fullName: string;
  email: string;
  password: string;
}

export interface ChangePasswordInput {
  currentPassword: string;
  newPassword: string;
}

export interface CreateUserInput {
  fullName: string;
  email: string;
  password: string;
  role: Role;
  classId?: string;
}

export interface UpdateUserInput {
  fullName?: string;
  email?: string;
  password?: string;
  classId?: string;
  isActive?: boolean;
}

export interface ClassInput {
  name: string;
  grade: Grade;
}

export interface SubjectInput {
  name: string;
}

export interface CreateLessonInput {
  subjectId: string;
  teacherId: string;
  classId: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  room: string;
  changeNote?: string;
}

export interface UpdateLessonInput extends Partial<Omit<CreateLessonInput, 'changeNote'>> {
  status?: LessonStatus;
  changeNote?: string | null;
}

export interface CreateHomeworkInput {
  lessonId: string;
  title: string;
  description: string;
  dueDate: string;
}

export interface UpdateHomeworkInput {
  title?: string;
  description?: string;
  dueDate?: string;
}

export interface CreateNoteInput {
  lessonId: string;
  content: string;
}

export interface CreateAnnouncementInput {
  audience: AnnouncementAudience;
  grade?: Grade;
  classId?: string;
  title: string;
  body: string;
}

export interface SendThreadMessageInput {
  teacherId?: string;
  body: string;
}

// ---------- סינונים ----------

export interface LessonFilters {
  classId?: string;
  teacherId?: string;
  dayOfWeek?: number;
  status?: LessonStatus;
}

export interface UserFilters {
  role?: Role;
  classId?: string;
  isActive?: boolean;
  search?: string;
  page?: number;
  limit?: number;
}

export interface NoteFilters {
  lessonId?: string;
  search?: string;
}

export interface HomeworkFilters {
  lessonId?: string;
  upcoming?: boolean;
}

export interface SubmissionFilters {
  classId?: string;
  subjectId?: string;
  homeworkId?: string;
  search?: string;
  sortBy?: 'submittedAt' | 'studentName';
  order?: 'asc' | 'desc';
}
