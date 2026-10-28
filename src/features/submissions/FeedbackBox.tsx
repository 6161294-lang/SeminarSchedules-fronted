import type { Feedback } from '@/types/api';
import { formatDateTime } from '@/utils/format';

/** המשוב של המורה על הגשה, או הודעה שעוד אין משוב */
export function FeedbackBox({ feedback }: { feedback: Feedback | null }) {
  if (!feedback) return <p className="muted">עדיין אין משוב על ההגשה.</p>;
  return (
    <div className="feedback">
      <strong>משוב מ{feedback.teacher.fullName}</strong>
      <p>{feedback.content}</p>
      <small className="muted">{formatDateTime(feedback.updatedAt)}</small>
    </div>
  );
}
