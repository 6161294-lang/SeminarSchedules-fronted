import { z } from 'zod';

export const feedbackSchema = z.object({
  content: z.string().trim().min(1, 'חובה לכתוב משוב').max(4000, 'המשוב ארוך מדי (עד 4000 תווים)')
});

export type FeedbackFormValues = z.infer<typeof feedbackSchema>;
