import type {
  HomeworkFilters,
  LessonFilters,
  NoteFilters,
  SubmissionFilters,
  UserFilters
} from '@/types/api';

// מפתחות המטמון של React Query. מפתח קצר (all) מאפשר לרענן קבוצה שלמה בבת אחת
export const queryKeys = {
  me: () => ['me'] as const,
  users: {
    all: ['users'] as const,
    list: (filters: UserFilters) => ['users', 'list', filters] as const
  },
  classes: () => ['classes'] as const,
  subjects: () => ['subjects'] as const,
  lessons: {
    all: ['lessons'] as const,
    list: (filters: LessonFilters) => ['lessons', 'list', filters] as const,
    week: () => ['lessons', 'week'] as const,
    day: (dayOfWeek: number) => ['lessons', 'day', dayOfWeek] as const,
    detail: (id: string) => ['lessons', 'detail', id] as const
  },
  notes: {
    all: ['notes'] as const,
    list: (filters: NoteFilters) => ['notes', 'list', filters] as const
  },
  homeworks: {
    all: ['homeworks'] as const,
    list: (filters: HomeworkFilters) => ['homeworks', 'list', filters] as const,
    detail: (id: string) => ['homeworks', 'detail', id] as const
  },
  submissions: {
    all: ['submissions'] as const,
    mine: () => ['submissions', 'mine'] as const,
    list: (filters: SubmissionFilters) => ['submissions', 'list', filters] as const
  },
  notifications: {
    all: ['notifications'] as const,
    list: (unreadOnly: boolean) => ['notifications', 'list', unreadOnly] as const
  },
  messaging: {
    all: ['messaging'] as const,
    announcements: () => ['messaging', 'announcements'] as const,
    threads: () => ['messaging', 'threads'] as const,
    thread: (teacherId: string | undefined) => ['messaging', 'thread', teacherId ?? 'mine'] as const
  }
};
