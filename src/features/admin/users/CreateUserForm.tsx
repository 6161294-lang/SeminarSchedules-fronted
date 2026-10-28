import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, useWatch } from 'react-hook-form';
import { useClasses, useCreateUser } from '@/api/hooks/catalog';
import { SelectField } from '@/components/forms/SelectField';
import { TextField } from '@/components/forms/TextField';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/toast/useToast';
import { ROLE_LABELS } from '@/routes/paths';
import { createUserSchema, type CreateUserFormValues } from './userSchemas';

/** יצירת חשבון. אין הרשמה עצמית: רק המזכירה פותחת חשבונות. שדה הכיתה מופיע רק לתלמידה */
export function CreateUserForm({ onDone }: { onDone: () => void }) {
  const create = useCreateUser();
  const toast = useToast();
  const classes = useClasses().data ?? [];
  const {
    register,
    handleSubmit,
    control,
    formState: { errors }
  } = useForm<CreateUserFormValues>({
    resolver: zodResolver(createUserSchema),
    defaultValues: { fullName: '', email: '', password: '', role: 'STUDENT', classId: '' }
  });
  const role = useWatch({ control, name: 'role' });

  const onSubmit = handleSubmit(async ({ classId, ...values }) => {
    try {
      await create.mutateAsync({ ...values, ...(values.role === 'STUDENT' ? { classId } : {}) });
      toast.success(`החשבון של ${values.fullName} נוצר`);
      onDone();
    } catch {
      /* השגיאה (למשל אימייל קיים) מוצגת למטה דרך create.error */
    }
  });

  return (
    <form onSubmit={onSubmit} noValidate className="card">
      <h2>הוספת משתמשת</h2>
      <div className="filters">
        <TextField label="שם מלא" error={errors.fullName?.message} {...register('fullName')} />
        <TextField label="אימייל" type="email" error={errors.email?.message} {...register('email')} />
        <TextField label="סיסמה ראשונית" type="password" autoComplete="new-password" error={errors.password?.message} {...register('password')} />
        <SelectField label="תפקיד" error={errors.role?.message} {...register('role')}>
          <option value="STUDENT">{ROLE_LABELS.STUDENT}</option>
          <option value="TEACHER">{ROLE_LABELS.TEACHER}</option>
          <option value="ADMIN">{ROLE_LABELS.ADMIN}</option>
        </SelectField>
        {role === 'STUDENT' && (
          <SelectField label="כיתה" error={errors.classId?.message} {...register('classId')}>
            <option value="">בחרי כיתה</option>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </SelectField>
        )}
      </div>
      {create.isError && <Alert>{create.error.message}</Alert>}
      <div className="actions">
        <Button type="submit" loading={create.isPending} loadingText="יוצרת...">
          יצירת חשבון
        </Button>
        <Button variant="secondary" onClick={onDone}>
          ביטול
        </Button>
      </div>
    </form>
  );
}
