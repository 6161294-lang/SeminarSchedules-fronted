import { describe, expect, it } from 'vitest';
import { homePathForRole, resolvePostLoginPath } from './paths';

describe('resolvePostLoginPath', () => {
  it('בלי דף קודם: מסך הבית של התפקיד', () => {
    expect(resolvePostLoginPath('STUDENT')).toBe('/student');
    expect(resolvePostLoginPath('TEACHER')).toBe('/teacher');
    expect(resolvePostLoginPath('ADMIN')).toBe('/admin');
  });

  it('חוזרת לדף קודם שמתאים לתפקיד', () => {
    expect(resolvePostLoginPath('TEACHER', '/teacher/homework')).toBe('/teacher/homework');
    expect(resolvePostLoginPath('STUDENT', '/student')).toBe('/student');
    expect(resolvePostLoginPath('ADMIN', '/notifications')).toBe('/notifications');
  });

  it('דף של תפקיד אחר או דף חסימה: מסך הבית', () => {
    expect(resolvePostLoginPath('STUDENT', '/teacher/homework')).toBe('/student');
    expect(resolvePostLoginPath('STUDENT', '/admin')).toBe('/student');
    expect(resolvePostLoginPath('TEACHER', '/forbidden')).toBe('/teacher');
  });

  it('לא מתבלבלת בין קידומות דומות', () => {
    expect(resolvePostLoginPath('STUDENT', '/student-evil')).toBe('/student');
  });

  it('homePathForRole', () => {
    expect(homePathForRole('ADMIN')).toBe('/admin');
  });
});
