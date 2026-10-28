import { zodResolver } from '@hookform/resolvers/zod';
import { useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { useSubmitHomework } from '@/api/hooks/homework';
import { TextAreaField } from '@/components/forms/TextAreaField';
import { TextField } from '@/components/forms/TextField';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/toast/useToast';
import type { Homework, Submission } from '@/types/api';
import { isPastDue } from '@/utils/today';
import { createSubmissionSchema, type SubmissionFormValues } from './schemas';
import { ALLOWED_EXTENSIONS, MAX_FILE_BYTES, MAX_FILES } from './submissionRules';

interface SubmissionFormProps {
  homework: Homework;
  /** הגשה קיימת של התלמידה. שליחה חוזרת מחליפה את הקבצים */
  existing: Submission | null;
}

/** טופס הגשה: קבצים והערה. הוולידציה (כמות, גודל, סוג) כמו בשרת */
export function SubmissionForm({ homework, existing }: SubmissionFormProps) {
  const submit = useSubmitHomework();
  const toast = useToast();
  const schema = useMemo(() => createSubmissionSchema(!existing), [existing]);
  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<SubmissionFormValues>({
    resolver: zodResolver(schema),
    defaultValues: { comment: existing?.comment ?? '' }
  });

  const onSubmit = handleSubmit(async (values) => {
    const form = new FormData();
    for (const file of values.files ? Array.from<File>(values.files) : []) form.append('files', file);
    form.append('comment', values.comment);

    try {
      await submit.mutateAsync({ homeworkId: homework.id, form });
      // אחרי ההצלחה הטופס נבנה מחדש (key), לכן ההודעה נשלחת מכאן ולא מ-callback של הרכיב
      toast.success(existing ? 'ההגשה עודכנה' : 'ההגשה נשלחה בהצלחה');
    } catch {
      /* השגיאה מוצגת למטה דרך submit.error */
    }
  });

  return (
    <form onSubmit={onSubmit} noValidate className="card">
      <h2>{existing ? 'שליחה חוזרת' : 'הגשת שיעורי הבית'}</h2>
      {existing && (
        <Alert kind="info">שליחה חוזרת מחליפה את הקבצים שהגשת. אפשר גם לעדכן רק את ההערה.</Alert>
      )}
      {isPastDue(homework.dueDate) && (
        <Alert kind="info">מועד ההגשה עבר. ההגשה תסומן כמאוחרת.</Alert>
      )}
      <TextField
        label={`קבצים (עד ${MAX_FILES} קבצים, עד ${MAX_FILE_BYTES / (1024 * 1024)}MB כל אחד)`}
        type="file"
        multiple
        accept={ALLOWED_EXTENSIONS.join(',')}
        error={errors.files?.message}
        {...register('files')}
      />
      <TextAreaField label="הערה להגשה (אופציונלי)" error={errors.comment?.message} {...register('comment')} />
      {submit.isError && <Alert>{submit.error.message}</Alert>}
      <Button type="submit" loading={submit.isPending} loadingText="שולחת...">
        {existing ? 'שליחה חוזרת' : 'הגשה'}
      </Button>
    </form>
  );
}
