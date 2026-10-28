import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useClasses, useSubjects, useUsers } from '@/api/hooks/catalog';
import { useCreateLesson, useUpdateLesson } from '@/api/hooks/lessons';
import { SelectField } from '@/components/forms/SelectField';
import { TextField } from '@/components/forms/TextField';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/toast/useToast';
import type { Lesson } from '@/types/api';
import { DAY_NAMES } from '@/utils/format';
import { ConflictDetails } from './ConflictDetails';
import { lessonSchema, type LessonFormValues } from './lessonSchema';

interface LessonFormProps {
  /** עריכה של שיעור קיים. בלי זה: יצירת שיעור חדש */
  lesson?: Lesson;
  onDone: () => void;
}

/** טופס שיעור של המזכירה. כל שינוי שולח התראה אוטומטית לתלמידות ולמורה */
export function LessonForm({ lesson, onDone }: LessonFormProps) {
  const create = useCreateLesson();
  const update = useUpdateLesson();
  const toast = useToast();
  const mutation = lesson ? update : create;

  const subjects = useSubjects().data ?? [];
  const classes = useClasses().data ?? [];
  const teachers = useUsers({ role: 'TEACHER', isActive: true, limit: 200 }).data?.items ?? [];

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<LessonFormValues>({
    resolver: zodResolver(lessonSchema),
    defaultValues: {
      subjectId: lesson?.subject.id ?? '',
      teacherId: lesson?.teacher.id ?? '',
      classId: lesson?.class.id ?? '',
      dayOfWeek: lesson ? String(lesson.dayOfWeek) : '',
      startTime: lesson?.startTime ?? '',
      endTime: lesson?.endTime ?? '',
      room: lesson?.room ?? '',
      changeNote: ''
    }
  });

  const onSubmit = handleSubmit(async (values) => {
    const { changeNote, dayOfWeek, ...rest } = values;
    const input = { ...rest, dayOfWeek: Number(dayOfWeek), ...(changeNote ? { changeNote } : {}) };
    try {
      if (lesson) {
        await update.mutateAsync({ id: lesson.id, input });
        toast.success('השיעור עודכן, והתלמידות והמורה קיבלו התראה');
      } else {
        await create.mutateAsync(input);
        toast.success('השיעור נוסף, והתלמידות והמורה קיבלו התראה');
      }
      onDone();
    } catch {
      /* השגיאה (כולל התנגשות) מוצגת למטה דרך mutation.error */
    }
  });

  return (
    <form onSubmit={onSubmit} noValidate className="card">
      <h2>{lesson ? 'עריכת שיעור' : 'הוספת שיעור'}</h2>
      <div className="filters">
        <SelectField label="מקצוע" error={errors.subjectId?.message} {...register('subjectId')}>
          <option value="">בחרי מקצוע</option>
          {subjects.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </SelectField>
        <SelectField label="מורה" error={errors.teacherId?.message} {...register('teacherId')}>
          <option value="">בחרי מורה</option>
          {teachers.map((t) => (
            <option key={t.id} value={t.id}>
              {t.fullName}
            </option>
          ))}
        </SelectField>
        <SelectField label="כיתה" error={errors.classId?.message} {...register('classId')}>
          <option value="">בחרי כיתה</option>
          {classes.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </SelectField>
        <SelectField label="יום" error={errors.dayOfWeek?.message} {...register('dayOfWeek')}>
          <option value="">בחרי יום</option>
          {DAY_NAMES.map((name, index) => (
            <option key={name} value={index}>
              {name}
            </option>
          ))}
        </SelectField>
        <TextField label="שעת התחלה" type="time" error={errors.startTime?.message} {...register('startTime')} />
        <TextField label="שעת סיום" type="time" error={errors.endTime?.message} {...register('endTime')} />
        <TextField label="חדר" error={errors.room?.message} {...register('room')} />
        <TextField label="הערת שינוי (אופציונלי)" error={errors.changeNote?.message} {...register('changeNote')} />
      </div>
      {mutation.isError && (
        <Alert>
          <ConflictDetails error={mutation.error} />
        </Alert>
      )}
      <div className="actions">
        <Button type="submit" loading={mutation.isPending} loadingText="שומרת...">
          {lesson ? 'שמירה' : 'הוספה'}
        </Button>
        <Button variant="secondary" onClick={onDone}>
          ביטול
        </Button>
      </div>
    </form>
  );
}
