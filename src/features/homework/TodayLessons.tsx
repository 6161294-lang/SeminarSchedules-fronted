import { Link } from 'react-router-dom';
import { useDaySchedule } from '@/api/hooks/lessons';
import { QueryBoundary } from '@/components/ui/QueryBoundary';
import { paths } from '@/routes/paths';
import { dayName, formatTimeRange } from '@/utils/format';
import { israelToday } from '@/utils/today';

/** קיצור דרך: שיעורי היום של המורה, עם קישור להוספת שיעורי בית (אפשרי רק לשיעור של היום) */
export function TodayLessons() {
  const today = israelToday().dayOfWeek;
  // שבת (6) אין בה שיעורים, והשרת לא מקבל אותה
  if (today > 5) return <p className="muted">היום שבת, אין שיעורים.</p>;
  return <TodayLessonsList day={today} />;
}

function TodayLessonsList({ day }: { day: number }) {
  const query = useDaySchedule(day);
  return (
    <section className="card">
      <h2>שיעורי היום (יום {dayName(day)})</h2>
      <QueryBoundary
        query={query}
        isEmpty={(data) => data.lessons.length === 0}
        emptyMessage="אין לך שיעורים היום"
        loadingLabel="טוענת את שיעורי היום..."
      >
        {(data) => (
          <ul className="file-list">
            {data.lessons.map((lesson) => (
              <li key={lesson.id}>
                <span>
                  {formatTimeRange(lesson.startTime, lesson.endTime)} {lesson.subject.name} · {lesson.class.name}
                </span>
                <Link to={`${paths.teacher}/lesson/${lesson.id}`}>הוספת שיעורי בית</Link>
              </li>
            ))}
          </ul>
        )}
      </QueryBoundary>
    </section>
  );
}
