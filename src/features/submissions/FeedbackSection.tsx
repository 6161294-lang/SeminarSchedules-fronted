import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useSaveFeedback } from '@/api/hooks/homework';
import { TextAreaField } from '@/components/forms/TextAreaField';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/toast/useToast';
import type { Submission } from '@/types/api';
import { FeedbackBox } from './FeedbackBox';
import { feedbackSchema, type FeedbackFormValues } from './schemas';

/** המשוב של המורה על הגשה: מציג משוב קיים, ומאפשר לכתוב או לערוך. רק המורה והתלמידה רואות אותו */
export function FeedbackSection({ submission }: { submission: Submission }) {
  const [editing, setEditing] = useState(false);
  const save = useSaveFeedback();
  const toast = useToast();
  const existing = submission.feedback;
  const showForm = !existing || editing;

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<FeedbackFormValues>({
    resolver: zodResolver(feedbackSchema),
    defaultValues: { content: existing?.content ?? '' }
  });

  const onSubmit = handleSubmit(async (values) => {
    try {
      await save.mutateAsync({ submissionId: submission.id, content: values.content });
      toast.success('המשוב נשמר, והתלמידה קיבלה התראה');
      setEditing(false);
    } catch {
      /* השגיאה מוצגת למטה דרך save.error */
    }
  });

  return (
    <div>
      {existing && <FeedbackBox feedback={existing} />}
      {showForm ? (
        <form onSubmit={onSubmit} noValidate>
          <TextAreaField
            label={existing ? 'עריכת המשוב' : 'משוב לתלמידה'}
            error={errors.content?.message}
            {...register('content')}
          />
          {save.isError && <Alert>{save.error.message}</Alert>}
          <div className="actions">
            <Button type="submit" loading={save.isPending} loadingText="שומרת...">
              שמירת משוב
            </Button>
            {existing && (
              <Button variant="secondary" onClick={() => setEditing(false)}>
                ביטול
              </Button>
            )}
          </div>
        </form>
      ) : (
        <Button variant="secondary" onClick={() => setEditing(true)}>
          עריכת משוב
        </Button>
      )}
    </div>
  );
}
