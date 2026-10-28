import { useState } from 'react';
import { useDeleteLesson, useUpdateLesson } from '@/api/hooks/lessons';
import { Button } from '@/components/ui/Button';
import { ConfirmButton } from '@/components/ui/ConfirmButton';
import { useToast } from '@/components/toast/useToast';
import type { Lesson } from '@/types/api';
import { dayName, formatTimeRange } from '@/utils/format';
import { ConflictDetails } from './ConflictDetails';
import { LessonForm } from './LessonForm';
import { Alert } from '@/components/ui/Alert';

/** שיעור בלוח של המזכירה: עריכה והעברה, ביטול והחזרה, ומחיקה. שיעור מבוטל מוסתר ממורות ותלמידות */
export function AdminLessonItem({ lesson }: { lesson: Lesson }) {
  const [editing, setEditing] = useState(false);
  const update = useUpdateLesson();
  const remove = useDeleteLesson();
  const toast = useToast();
  const cancelled = lesson.status === 'CANCELLED';

  const setStatus = (status: 'ACTIVE' | 'CANCELLED') =>
    update.mutate(
      { id: lesson.id, input: { status } },
      {
        onSuccess: () =>
          toast.success(status === 'CANCELLED' ? 'השיעור בוטל, והתלמידות והמורה קיבלו התראה' : 'השיעור הוחזר ללוח'),
        onError: (error) => toast.error(error.message)
      }
    );

  if (editing) return <li><LessonForm lesson={lesson} onDone={() => setEditing(false)} /></li>;

  return (
    <li className={cancelled ? 'card lesson-admin lesson-admin--cancelled' : 'card lesson-admin'}>
      <div className="card__row">
        <h2>
          {lesson.subject.name} · {lesson.class.name}
        </h2>
        {cancelled && <span className="badge badge--warning">מבוטל</span>}
      </div>
      <p>
        יום {dayName(lesson.dayOfWeek)} {formatTimeRange(lesson.startTime, lesson.endTime)} · חדר {lesson.room}
      </p>
      <p className="muted">מורה: {lesson.teacher.fullName}</p>
      {lesson.changeNote && <p className="lesson-card__note">{lesson.changeNote}</p>}
      {update.isError && (
        <Alert>
          <ConflictDetails error={update.error} />
        </Alert>
      )}
      <div className="actions">
        <Button variant="secondary" onClick={() => setEditing(true)}>
          עריכה והעברה
        </Button>
        {cancelled ? (
          <Button variant="secondary" onClick={() => setStatus('ACTIVE')} loading={update.isPending}>
            החזרת השיעור
          </Button>
        ) : (
          <ConfirmButton loading={update.isPending} onConfirm={() => setStatus('CANCELLED')}>
            ביטול השיעור
          </ConfirmButton>
        )}
        <ConfirmButton
          loading={remove.isPending}
          onConfirm={() =>
            remove.mutate(lesson.id, {
              onSuccess: () => toast.success('השיעור נמחק'),
              onError: (error) => toast.error(error.message)
            })
          }
        >
          מחיקה
        </ConfirmButton>
      </div>
    </li>
  );
}
