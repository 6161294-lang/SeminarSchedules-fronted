import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useClasses, useUpdateUser } from '@/api/hooks/catalog';
import { useAppSelector } from '@/app/hooks';
import { CheckboxField } from '@/components/forms/CheckboxField';
import { SelectField } from '@/components/forms/SelectField';
import { TextField } from '@/components/forms/TextField';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/toast/useToast';
import { selectUser } from '@/features/auth/authSlice';
import type { UpdateUserInput, User } from '@/types/api';
import { editUserSchema, type EditUserFormValues } from './userSchemas';

interface EditUserFormProps {
  user: User;
  onDone: () => void;
}

/** עריכת משתמשת: פרטים, כיתה (לתלמידה), השבתה ואיפוס סיסמה. השבתה ואיפוס סיסמה מנתקים אותה מיד */
export function EditUserForm({ user, onDone }: EditUserFormProps) {
  const update = useUpdateUser();
  const toast = useToast();
  const classes = useClasses().data ?? [];
  const me = useAppSelector(selectUser);
  const isSelf = me?.id === user.id;

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<EditUserFormValues>({
    resolver: zodResolver(editUserSchema),
    defaultValues: {
      fullName: user.fullName,
      email: user.email,
      classId: user.classId ?? '',
      isActive: user.isActive,
      newPassword: ''
    }
  });

  const onSubmit = handleSubmit(async (values) => {
    const input: UpdateUserInput = { fullName: values.fullName, email: values.email };
    if (user.role === 'STUDENT' && values.classId) input.classId = values.classId;
    if (!isSelf) input.isActive = values.isActive;
    if (values.newPassword) input.password = values.newPassword;
    try {
      await update.mutateAsync({ id: user.id, input });
      toast.success('הפרטים עודכנו');
      onDone();
    } catch {
      /* השגיאה מוצגת למטה דרך update.error */
    }
  });

  return (
    <form onSubmit={onSubmit} noValidate>
      <div className="filters">
        <TextField label="שם מלא" error={errors.fullName?.message} {...register('fullName')} />
        <TextField label="אימייל" type="email" error={errors.email?.message} {...register('email')} />
        {user.role === 'STUDENT' && (
          <SelectField label="כיתה" {...register('classId')}>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </SelectField>
        )}
        <TextField
          label="סיסמה חדשה (השאירי ריק אם אין שינוי)"
          type="password"
          autoComplete="new-password"
          error={errors.newPassword?.message}
          {...register('newPassword')}
        />
      </div>
      {!isSelf && <CheckboxField label="חשבון פעיל" {...register('isActive')} />}
      {update.isError && <Alert>{update.error.message}</Alert>}
      <div className="actions">
        <Button type="submit" loading={update.isPending} loadingText="שומרת...">
          שמירה
        </Button>
        <Button variant="secondary" onClick={onDone}>
          ביטול
        </Button>
      </div>
    </form>
  );
}
