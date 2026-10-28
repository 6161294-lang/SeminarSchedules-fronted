import { describe, expect, it } from 'vitest';
import { MAX_FILE_BYTES, validateFiles } from './submissionRules';

const file = (name: string, size = 10) => new File([new Uint8Array(size)], name);

describe('validateFiles', () => {
  it('הגשה ראשונה דורשת קובץ, הגשה חוזרת לא', () => {
    expect(validateFiles([], true)).toBe('חובה לצרף לפחות קובץ אחד');
    expect(validateFiles([], false)).toBeNull();
  });

  it('מקבל קבצים תקינים (גם באותיות גדולות)', () => {
    expect(validateFiles([file('a.pdf'), file('B.ZIP'), file('main.py')], true)).toBeNull();
  });

  it('דוחה יותר מ-5 קבצים', () => {
    const six = Array.from({ length: 6 }, (_, i) => file(`f${i}.txt`));
    expect(validateFiles(six, true)).toBe('אפשר להעלות עד 5 קבצים');
    expect(validateFiles(six.slice(0, 5), true)).toBeNull();
  });

  it('דוחה קובץ גדול מ-5MB, וקובץ בדיוק 5MB מותר', () => {
    expect(validateFiles([file('big.zip', MAX_FILE_BYTES + 1)], true)).toContain('גדול מדי');
    expect(validateFiles([file('ok.zip', MAX_FILE_BYTES)], true)).toBeNull();
  });

  it('דוחה סוג לא מותר וקובץ בלי סיומת', () => {
    expect(validateFiles([file('virus.exe')], true)).toBe('סוג הקובץ "virus.exe" אינו מותר');
    expect(validateFiles([file('README')], true)).toBe('סוג הקובץ "README" אינו מותר');
  });

  it('דוחה קובץ ריק', () => {
    expect(validateFiles([file('empty.txt', 0)], true)).toBe('הקובץ "empty.txt" ריק');
  });
});
