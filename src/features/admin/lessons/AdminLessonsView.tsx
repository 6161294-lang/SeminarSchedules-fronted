import { useMemo, useState } from 'react';
import { useClasses, useUsers } from '@/api/hooks/catalog';
import { useLessons } from '@/api/hooks/lessons';
import { SelectField } from '@/components/forms/SelectField';
import { Button } from '@/components/ui/Button';
import { QueryBoundary } from '@/components/ui/QueryBoundary';
import type { LessonFilters } from '@/types/api';
import { DAY_NAMES } from '@/utils/format';
import { AdminLessonItem } from './AdminLessonItem';
import { LessonForm } from './LessonForm';

/** ניהול לוח הזמנים: כל השיעורים (גם מבוטלים), סינון, הוספה, עריכה, ביטול ומחיקה */
export function AdminLessonsView() {
  const [adding, setAdding] = useState(false);
  const [classId, setClassId] = useState('');
  const [teacherId, setTeacherId] = useState('');
  const [day, setDay] = useState('');
  const [status, setStatus] = useState('');

  const classes = useClasses().data ?? [];
  const teachers = useUsers({ role: 'TEACHER', limit: 200 }).data?.items ?? [];

  const filters = useMemo<LessonFilters>(
    () => ({
      classId: classId || undefined,
      teacherId: teacherId || undefined,
      dayOfWeek: day === '' ? undefined : Number(day),
      status: status === '' ? undefined : (status as LessonFilters['status'])
    }),
    [classId, teacherId, day, status]
  );
  const query = useLessons(filters);

  return (
    <>
      <div className="toolbar">
        {!adding && <Button onClick={() => setAdding(true)}>הוספת שיעור</Button>}
      </div>
      {adding && <LessonForm onDone={() => setAdding(false)} />}

      <div className="filters">
        <SelectField label="כיתה" value={classId} onChange={(e) => setClassId(e.target.value)}>
          <option value="">כל הכיתות</option>
          {classes.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </SelectField>
        <SelectField label="מורה" value={teacherId} onChange={(e) => setTeacherId(e.target.value)}>
          <option value="">כל המורות</option>
          {teachers.map((t) => (
            <option key={t.id} value={t.id}>
              {t.fullName}
            </option>
          ))}
        </SelectField>
        <SelectField label="יום" value={day} onChange={(e) => setDay(e.target.value)}>
          <option value="">כל הימים</option>
          {DAY_NAMES.map((name, index) => (
            <option key={name} value={index}>
              {name}
            </option>
          ))}
        </SelectField>
        <SelectField label="סטטוס" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">כל השיעורים</option>
          <option value="ACTIVE">פעילים</option>
          <option value="CANCELLED">מבוטלים</option>
        </SelectField>
      </div>

      <QueryBoundary
        query={query}
        isEmpty={(items) => items.length === 0}
        emptyMessage="אין שיעורים שמתאימים לסינון"
        loadingLabel="טוענת את הלוח..."
      >
        {(items) => (
          <ul className="card-list">
            {items.map((lesson) => (
              <AdminLessonItem key={lesson.id} lesson={lesson} />
            ))}
          </ul>
        )}
      </QueryBoundary>
    </>
  );
}
