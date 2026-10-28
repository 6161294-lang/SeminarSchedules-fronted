import type { Role } from '@/types/api';
import { paths } from './paths';

export interface NavItem {
  to: string;
  label: string;
  /** true: הקישור פעיל רק בכתובת המדויקת (למסך הבית של התפקיד) */
  end?: boolean;
}

// תפריט הניווט של כל תפקיד
export const NAV_ITEMS: Record<Role, NavItem[]> = {
  STUDENT: [
    { to: paths.student, label: 'מערכת שבועית', end: true },
    { to: `${paths.student}/homework`, label: 'שיעורי בית' },
    { to: `${paths.student}/submissions`, label: 'ההגשות שלי' },
    { to: `${paths.student}/notebook`, label: 'המחברת שלי' }
  ],
  TEACHER: [
    { to: paths.teacher, label: 'המערכת שלי', end: true },
    { to: `${paths.teacher}/homework`, label: 'שיעורי בית' },
    { to: `${paths.teacher}/submissions`, label: 'הגשות' },
    { to: `${paths.teacher}/notebook`, label: 'ההערות שלי' },
    { to: `${paths.teacher}/messages`, label: 'הודעות למזכירה' }
  ],
  ADMIN: [
    { to: paths.admin, label: 'לוח זמנים', end: true },
    { to: `${paths.admin}/users`, label: 'משתמשים' },
    { to: `${paths.admin}/catalog`, label: 'כיתות ומקצועות' },
    { to: `${paths.admin}/announcements`, label: 'הודעות' },
    { to: `${paths.admin}/messages`, label: 'שיחות עם מורות' }
  ]
};
