import { z } from 'zod';

const time = z.string().regex(/^([01][0-9]|2[0-3]):[0-5][0-9]$/, 'חובה לבחור שעה');

// dayOfWeek מגיע משדה בחירה כמחרוזת, וממירים אותו למספר בשליחה
export const lessonSchema = z
  .object({
    subjectId: z.string().min(1, 'חובה לבחור מקצוע'),
    teacherId: z.string().min(1, 'חובה לבחור מורה'),
    classId: z.string().min(1, 'חובה לבחור כיתה'),
    dayOfWeek: z.string().regex(/^[0-5]$/, 'חובה לבחור יום'),
    startTime: time,
    endTime: time,
    room: z.string().trim().min(1, 'חובה להזין חדר').max(120, 'מספר החדר ארוך מדי'),
    changeNote: z.string().trim().max(300, 'ההערה ארוכה מדי (עד 300 תווים)')
  })
  .refine((v) => !(v.startTime && v.endTime) || v.startTime < v.endTime, {
    path: ['endTime'],
    message: 'שעת הסיום חייבת להיות אחרי שעת ההתחלה'
  });

export type LessonFormValues = z.infer<typeof lessonSchema>;
