import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useDeleteHomework } from '@/api/hooks/homework';
import { Button } from '@/components/ui/Button';
import { ConfirmButton } from '@/components/ui/ConfirmButton';
import { useToast } from '@/components/toast/useToast';
import { paths } from '@/routes/paths';
import type { Homework } from '@/types/api';
import { formatDateOnly } from '@/utils/format';
import { HomeworkForm } from './HomeworkForm';

/** שיעורי בית ברשימה של המורה: מספר הגשות, קישור להגשות, עריכה ומחיקה */
export function TeacherHomeworkItem({ homework }: { homework: Homework }) {
  const [editing, setEditing] = useState(false);
  const remove = useDeleteHomework();
  const toast = useToast();
  const count = homework.submissionsCount ?? 0;

  return (
    <li className="card">
      <div className="card__row">
        <h2>{homework.title}</h2>
        <span className="badge">{count} הגשות</span>
      </div>
      <p className="muted">
        {homework.lesson.subject.name} · {homework.lesson.class.name} · ניתן ב-{formatDateOnly(homework.lessonDate)}{' '}
        · להגשה עד {formatDateOnly(homework.dueDate)}
      </p>

      {editing ? (
        <HomeworkForm homework={homework} onDone={() => setEditing(false)} />
      ) : (
        <>
          <p>{homework.description}</p>
          <div className="actions">
            <Link to={`${paths.teacher}/submissions?homeworkId=${homework.id}`}>צפייה בהגשות</Link>
            <Button variant="secondary" onClick={() => setEditing(true)}>
              עריכה
            </Button>
            <ConfirmButton
              loading={remove.isPending}
              onConfirm={() =>
                remove.mutate(homework.id, {
                  onSuccess: () => toast.success('שיעורי הבית נמחקו'),
                  onError: (error) => toast.error(error.message)
                })
              }
            >
              מחיקה
            </ConfirmButton>
          </div>
        </>
      )}
    </li>
  );
}
