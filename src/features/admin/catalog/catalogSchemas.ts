import { z } from 'zod';

export const classSchema = z.object({
  name: z.string().trim().min(1, 'חובה להזין שם כיתה').max(120, 'השם ארוך מדי'),
  grade: z.enum(['HEH', 'VAV'], { errorMap: () => ({ message: 'חובה לבחור מחזור' }) })
});

export const subjectSchema = z.object({
  name: z.string().trim().min(1, 'חובה להזין שם מקצוע').max(120, 'השם ארוך מדי')
});

export type ClassFormValues = z.infer<typeof classSchema>;
export type SubjectFormValues = z.infer<typeof subjectSchema>;

export const GRADE_LABELS = { HEH: 'מחזור ה׳', VAV: 'מחזור ו׳' } as const;
