import { Link } from 'react-router-dom';
import { paths } from '@/routes/paths';
import type { Homework } from '@/types/api';
import { dayName, formatDateOnly } from '@/utils/format';
import { isPastDue } from '@/utils/today';

/** כרטיס שיעורי בית ברשימה של התלמידה, עם סטטוס הגשה */
export function HomeworkCard({ homework }: { homework: Homework }) {
  const submitted = Boolean(homework.mySubmission);
  const overdue = !submitted && isPastDue(homework.dueDate);

  return (
    <li className="card">
      <div className="card__row">
        <h2>
          <Link to={`${paths.student}/homework/${homework.id}`}>{homework.title}</Link>
        </h2>
        {submitted ? (
          <span className="badge badge--success">הוגש</span>
        ) : overdue ? (
          <span className="badge badge--warning">עבר מועד ההגשה</span>
        ) : (
          <span className="badge">טרם הוגש</span>
        )}
      </div>
      <p className="muted">
        {homework.lesson.subject.name} · שיעור ביום {dayName(homework.lesson.dayOfWeek)} · להגשה עד{' '}
        {formatDateOnly(homework.dueDate)}
      </p>
    </li>
  );
}
