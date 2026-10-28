import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().trim().min(1, 'חובה להזין אימייל').email('האימייל אינו תקין'),
  password: z.string().min(1, 'חובה להזין סיסמה')
});

export const registerSchema = z
  .object({
    seminarName: z.string().trim().min(2, 'שם הסמינר קצר מדי').max(100, 'שם הסמינר ארוך מדי'),
    fullName: z.string().trim().min(2, 'השם קצר מדי').max(100, 'השם ארוך מדי'),
    email: z.string().trim().min(1, 'חובה להזין אימייל').email('האימייל אינו תקין'),
    password: z.string().min(8, 'הסיסמה חייבת להכיל לפחות 8 תווים').max(100, 'הסיסמה ארוכה מדי'),
    confirmPassword: z.string()
  })
  .refine((v) => v.password === v.confirmPassword, {
    path: ['confirmPassword'],
    message: 'הסיסמאות אינן זהות'
  });

export type RegisterFormValues = z.infer<typeof registerSchema>;

export type LoginFormValues = z.infer<typeof loginSchema>;
