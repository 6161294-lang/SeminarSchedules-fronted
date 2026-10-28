import { Link, useParams } from 'react-router-dom';
import { useDaySchedule } from '@/api/hooks/lessons';
import { PageHeader } from '@/components/ui/PageHeader';
import { QueryBoundary } from '@/components/ui/QueryBoundary';
import { dayName } from '@/utils/format';
import { LessonCard } from './LessonCard';

interface DayScheduleViewProps {
  /** חזרה למערכת השבועית */
  backTo: string;
  show: 'teacher' | 'class';
  /** קישור לפרטי שיעור (למורה). אם לא הוגדר, לא מוצג קישור */
  lessonHref?: (lessonId: string) => string;
}

function parseDay(value: string | undefined): number | null {
  if (value === undefined || !/^[0-5]$/.test(value)) return null;
  return Number(value);
}

/** המערכת היומית (נתיב עם :dayOfWeek). משותפת לתלמידה ולמורה */
export function DayScheduleView({ backTo, show, lessonHref }: DayScheduleViewProps) {
  const day = parseDay(useParams().dayOfWeek);
  if (day === null) {
    return (
      <>
        <PageHeader title="יום לא תקין" subtitle="אפשר לבחור יום מראשון עד שישי." />
        <Link to={backTo}>חזרה למערכת השבועית</Link>
      </>
    );
  }
  return <ValidDayView day={day} backTo={backTo} show={show} lessonHref={lessonHref} />;
}

function ValidDayView({ day, backTo, show, lessonHref }: DayScheduleViewProps & { day: number }) {
  const query = useDaySchedule(day);
  return (
    <>
      <PageHeader title={`יום ${dayName(day)}`} subtitle="המערכת היומית" actions={<Link to={backTo}>חזרה למערכת השבועית</Link>} />
      <QueryBoundary
        query={query}
        isEmpty={(data) => data.lessons.length === 0}
        emptyMessage="אין שיעורים ביום הזה"
        loadingLabel="טוענת את היום..."
      >
        {(data) => (
          <ul className="lesson-list">
            {data.lessons.map((lesson) => (
              <LessonCard
                key={lesson.id}
                lesson={lesson}
                show={show}
                detailsHref={lessonHref?.(lesson.id)}
              />
            ))}
          </ul>
        )}
      </QueryBoundary>
    </>
  );
}
