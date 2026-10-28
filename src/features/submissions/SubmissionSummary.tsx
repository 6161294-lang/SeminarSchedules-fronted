import type { Submission } from '@/types/api';
import { formatDateTime } from '@/utils/format';
import { FeedbackBox } from './FeedbackBox';
import { FileList } from './FileList';

/** פרטי הגשה של תלמידה: מתי הוגשה, הערה, קבצים ומשוב */
interface SubmissionSummaryProps {
  submission: Submission;
  /** false: בלי תיבת המשוב (המורה מציגה אותה בנפרד, עם אפשרות עריכה) */
  showFeedback?: boolean;
}

export function SubmissionSummary({ submission, showFeedback = true }: SubmissionSummaryProps) {
  return (
    <div className="submission-summary">
      <p>
        הוגש ב-{formatDateTime(submission.submittedAt)}
        {submission.isLate && <span className="badge badge--warning">באיחור</span>}
      </p>
      {submission.comment && <p>הערה: {submission.comment}</p>}
      <FileList files={submission.files} />
      {showFeedback && <FeedbackBox feedback={submission.feedback} />}
    </div>
  );
}
