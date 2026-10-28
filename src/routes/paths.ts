import type { Role } from '@/types/api';

// כל הנתיבים במקום אחד, כדי לא לכתוב מחרוזות בכל מקום
export const paths = {
  login: '/login',
  register: '/register',
  forbidden: '/forbidden',
  notifications: '/notifications',
  student: '/student',
  teacher: '/teacher',
  admin: '/admin'
} as const;

export const ROLE_LABELS: Record<Role, string> = {
  ADMIN: 'מזכירה',
  TEACHER: 'מורה',
  STUDENT: 'תלמידה'
};

/**
 * לאן עוברים אחרי התחברות. חוזרים לדף שביקשו רק אם הוא שייך לתפקיד שנכנס
 * (או משותף לכולן). אחרת, למשל כשמורה יצאה ותלמידה נכנסה, עוברים למסך הבית.
 */
export function resolvePostLoginPath(role: Role, from?: string): string {
  const home = homePathForRole(role);
  if (!from) return home;
  const isOwnArea = from === home || from.startsWith(`${home}/`);
  const isShared = from === paths.notifications;
  return isOwnArea || isShared ? from : home;
}

/** מסך הבית של כל תפקיד אחרי התחברות */
export function homePathForRole(role: Role): string {
  switch (role) {
    case 'ADMIN':
      return paths.admin;
    case 'TEACHER':
      return paths.teacher;
    case 'STUDENT':
      return paths.student;
  }
}
