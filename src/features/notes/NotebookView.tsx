import { useState } from 'react';
import { useLessons } from '@/api/hooks/lessons';
import { useNotes } from '@/api/hooks/notes';
import { SelectField } from '@/components/forms/SelectField';
import { TextField } from '@/components/forms/TextField';
import { QueryBoundary } from '@/components/ui/QueryBoundary';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { LessonOptions } from './LessonOptions';
import { NoteForm } from './NoteForm';
import { NoteItem } from './NoteItem';

/**
 * מחברת ההערות האישיות: הוספה, סינון לפי שיעור, חיפוש, עריכה ומחיקה.
 * משותפת לתלמידה ולמורה. כל אחת רואה רק את ההערות שלה (השרת מבטיח זאת).
 */
export function NotebookView({ showClass }: { showClass: boolean }) {
  const [lessonId, setLessonId] = useState('');
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search.trim());

  const lessonsQuery = useLessons();
  const notesQuery = useNotes({
    lessonId: lessonId || undefined,
    search: debouncedSearch || undefined
  });

  return (
    <QueryBoundary query={lessonsQuery} loadingLabel="טוענת את השיעורים...">
      {(lessons) => (
        <>
          <NoteForm lessons={lessons} showClass={showClass} />

          <div className="toolbar">
            <SelectField label="סינון לפי שיעור" value={lessonId} onChange={(e) => setLessonId(e.target.value)}>
              <option value="">כל השיעורים</option>
              <LessonOptions lessons={lessons} showClass={showClass} />
            </SelectField>
            <TextField
              label="חיפוש בהערות"
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <QueryBoundary
            query={notesQuery}
            isEmpty={(notes) => notes.length === 0}
            emptyMessage="אין הערות להצגה"
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
      )}
    </QueryBoundary>
  );
}
