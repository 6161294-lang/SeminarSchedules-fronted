import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { TextField } from '@/components/forms/TextField';
import { useRegister } from './hooks';
import { registerSchema, type RegisterFormValues } from './schemas';

/** טופס הרשמה של מזכירה. אחרי הצלחה היא מחוברת וממשיכה לסמינר הריק שלה */
export function RegisterForm() {
  const registerUser = useRegister();
  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { seminarName: '', fullName: '', email: '', password: '', confirmPassword: '' }
  });

  return (
    <form
      onSubmit={handleSubmit(({ seminarName, fullName, email, password }) =>
        registerUser.mutate({ seminarName, fullName, email, password })
      )}
      noValidate
    >
      <TextField label="שם הסמינר" error={errors.seminarName?.message} {...register('seminarName')} />
      <TextField label="שם מלא" autoComplete="name" error={errors.fullName?.message} {...register('fullName')} />
      <TextField
        label="אימייל"
        type="email"
        autoComplete="username"
        error={errors.email?.message}
        {...register('email')}
      />
      <TextField
        label="סיסמה"
        type="password"
        autoComplete="new-password"
        error={errors.password?.message}
        {...register('password')}
      />
      <TextField
        label="אימות סיסמה"
        type="password"
        autoComplete="new-password"
        error={errors.confirmPassword?.message}
        {...register('confirmPassword')}
      />
      {registerUser.isError && <Alert>{registerUser.error.message}</Alert>}
      <Button type="submit" loading={registerUser.isPending} loadingText="נרשמת...">
        הרשמה
      </Button>
    </form>
  );
}
