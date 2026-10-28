import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useCreateClass, useUpdateClass } from '@/api/hooks/catalog';
import { SelectField } from '@/components/forms/SelectField';
import { TextField } from '@/components/forms/TextField';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/toast/useToast';
import type { ClassItem } from '@/types/api';
import { classSchema, GRADE_LABELS, type ClassFormValues } from './catalogSchemas';

/** יצירה (בלי item) או עריכה (עם item) של כיתה */
export function ClassForm({ item, onDone }: { item?: ClassItem; onDone: () => void }) {
  const create = useCreateClass();
  const update = useUpdateClass();
  const toast = useToast();
  const mutation = item ? update : create;
  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<ClassFormValues>({
    resolver: zodResolver(classSchema),
    defaultValues: { name: item?.name ?? '', grade: item?.grade ?? 'HEH' }
  });

  const onSubmit = handleSubmit(async (values) => {
    try {
      if (item) await update.mutateAsync({ id: item.id, input: values });
      else await create.mutateAsync(values);
      toast.success(item ? 'הכיתה עודכנה' : 'הכיתה נוספה');
      onDone();
    } catch {
      /* השגיאה (למשל שם קיים) מוצגת למטה */
    }
  });

  return (
    <form onSubmit={onSubmit} noValidate>
      <div className="filters">
        <TextField label="שם כיתה" error={errors.name?.message} {...register('name')} />
        <SelectField label="מחזור" error={errors.grade?.message} {...register('grade')}>
          <option value="HEH">{GRADE_LABELS.HEH}</option>
          <option value="VAV">{GRADE_LABELS.VAV}</option>
        </SelectField>
      </div>
      {mutation.isError && <Alert>{mutation.error.message}</Alert>}
      <div className="actions">
        <Button type="submit" loading={mutation.isPending} loadingText="שומרת...">
          {item ? 'שמירה' : 'הוספת כיתה'}
        </Button>
        <Button variant="secondary" onClick={onDone}>
          ביטול
        </Button>
      </div>
    </form>
  );
}
