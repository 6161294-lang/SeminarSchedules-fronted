import { z } from 'zod';

const fullName = z.string().trim().min(1, 'חובה להזין שם מלא').max(120, 'השם ארוך מדי');
const email = z.string().trim().min(1, 'חובה להזין אימייל').email('האימייל אינו תקין');
const password = z.string().min(8, 'הסיסמה חייבת להכיל לפחות 8 תווים').max(100, 'הסיסמה ארוכה מדי');

/** תלמידה חייבת כיתה. מורה ומזכירה לא (כמו בשרת) */
export const createUserSchema = z
  .object({
    fullName,
    email,
    password,
    role: z.enum(['STUDENT', 'TEACHER', 'ADMIN'], { errorMap: () => ({ message: 'חובה לבחור תפקיד' }) }),
    classId: z.string()
  })
  .superRefine((v, ctx) => {
    if (v.role === 'STUDENT' && !v.classId) {
      ctx.addIssue({ code: 'custom', path: ['classId'], message: 'תלמידה חייבת להשתייך לכיתה' });
    }
  });

export type CreateUserFormValues = z.infer<typeof createUserSchema>;

export const editUserSchema = z.object({
  fullName,
  email,
  classId: z.string(),
  isActive: z.boolean(),
  // סיסמה חדשה היא אופציונלית (איפוס). ריק אומר "בלי שינוי"
  newPassword: z.string().refine((v) => v === '' || v.length >= 8, 'הסיסמה חייבת להכיל לפחות 8 תווים')
});

export type EditUserFormValues = z.infer<typeof editUserSchema>;
