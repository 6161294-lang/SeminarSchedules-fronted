import { zodResolver } from '@hookform/resolvers/zod';
import { useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { useCreateHomework, useUpdateHomework } from '@/api/hooks/homework';
import { TextAreaField } from '@/components/forms/TextAreaField';
import { TextField } from '@/components/forms/TextField';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/toast/useToast';
import type { Homework } from '@/types/api';
import { israelToday } from '@/utils/today';
import { createHomeworkSchema, type HomeworkFormValues } from './homeworkSchema';

interface HomeworkFormProps {
  /** יצירה: השיעור שאליו מוסיפים. עריכה: שיעורי הבית הקיימים */
  lessonId?: string;
  homework?: Homework;
  onDone?: () => void;
}

/** טופס שיעורי בית של המורה, ליצירה (lessonId) או לעריכה (homework) */
export function HomeworkForm({ lessonId, homework, onDone }: HomeworkFormProps) {
  const create = useCreateHomework();
  const update = useUpdateHomework();
  const toast = useToast();
  const isEdit = Boolean(homework);
  const mutation = isEdit ? update : create;

  const schema = useMemo(
    () =>
      isEdit
        ? createHomeworkSchema(homework!.lessonDate, 'תאריך ההגשה חייב להיות אחרי תאריך השיעור')
        : createHomeworkSchema(israelToday().dateString, 'תאריך ההגשה חייב להיות אחרי היום'),
    [isEdit, homework]
  );

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm<HomeworkFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: homework?.title ?? '',
      description: homework?.description ?? '',
      dueDate: homework?.dueDate ?? ''
    }
  });

  const onSubmit = handleSubmit(async (values) => {
    try {
      if (homework) {
        await update.mutateAsync({ id: homework.id, input: values });
        toast.success('שיעורי הבית עודכנו');
      } else if (lessonId) {
        await create.mutateAsync({ lessonId, ...values });
        toast.success('שיעורי הבית נוצרו, והתלמידות קיבלו התראה');
        reset();
      }
      onDone?.();
    } catch {
      /* השגיאה מוצגת למטה דרך mutation.error */
    }
  });

  return (
    <form onSubmit={onSubmit} noValidate>
      <TextField label="כותרת" error={errors.title?.message} {...register('title')} />
      <TextAreaField label="הסבר על המשימה" error={errors.description?.message} {...register('description')} />
      <TextField label="תאריך הגשה" type="date" error={errors.dueDate?.message} {...register('dueDate')} />
      {mutation.isError && <Alert>{mutation.error.message}</Alert>}
      <div className="actions">
        <Button type="submit" loading={mutation.isPending} loadingText="שומרת...">
          {isEdit ? 'שמירה' : 'הוספת שיעורי בית'}
        </Button>
        {isEdit && onDone && (
          <Button variant="secondary" onClick={onDone}>
            ביטול
          </Button>
        )}
      </div>
    </form>
  );
}
