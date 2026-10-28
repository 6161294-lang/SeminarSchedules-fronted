import { Link, useParams } from 'react-router-dom';
import { useHomework, useMySubmissions } from '@/api/hooks/homework';
import { PageHeader } from '@/components/ui/PageHeader';
import { QueryBoundary } from '@/components/ui/QueryBoundary';
import { paths } from '@/routes/paths';
import { SubmissionSummary } from '@/features/submissions/SubmissionSummary';
import type { Homework } from '@/types/api';
import { dayName, formatDateOnly, formatTimeRange } from '@/utils/format';
import { SubmissionForm } from './SubmissionForm';

/** שיעורי בית אחד: ההסבר, ההגשה הקיימת (אם יש) וטופס ההגשה */
export function HomeworkDetail() {
  const { id = '' } = useParams();
  const query = useHomework(id);

  return (
    <QueryBoundary query={query} loadingLabel="טוענת את שיעורי הבית...">
      {(homework) => (
        <>
          <PageHeader
            title={homework.title}
            subtitle={`${homework.lesson.subject.name} · להגשה עד ${formatDateOnly(homework.dueDate)}`}
            actions={<Link to={`${paths.student}/homework`}>חזרה לרשימה</Link>}
          />
          <section className="card">
            <p>{homework.description}</p>
            <p className="muted">
              ניתן בשיעור ביום {dayName(homework.lesson.dayOfWeek)},{' '}
              {formatTimeRange(homework.lesson.startTime, homework.lesson.endTime)} · {homework.createdBy.fullName}
            </p>
          </section>
          <SubmissionSection homework={homework} />
        </>
      )}
    </QueryBoundary>
  );
}

function SubmissionSection({ homework }: { homework: Homework }) {
  const query = useMySubmissions();
  return (
    <QueryBoundary query={query} loadingLabel="טוענת את ההגשה...">
      {(submissions) => {
        const existing = submissions.find((s) => s.homework.id === homework.id) ?? null;
        return (
          <>
            {existing && (
              <section className="card">
                <h2>ההגשה שלי</h2>
                <SubmissionSummary submission={existing} />
              </section>
            )}
            {/* key: אחרי הגשה מוצלחת הטופס נבנה מחדש (קבצים ריקים, הערה מעודכנת) */}
            <SubmissionForm key={existing?.updatedAt ?? 'new'} homework={homework} existing={existing} />
          </>
        );
      }}
    </QueryBoundary>
  );
}
