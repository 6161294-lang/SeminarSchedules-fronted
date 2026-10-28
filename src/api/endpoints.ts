import type {
  Announcement,
  AppNotification,
  ChangePasswordInput,
  ClassInput,
  ClassItem,
  CreateAnnouncementInput,
  CreateHomeworkInput,
  CreateLessonInput,
  CreateNoteInput,
  CreateUserInput,
  DaySchedule,
  Feedback,
  Homework,
  HomeworkFilters,
  Lesson,
  LessonFilters,
  LoginInput,
  LoginResponse,
  RegisterInput,
  Note,
  NoteFilters,
  NotificationList,
  SendThreadMessageInput,
  Subject,
  SubjectInput,
  Submission,
  SubmissionFilters,
  ThreadMessage,
  ThreadSummary,
  UpdateHomeworkInput,
  UpdateLessonInput,
  UpdateUserInput,
  User,
  UserFilters,
  UserList,
  WeekSchedule
} from '@/types/api';
import { download, request } from './client';

// כל הקריאות לשרת במקום אחד, מקובצות לפי נושא

export const authApi = {
  login: (input: LoginInput) =>
    request<LoginResponse>('/api/auth/login', { method: 'POST', body: input, auth: false }),
  register: (input: RegisterInput) =>
    request<LoginResponse>('/api/auth/register', { method: 'POST', body: input, auth: false }),
  logout: () => request('/api/auth/logout', { method: 'POST' }),
  me: () => request<User>('/api/auth/me'),
  changePassword: (input: ChangePasswordInput) =>
    request('/api/auth/change-password', { method: 'POST', body: input })
};

export const usersApi = {
  list: (filters: UserFilters = {}) => request<UserList>('/api/users', { query: filters }),
  create: (input: CreateUserInput) => request<User>('/api/users', { method: 'POST', body: input }),
  update: (id: string, input: UpdateUserInput) =>
    request<User>(`/api/users/${id}`, { method: 'PATCH', body: input })
};

export const catalogApi = {
  classes: () => request<ClassItem[]>('/api/classes'),
  createClass: (input: ClassInput) => request<ClassItem>('/api/classes', { method: 'POST', body: input }),
  updateClass: (id: string, input: Partial<ClassInput>) =>
    request<ClassItem>(`/api/classes/${id}`, { method: 'PATCH', body: input }),
  subjects: () => request<Subject[]>('/api/subjects'),
  createSubject: (input: SubjectInput) =>
    request<Subject>('/api/subjects', { method: 'POST', body: input }),
  updateSubject: (id: string, input: SubjectInput) =>
    request<Subject>(`/api/subjects/${id}`, { method: 'PATCH', body: input })
};

export const lessonsApi = {
  list: (filters: LessonFilters = {}) => request<Lesson[]>('/api/lessons', { query: filters }),
  week: () => request<WeekSchedule>('/api/lessons/week'),
  day: (dayOfWeek: number) => request<DaySchedule>(`/api/lessons/day/${dayOfWeek}`),
  get: (id: string) => request<Lesson>(`/api/lessons/${id}`),
  create: (input: CreateLessonInput) => request<Lesson>('/api/lessons', { method: 'POST', body: input }),
  update: (id: string, input: UpdateLessonInput) =>
    request<Lesson>(`/api/lessons/${id}`, { method: 'PATCH', body: input }),
  remove: (id: string) => request(`/api/lessons/${id}`, { method: 'DELETE' })
};

export const notesApi = {
  list: (filters: NoteFilters = {}) => request<Note[]>('/api/notes', { query: filters }),
  create: (input: CreateNoteInput) => request<Note>('/api/notes', { method: 'POST', body: input }),
  update: (id: string, content: string) =>
    request<Note>(`/api/notes/${id}`, { method: 'PATCH', body: { content } }),
  remove: (id: string) => request(`/api/notes/${id}`, { method: 'DELETE' })
};

export const homeworksApi = {
  list: (filters: HomeworkFilters = {}) => request<Homework[]>('/api/homeworks', { query: filters }),
  get: (id: string) => request<Homework>(`/api/homeworks/${id}`),
  create: (input: CreateHomeworkInput) =>
    request<Homework>('/api/homeworks', { method: 'POST', body: input }),
  update: (id: string, input: UpdateHomeworkInput) =>
    request<Homework>(`/api/homeworks/${id}`, { method: 'PATCH', body: input }),
  remove: (id: string) => request(`/api/homeworks/${id}`, { method: 'DELETE' }),
  /** הגשה: multipart עם files ו-comment */
  submit: (id: string, form: FormData) =>
    request<Submission>(`/api/homeworks/${id}/submission`, { method: 'POST', body: form })
};

export const submissionsApi = {
  mine: () => request<Submission[]>('/api/submissions/mine'),
  list: (filters: SubmissionFilters = {}) =>
    request<Submission[]>('/api/submissions', { query: filters }),
  get: (id: string) => request<Submission>(`/api/submissions/${id}`),
  saveFeedback: (id: string, content: string) =>
    request<Feedback>(`/api/submissions/${id}/feedback`, { method: 'PUT', body: { content } }),
  downloadFile: (fileId: string) => download(`/api/submission-files/${fileId}`)
};

export const notificationsApi = {
  list: (unreadOnly = false) =>
    request<NotificationList>('/api/notifications', { query: { unreadOnly: unreadOnly || undefined } }),
  markRead: (id: string) => request<AppNotification>(`/api/notifications/${id}/read`, { method: 'PATCH' }),
  markAllRead: () => request<{ updated: number }>('/api/notifications/read-all', { method: 'POST' })
};

export const messagingApi = {
  announcements: () => request<Announcement[]>('/api/announcements'),
  createAnnouncement: (input: CreateAnnouncementInput) =>
    request<Announcement>('/api/announcements', { method: 'POST', body: input }),
  threads: () => request<ThreadSummary[]>('/api/teacher-messages/threads'),
  thread: (teacherId?: string) =>
    request<ThreadMessage[]>('/api/teacher-messages', { query: { teacherId } }),
  sendMessage: (input: SendThreadMessageInput) =>
    request<ThreadMessage>('/api/teacher-messages', { method: 'POST', body: input })
};
