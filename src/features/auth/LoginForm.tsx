import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { TextField } from '@/components/forms/TextField';
import { useLogin } from './hooks';
import { loginSchema, type LoginFormValues } from './schemas';

/** טופס התחברות. אחרי הצלחה מצב ה-Redux מתעדכן ודף ההתחברות מעביר הלאה */
export function LoginForm() {
  const login = useLogin();
  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' }
  });

  return (
    <form onSubmit={handleSubmit((values) => login.mutate(values))} noValidate>
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
        autoComplete="current-password"
        error={errors.password?.message}
        {...register('password')}
      />
      {login.isError && <Alert>{login.error.message}</Alert>}
      <Button type="submit" loading={login.isPending} loadingText="מתחברת...">
        כניסה
      </Button>
    </form>
  );
}
