import { z } from 'zod';

export const messageSchema = z.object({
  body: z.string().trim().min(1, 'חובה לכתוב הודעה').max(4000, 'ההודעה ארוכה מדי (עד 4000 תווים)')
});

export type MessageFormValues = z.infer<typeof messageSchema>;
