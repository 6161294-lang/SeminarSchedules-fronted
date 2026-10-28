import { z } from 'zod';

export const announcementSchema = z
  .object({
    audience: z.enum(['ALL_STUDENTS', 'ALL_TEACHERS', 'GRADE', 'CLASS'], {
      errorMap: () => ({ message: 'חובה לבחור למי לשלוח' })
    }),
    grade: z.string(),
    classId: z.string(),
    title: z.string().trim().min(1, 'חובה להזין כותרת').max(120, 'הכותרת ארוכה מדי (עד 120 תווים)'),
    body: z.string().trim().min(1, 'חובה לכתוב את ההודעה').max(4000, 'ההודעה ארוכה מדי (עד 4000 תווים)')
  })
  .superRefine((v, ctx) => {
    if (v.audience === 'GRADE' && !v.grade) {
      ctx.addIssue({ code: 'custom', path: ['grade'], message: 'חובה לבחור מחזור' });
    }
    if (v.audience === 'CLASS' && !v.classId) {
      ctx.addIssue({ code: 'custom', path: ['classId'], message: 'חובה לבחור כיתה' });
    }
  });

export type AnnouncementFormValues = z.infer<typeof announcementSchema>;

export const AUDIENCE_LABELS = {
  ALL_STUDENTS: 'כל התלמידות',
  ALL_TEACHERS: 'כל המורות',
  GRADE: 'מחזור שלם',
  CLASS: 'כיתה אחת'
} as const;
