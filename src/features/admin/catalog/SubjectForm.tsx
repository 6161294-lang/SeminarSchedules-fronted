import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useCreateSubject, useUpdateSubject } from '@/api/hooks/catalog';
import { TextField } from '@/components/forms/TextField';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/toast/useToast';
import type { Subject } from '@/types/api';
import { subjectSchema, type SubjectFormValues } from './catalogSchemas';

/** יצירה (בלי item) או עריכה (עם item) של מקצוע */
export function SubjectForm({ item, onDone }: { item?: Subject; onDone: () => void }) {
  const create = useCreateSubject();
  const update = useUpdateSubject();
  const toast = useToast();
  const mutation = item ? update : create;
  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<SubjectFormValues>({
    resolver: zodResolver(subjectSchema),
    defaultValues: { name: item?.name ?? '' }
  });

  const onSubmit = handleSubmit(async (values) => {
    try {
      if (item) await update.mutateAsync({ id: item.id, input: values });
      else await create.mutateAsync(values);
      toast.success(item ? 'המקצוע עודכן' : 'המקצוע נוסף');
      onDone();
    } catch {
      /* השגיאה (למשל שם קיים) מוצגת למטה */
    }
  });

  return (
    <form onSubmit={onSubmit} noValidate>
      <TextField label="שם מקצוע" error={errors.name?.message} {...register('name')} />
      {mutation.isError && <Alert>{mutation.error.message}</Alert>}
      <div className="actions">
        <Button type="submit" loading={mutation.isPending} loadingText="שומרת...">
          {item ? 'שמירה' : 'הוספת מקצוע'}
        </Button>
        <Button variant="secondary" onClick={onDone}>
          ביטול
        </Button>
      </div>
    </form>
  );
}
