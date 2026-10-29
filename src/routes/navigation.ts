import type { IconName } from '@/components/ui/Icon';
import type { Role } from '@/types/api';
import { paths } from './paths';

export interface NavItem {
  to: string;
  label: string;
  icon: IconName;
  /** true: הקישור פעיל רק בכתובת המדויקת (למסך הבית של התפקיד) */
  end?: boolean;
}

// תפריט הניווט של כל תפקיד
export const NAV_ITEMS: Record<Role, NavItem[]> = {
  STUDENT: [
    { to: paths.student, label: 'מערכת שבועית', icon: 'calendar', end: true },
    { to: `${paths.student}/homework`, label: 'שיעורי בית', icon: 'homework' },
    { to: `${paths.student}/submissions`, label: 'ההגשות שלי', icon: 'upload' },
    { to: `${paths.student}/notebook`, label: 'המחברת שלי', icon: 'notebook' }
  ],
  TEACHER: [
    { to: paths.teacher, label: 'המערכת שלי', icon: 'calendar', end: true },
    { to: `${paths.teacher}/homework`, label: 'שיעורי בית', icon: 'homework' },
    { to: `${paths.teacher}/submissions`, label: 'הגשות', icon: 'upload' },
    { to: `${paths.teacher}/notebook`, label: 'ההערות שלי', icon: 'notebook' },
    { to: `${paths.teacher}/messages`, label: 'הודעות למזכירה', icon: 'messages' }
  ],
  ADMIN: [
    { to: paths.admin, label: 'לוח זמנים', icon: 'calendar', end: true },
    { to: `${paths.admin}/users`, label: 'משתמשים', icon: 'users' },
    { to: `${paths.admin}/catalog`, label: 'כיתות ומקצועות', icon: 'catalog' },
    { to: `${paths.admin}/announcements`, label: 'הודעות', icon: 'megaphone' },
    { to: `${paths.admin}/messages`, label: 'שיחות עם מורות', icon: 'messages' }
  ]
};
