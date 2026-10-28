import { z } from 'zod';

const content = z
  .string()
  .trim()
  .min(1, 'חובה לכתוב הערה')
  .max(4000, 'ההערה ארוכה מדי (עד 4000 תווים)');

export const noteSchema = z.object({
  lessonId: z.string().min(1, 'חובה לבחור שיעור'),
  content
});

export const noteContentSchema = z.object({ content });

export type NoteFormValues = z.infer<typeof noteSchema>;
export type NoteContentValues = z.infer<typeof noteContentSchema>;
