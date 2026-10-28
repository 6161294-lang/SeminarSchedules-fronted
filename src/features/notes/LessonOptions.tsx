import type { Lesson } from '@/types/api';
import { dayName } from '@/utils/format';

function lessonLabel(lesson: Lesson, showClass: boolean): string {
  const base = `${lesson.subject.name} · יום ${dayName(lesson.dayOfWeek)} ${lesson.startTime}`;
  return showClass ? `${base} · ${lesson.class.name}` : base;
}

/** אפשרויות (option) לרשימת בחירת שיעור */
export function LessonOptions({ lessons, showClass }: { lessons: Lesson[]; showClass: boolean }) {
  return (
    <>
      {lessons.map((lesson) => (
        <option key={lesson.id} value={lesson.id}>
          {lessonLabel(lesson, showClass)}
        </option>
      ))}
    </>
  );
}
