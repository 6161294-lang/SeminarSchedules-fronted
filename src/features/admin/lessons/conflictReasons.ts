import type { ApiError } from '@/api/client';

/** סיבות להתנגשות בלוח (מורה, כיתה או חדר תפוסים), כפי שהשרת מחזיר ב-409 */
export function conflictReasons(error: ApiError): string[] {
  if (error.code !== 'LESSON_CONFLICT' || !Array.isArray(error.rawDetails)) return [];
  const reasons = (error.rawDetails as { reasons?: unknown }[]).flatMap((d) =>
    Array.isArray(d.reasons) ? d.reasons.filter((r): r is string => typeof r === 'string') : []
  );
  return [...new Set(reasons)];
}
