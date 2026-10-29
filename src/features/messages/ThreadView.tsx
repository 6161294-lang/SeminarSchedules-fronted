import { useEffect } from 'react';
import { useThread } from '@/api/hooks/messaging';
import { QueryBoundary } from '@/components/ui/QueryBoundary';
import { formatDateTime } from '@/utils/format';
import { MessageForm } from './MessageForm';

interface ThreadViewProps {
  teacherId?: string;
  /** נקראת אחרי כל טעינה של השיחה. השרת מסמן הודעות כנקראו בפתיחה, וכדאי לרענן את מוני "לא נקראו" */
  onLoaded?: () => void;
}

/**
 * שיחה בין מורה למזכירה. מורה: השיחה שלה (בלי teacherId).
 * מזכירה: השיחה עם המורה שנבחרה (teacherId). מתרעננת לבד כל 15 שניות.
 */
export function ThreadView({ teacherId, onLoaded }: ThreadViewProps) {
  const query = useThread(teacherId);
  const { dataUpdatedAt, isSuccess } = query;

  useEffect(() => {
    if (isSuccess) onLoaded?.();
    // onLoaded נשלחת מהורה בכל רינדור, ולכן תלויים רק בזמן העדכון של הנתונים
    // eslint-disable-next-line react-hooks-js/exhaustive-deps
  }, [dataUpdatedAt, isSuccess]);

  return (
    <>
      <QueryBoundary
        query={query}
        isEmpty={(messages) => messages.length === 0}
        emptyMessage="עוד אין הודעות בשיחה. אפשר לכתוב ראשונה"
        loadingLabel="טוענת את השיחה..."
      >
        {(messages) => (
          <ul className="thread" aria-label="הודעות בשיחה">
            {messages.map((message) => (
              <li key={message.id} className={message.isMine ? 'message message--mine' : 'message'}>
                <strong>{message.sender.fullName}</strong>
                <p>{message.body}</p>
                <small className="muted">{formatDateTime(message.createdAt)}</small>
              </li>
            ))}
          </ul>
        )}
      </QueryBoundary>
      <MessageForm teacherId={teacherId} />
    </>
  );
}
