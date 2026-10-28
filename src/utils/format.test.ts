import { describe, expect, it } from 'vitest';
import {
  dayName,
  formatDate,
  formatDateOnly,
  formatDateTime,
  formatFileSize,
  formatTimeRange
} from './format';

describe('format', () => {
  it('dayName: 0 הוא ראשון ו-5 הוא שישי', () => {
    expect(dayName(0)).toBe('ראשון');
    expect(dayName(5)).toBe('שישי');
    expect(dayName(9)).toBe('');
  });

  it('formatDate ו-formatDateTime לפי שעון ישראל', () => {
    // 22:30 UTC כבר אחרי חצות בישראל (UTC+2 בחורף)
    expect(formatDate('2026-11-01T22:30:00.000Z')).toBe('02.11.2026');
    expect(formatDateTime('2026-11-01T07:05:00.000Z')).toMatch(/01\.11\.2026.*09:05/);
  });

  it('formatDateOnly לא מזיז תאריך בין אזורי זמן', () => {
    expect(formatDateOnly('2026-10-30')).toBe('30.10.2026');
  });

  it('formatTimeRange ו-formatFileSize', () => {
    expect(formatTimeRange('09:00', '10:30')).toBe('09:00–10:30');
    expect(formatFileSize(500)).toBe('500 בייט');
    expect(formatFileSize(2048)).toBe('2.0 KB');
    expect(formatFileSize(5 * 1024 * 1024)).toBe('5.0 MB');
  });
});
