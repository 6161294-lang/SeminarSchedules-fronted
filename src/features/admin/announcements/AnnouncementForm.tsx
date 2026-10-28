import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, useWatch } from 'react-hook-form';
import { useClasses } from '@/api/hooks/catalog';
import { useCreateAnnouncement } from '@/api/hooks/messaging';
import { SelectField } from '@/components/forms/SelectField';
import { TextAreaField } from '@/components/forms/TextAreaField';
import { TextField } from '@/components/forms/TextField';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/toast/useToast';
import type { CreateAnnouncementInput, Grade } from '@/types/api';
import { GRADE_LABELS } from '../catalog/catalogSchemas';
import { announcementSchema, AUDIENCE_LABELS, type AnnouncementFormValues } from './announcementSchema';

/** שליחת הודעה לקבוצה. כל נמענת מקבלת התראה. שדות המחזור והכיתה מופיעים לפי הקהל שנבחר */
export function AnnouncementForm() {
  const create = useCreateAnnouncement();
  const toast = useToast();
  const classes = useClasses().data ?? [];
  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors }
  } = useForm<AnnouncementFormValues>({
    resolver: zodResolver(announcementSchema),
    defaultValues: { audience: 'ALL_STUDENTS', grade: '', classId: '', title: '', body: '' }
  });
  const audience = useWatch({ control, name: 'audience' });

  const onSubmit = handleSubmit(async (values) => {
    const input: CreateAnnouncementInput = { audience: values.audience, title: values.title, body: values.body };
    if (values.audience === 'GRADE') input.grade = values.grade as Grade;
    if (values.audience === 'CLASS') input.classId = values.classId;
    try {
      const sent = await create.mutateAsync(input);
      toast.success(`ההודעה נשלחה ל-${sent.recipientCount ?? 0} נמענות`);
      reset();
    } catch {
      /* השגיאה (למשל אין נמענות בקהל שנבחר) מוצגת למטה */
    }
  });

  return (
    <form onSubmit={onSubmit} noValidate className="card">
      <h2>הודעה חדשה</h2>
      <div className="filters">
        <SelectField label="למי לשלוח" error={errors.audience?.message} {...register('audience')}>
          {(Object.keys(AUDIENCE_LABELS) as (keyof typeof AUDIENCE_LABELS)[]).map((key) => (
            <option key={key} value={key}>
              {AUDIENCE_LABELS[key]}
            </option>
          ))}
        </SelectField>
        {audience === 'GRADE' && (
          <SelectField label="מחזור" error={errors.grade?.message} {...register('grade')}>
            <option value="">בחרי מחזור</option>
            <option value="HEH">{GRADE_LABELS.HEH}</option>
            <option value="VAV">{GRADE_LABELS.VAV}</option>
          </SelectField>
        )}
        {audience === 'CLASS' && (
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
      <TextField label="כותרת" error={errors.title?.message} {...register('title')} />
      <TextAreaField label="תוכן ההודעה" error={errors.body?.message} {...register('body')} />
      {create.isError && <Alert>{create.error.message}</Alert>}
      <Button type="submit" loading={create.isPending} loadingText="שולחת...">
        שליחה
      </Button>
    </form>
  );
}
