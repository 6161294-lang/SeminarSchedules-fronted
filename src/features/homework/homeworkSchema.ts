import { z } from 'zod';

/**
 * minDateExclusive: תאריך ההגשה חייב להיות אחרי התאריך הזה (YYYY-MM-DD).
 * ביצירה זה היום, ובעריכה זה תאריך השיעור. כמו הכלל בשרת.
 */
export function createHomeworkSchema(minDateExclusive: string, minDateMessage: string) {
  return z.object({
    title: z.string().trim().min(1, 'חובה להזין כותרת').max(120, 'הכותרת ארוכה מדי (עד 120 תווים)'),
    description: z.string().trim().min(1, 'חובה להזין הסבר').max(4000, 'ההסבר ארוך מדי (עד 4000 תווים)'),
    dueDate: z
      .string()
      .min(1, 'חובה לבחור תאריך הגשה')
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'התאריך אינו תקין')
      .refine((date) => date > minDateExclusive, minDateMessage)
  });
}

export type HomeworkFormValues = z.infer<ReturnType<typeof createHomeworkSchema>>;
