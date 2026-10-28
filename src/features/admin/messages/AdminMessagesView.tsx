import { useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { useUsers } from '@/api/hooks/catalog';
import { useThreads } from '@/api/hooks/messaging';
import { queryKeys } from '@/api/queryKeys';
import { SelectField } from '@/components/forms/SelectField';
import { QueryBoundary } from '@/components/ui/QueryBoundary';
import { ThreadView } from '@/features/messages/ThreadView';
import { formatDateTime } from '@/utils/format';

/**
 * שיחות המזכירה עם המורות: רשימת שיחות עם מונה "לא נקראו", פתיחת שיחה, והתחלת שיחה חדשה.
 * המורה שנבחרה נשמרת בכתובת (?teacherId=), כך שרענון הדף לא מאבד אותה.
 */
export function AdminMessagesView() {
  const [params, setParams] = useSearchParams();
  const selected = params.get('teacherId') ?? '';
  const queryClient = useQueryClient();
  const threads = useThreads();
  const teachers = useUsers({ role: 'TEACHER', isActive: true, limit: 200 }).data?.items ?? [];
  const select = (teacherId: string) => setParams(teacherId ? { teacherId } : {});

  const selectedName =
    teachers.find((t) => t.id === selected)?.fullName ??
    threads.data?.find((t) => t.teacher.id === selected)?.teacher.fullName ??
    '';

  return (
    <div className="two-columns">
      <aside>
        <SelectField label="שיחה חדשה עם מורה" value="" onChange={(e) => select(e.target.value)}>
          <option value="">בחרי מורה</option>
          {teachers.map((t) => (
            <option key={t.id} value={t.id}>
              {t.fullName}
            </option>
          ))}
        </SelectField>

        <QueryBoundary
          query={threads}
          isEmpty={(items) => items.length === 0}
          emptyMessage="עוד אין שיחות"
          loadingLabel="טוענת שיחות..."
        >
          {(items) => (
            <ul className="card-list" aria-label="שיחות">
              {items.map((thread) => (
                <li key={thread.teacher.id}>
                  <button
                    type="button"
                    className={thread.teacher.id === selected ? 'thread-item thread-item--active' : 'thread-item'}
                    onClick={() => select(thread.teacher.id)}
                  >
                    <span className="card__row">
                      <strong>{thread.teacher.fullName}</strong>
                      {thread.unreadCount > 0 && (
                        <span className="badge badge--warning" aria-label={`${thread.unreadCount} הודעות שלא נקראו`}>
                          {thread.unreadCount}
                        </span>
                      )}
                    </span>
                    <span className="muted">{thread.lastMessage.body.slice(0, 60)}</span>
                    <small className="muted">{formatDateTime(thread.lastMessage.createdAt)}</small>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </QueryBoundary>
      </aside>

      <section>
        {selected ? (
          <>
            <h2>שיחה עם {selectedName}</h2>
            <ThreadView
              key={selected}
              teacherId={selected}
              onLoaded={() => void queryClient.invalidateQueries({ queryKey: queryKeys.messaging.threads() })}
            />
          </>
        ) : (
          <p className="empty-state">בחרי שיחה מהרשימה, או התחילי שיחה חדשה עם מורה.</p>
        )}
      </section>
    </div>
  );
}
