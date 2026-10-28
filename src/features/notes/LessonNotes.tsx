import { useNotes } from '@/api/hooks/notes';
import { QueryBoundary } from '@/components/ui/QueryBoundary';
import type { Lesson } from '@/types/api';
import { NoteForm } from './NoteForm';
import { NoteItem } from './NoteItem';

/** ההערות האישיות על שיעור מסוים: טופס הוספה (השיעור כבר נבחר) והרשימה */
export function LessonNotes({ lesson }: { lesson: Lesson }) {
  const query = useNotes({ lessonId: lesson.id });
  return (
    <>
      <NoteForm lessons={[lesson]} showClass defaultLessonId={lesson.id} />
      <QueryBoundary
        query={query}
        isEmpty={(notes) => notes.length === 0}
        emptyMessage="עוד אין הערות על השיעור הזה"
        loadingLabel="טוענת הערות..."
      >
        {(notes) => (
          <ul className="card-list">
            {notes.map((note) => (
              <NoteItem key={note.id} note={note} />
            ))}
          </ul>
        )}
      </QueryBoundary>
    </>
  );
}
