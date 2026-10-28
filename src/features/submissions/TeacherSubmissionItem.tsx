import type { Submission } from '@/types/api';
import { FeedbackSection } from './FeedbackSection';
import { SubmissionSummary } from './SubmissionSummary';

/** הגשה של תלמידה כפי שהמורה רואה: פרטים, קבצים להורדה ומשוב */
export function TeacherSubmissionItem({ submission }: { submission: Submission }) {
  return (
    <li className="card">
      <div className="card__row">
        <h2>{submission.student.fullName}</h2>
        {submission.student.class && <span className="badge">{submission.student.class.name}</span>}
      </div>
      <p className="muted">
        {submission.homework.title} · {submission.homework.lesson.subject.name}
      </p>
      <SubmissionSummary submission={submission} showFeedback={false} />
      <FeedbackSection submission={submission} />
    </li>
  );
}
