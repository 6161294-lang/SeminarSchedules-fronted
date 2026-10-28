import { Link } from 'react-router-dom';
import type { WeekSchedule } from '@/types/api';
import { formatTimeRange } from '@/utils/format';
import { israelToday } from '@/utils/today';

interface WeekGridProps {
  schedule: WeekSchedule;
  /** לאן מובילה לחיצה על יום (המערכת היומית) */
  dayHref: (dayOfWeek: number) => string;
}

/** המערכת השבועית: כרטיס לכל יום עם השיעורים שלו. לחיצה על היום פותחת את המערכת היומית */
export function WeekGrid({ schedule, dayHref }: WeekGridProps) {
  const today = israelToday().dayOfWeek;

  return (
    <div className="week-grid">
      {schedule.days.map((day) => (
        <section
          key={day.dayOfWeek}
          className={day.dayOfWeek === today ? 'card week-day week-day--today' : 'card week-day'}
          aria-label={`יום ${day.name}`}
        >
          <h2>
            <Link to={dayHref(day.dayOfWeek)}>יום {day.name}</Link>
            {day.dayOfWeek === today && <span className="badge">היום</span>}
          </h2>
          {day.lessons.length === 0 ? (
            <p className="muted">אין שיעורים</p>
          ) : (
            <ul>
              {day.lessons.map((lesson) => (
                <li key={lesson.id}>
                  <strong>{formatTimeRange(lesson.startTime, lesson.endTime)}</strong> {lesson.subject.name}
                  <span className="muted"> · חדר {lesson.room}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      ))}
    </div>
  );
}
