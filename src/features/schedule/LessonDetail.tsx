import { Link, useParams } from 'react-router-dom';
import { useLesson } from '@/api/hooks/lessons';
import { Alert } from '@/components/ui/Alert';
import { PageHeader } from '@/components/ui/PageHeader';
import { QueryBoundary } from '@/components/ui/QueryBoundary';
import { HomeworkForm } from '@/features/homework/HomeworkForm';
import { TeacherHomeworkList } from '@/features/homework/TeacherHomeworkList';
import { LessonNotes } from '@/features/notes/LessonNotes';
import { paths } from '@/routes/paths';
import { dayName, formatTimeRange } from '@/utils/format';
import { israelToday } from '@/utils/today';

/** עמוד שיעור של המורה: פרטים, שיעורי בית (יצירה רק ביום השיעור) והערות אישיות */
export function LessonDetail() {
  const { id = '' } = useParams();
  const query = useLesson(id);

  return (
    <QueryBoundary query={query} loadingLabel="טוענת את השיעור...">
      {(lesson) => {
        const isToday = lesson.dayOfWeek === israelToday().dayOfWeek;
        return (
          <>
            <PageHeader
              title={lesson.subject.name}
              subtitle={`כיתה ${lesson.class.name} · יום ${dayName(lesson.dayOfWeek)} ${formatTimeRange(
                lesson.startTime,
                lesson.endTime
              )} · חדר ${lesson.room}`}
              actions={<Link to={`${paths.teacher}/day/${lesson.dayOfWeek}`}>חזרה ליום</Link>}
            />

            <h2>שיעורי בית</h2>
            {isToday ? (
              <section className="card">
                <h3>הוספת שיעורי בית להיום</h3>
                <HomeworkForm lessonId={lesson.id} />
              </section>
            ) : (
              <Alert kind="info">
                אפשר להוסיף שיעורי בית רק בשיעור שמתקיים היום. השיעור הזה מתקיים ביום {dayName(lesson.dayOfWeek)}.
              </Alert>
            )}
            <TeacherHomeworkList lessonId={lesson.id} />

            <h2>ההערות שלי על השיעור</h2>
            <p className="muted">רק את רואה את ההערות האלה.</p>
            <LessonNotes lesson={lesson} />
          </>
        );
      }}
    </QueryBoundary>
  );
}
