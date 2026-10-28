import { useHomeworks } from '@/api/hooks/homework';
import { QueryBoundary } from '@/components/ui/QueryBoundary';
import { TeacherHomeworkItem } from './TeacherHomeworkItem';

/** שיעורי הבית של המורה. עם lessonId: רק של שיעור מסוים */
export function TeacherHomeworkList({ lessonId }: { lessonId?: string }) {
  const query = useHomeworks({ lessonId });
  return (
    <QueryBoundary
      query={query}
      isEmpty={(items) => items.length === 0}
      emptyMessage="עוד לא נוספו שיעורי בית"
      loadingLabel="טוענת שיעורי בית..."
    >
      {(items) => (
        <ul className="card-list">
          {items.map((homework) => (
            <TeacherHomeworkItem key={homework.id} homework={homework} />
          ))}
        </ul>
      )}
    </QueryBoundary>
  );
}
