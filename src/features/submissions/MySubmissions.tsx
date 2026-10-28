import { Link } from 'react-router-dom';
import { useMySubmissions } from '@/api/hooks/homework';
import { QueryBoundary } from '@/components/ui/QueryBoundary';
import { paths } from '@/routes/paths';
import { SubmissionSummary } from './SubmissionSummary';

/** כל ההגשות של התלמידה עם הקבצים והמשוב */
export function MySubmissions() {
  const query = useMySubmissions();
  return (
    <QueryBoundary
      query={query}
      isEmpty={(items) => items.length === 0}
      emptyMessage="עוד לא הגשת שיעורי בית"
      loadingLabel="טוענת את ההגשות..."
    >
      {(items) => (
        <ul className="card-list">
          {items.map((submission) => (
            <li key={submission.id} className="card">
              <h2>
                <Link to={`${paths.student}/homework/${submission.homework.id}`}>{submission.homework.title}</Link>
              </h2>
              <p className="muted">
                {submission.homework.lesson.subject.name} · {submission.homework.lesson.class.name}
              </p>
              <SubmissionSummary submission={submission} />
            </li>
          ))}
        </ul>
      )}
    </QueryBoundary>
  );
}
