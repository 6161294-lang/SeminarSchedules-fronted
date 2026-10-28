import { useClasses } from '@/api/hooks/catalog';
import { useAnnouncements } from '@/api/hooks/messaging';
import { QueryBoundary } from '@/components/ui/QueryBoundary';
import type { Announcement } from '@/types/api';
import { formatDateTime } from '@/utils/format';
import { GRADE_LABELS } from '../catalog/catalogSchemas';
import { AUDIENCE_LABELS } from './announcementSchema';

function audienceText(a: Announcement, classNames: Map<string, string>): string {
  if (a.audience === 'GRADE' && a.grade) return GRADE_LABELS[a.grade];
  if (a.audience === 'CLASS' && a.classId) return `כיתה ${classNames.get(a.classId) ?? ''}`.trim();
  return AUDIENCE_LABELS[a.audience];
}

/** היסטוריית ההודעות שנשלחו, עם הקהל ומספר הנמענות */
export function AnnouncementHistory() {
  const query = useAnnouncements();
  const classNames = new Map((useClasses().data ?? []).map((c) => [c.id, c.name]));

  return (
    <QueryBoundary
      query={query}
      isEmpty={(items) => items.length === 0}
      emptyMessage="עוד לא נשלחו הודעות"
      loadingLabel="טוענת הודעות..."
    >
      {(items) => (
        <ul className="card-list">
          {items.map((a) => (
            <li key={a.id} className="card">
              <div className="card__row">
                <h2>{a.title}</h2>
                <span className="badge">
                  {audienceText(a, classNames)} · {a.recipientCount ?? 0} נמענות
                </span>
              </div>
              <p className="note__content">{a.body}</p>
              <small className="muted">{formatDateTime(a.createdAt)}</small>
            </li>
          ))}
        </ul>
      )}
    </QueryBoundary>
  );
}
