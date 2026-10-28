import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useCreateNote } from '@/api/hooks/notes';
import { SelectField } from '@/components/forms/SelectField';
import { TextAreaField } from '@/components/forms/TextAreaField';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/toast/useToast';
import type { Lesson } from '@/types/api';
import { LessonOptions } from './LessonOptions';
import { noteSchema, type NoteFormValues } from './schemas';

interface NoteFormProps {
  lessons: Lesson[];
  showClass: boolean;
  /** שיעור שנבחר מראש (למשל בעמוד של שיעור מסוים) */
  defaultLessonId?: string;
}

/** הוספת הערה אישית. ההערה מסומנת בתווית של השיעור שנבחר */
export function NoteForm({ lessons, showClass, defaultLessonId = '' }: NoteFormProps) {
  const create = useCreateNote();
  const toast = useToast();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm<NoteFormValues>({
    resolver: zodResolver(noteSchema),
    defaultValues: { lessonId: defaultLessonId, content: '' }
  });

  const onSubmit = handleSubmit(async (values) => {
    try {
      await create.mutateAsync(values);
      toast.success('ההערה נשמרה');
      reset({ lessonId: values.lessonId, content: '' });
    } catch {
      /* השגיאה מוצגת למטה דרך create.error */
    }
  });

  return (
    <form onSubmit={onSubmit} noValidate className="card">
      <h2>הערה חדשה</h2>
      <SelectField label="שיעור" error={errors.lessonId?.message} {...register('lessonId')}>
        <option value="">בחרי שיעור</option>
        <LessonOptions lessons={lessons} showClass={showClass} />
      </SelectField>
      <TextAreaField label="ההערה" error={errors.content?.message} {...register('content')} />
      {create.isError && <Alert>{create.error.message}</Alert>}
      <Button type="submit" loading={create.isPending} loadingText="שומרת...">
        שמירת הערה
      </Button>
    </form>
  );
}
