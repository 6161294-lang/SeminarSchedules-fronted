import type { CSSProperties } from 'react';
import { Link } from 'react-router-dom';
import type { Lesson, WeekSchedule } from '@/types/api';
import { dayName, formatTimeRange } from '@/utils/format';
import { israelNow } from '@/utils/today';

interface WeekGridProps {
  schedule: WeekSchedule;
  /** לאן מובילה לחיצה על יום או על שיעור (המערכת היומית) */
  dayHref: (dayOfWeek: number) => string;
}

// טווח השעות שמוצג בטבלה
const FIRST_HOUR = 8;
const LAST_HOUR = 22;
const HOURS = LAST_HOUR - FIRST_HOUR;
const SUBJECT_COLORS = 6;

/** "09:30" -> 9.5 */
function toHours(time: string): number {
  const [h = 0, m = 0] = time.split(':').map(Number);
  return h + m / 60;
}

/** השעה בתוך הטבלה (0 = 08:00), מוגבלת לטווח המוצג */
function offsetOf(time: string): number {
  return Math.min(Math.max(toHours(time) - FIRST_HOUR, 0), HOURS);
}

/** אותו מקצוע מקבל תמיד אותו צבע */
function subjectColor(subjectId: string): number {
  let hash = 0;
  for (const char of subjectId) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  return (hash % SUBJECT_COLORS) + 1;
}

/**
 * המערכת השבועית כטבלה: ימים לרוחב, שעות 08:00-22:00 לאורך, וכל שיעור במשבצת שלו.
 * שיעורים שבוטלו לא מוצגים בטבלה, אלא ברשימת השינויים שמעליה
 */
export function WeekGrid({ schedule, dayHref }: WeekGridProps) {
  const now = israelNow();
  const lessons = schedule.days.flatMap((day) => day.lessons);
  const changes = lessons.filter((l) => l.status === 'CANCELLED' || l.changeNote);
  const activeCount = lessons.filter((l) => l.status !== 'CANCELLED').length;
  const nextLesson = schedule.days
    .find((day) => day.dayOfWeek === now.dayOfWeek)
    ?.lessons.find((l) => l.status !== 'CANCELLED' && toHours(l.startTime) >= now.hours);
  const nowOffset = now.hours - FIRST_HOUR;

  return (
    <>
      <div className="week-summary">
        <section className="card" aria-label="השיעור הבא">
          <h2 className="muted">השיעור הבא היום</h2>
          <p className="week-summary__value">
            {nextLesson ? `${nextLesson.subject.name} · ${nextLesson.startTime}` : 'אין עוד שיעורים היום'}
          </p>
        </section>
        <section className="card" aria-label="שיעורים השבוע">
          <h2 className="muted">שיעורים השבוע</h2>
          <p className="week-summary__value">{activeCount} שיעורים</p>
        </section>
        <section className="card week-changes" aria-label="שינויים במערכת">
          <h2 className="muted">שינויים במערכת</h2>
          {changes.length === 0 ? (
            <p className="week-summary__value">אין שינויים השבוע</p>
          ) : (
            <ul>
              {changes.map((lesson) => (
                <ChangeItem key={lesson.id} lesson={lesson} />
              ))}
            </ul>
          )}
        </section>
      </div>

      <div className="week-grid">
        <div className="week-grid__inner" style={{ '--hours': HOURS } as CSSProperties}>
          <div className="week-day week-hours" aria-hidden="true">
            <div className="week-day__head" />
            <div className="week-day__body">
              {Array.from({ length: HOURS }, (_, i) => (
                <span key={i} className="week-hours__label" style={{ '--offset': i } as CSSProperties}>
                  {String(FIRST_HOUR + i).padStart(2, '0')}:00
                </span>
              ))}
            </div>
          </div>

          {schedule.days.map((day) => {
            const isToday = day.dayOfWeek === now.dayOfWeek;
            const active = day.lessons.filter((l) => l.status !== 'CANCELLED');
            return (
              <section
                key={day.dayOfWeek}
                className={isToday ? 'week-day week-day--today' : 'week-day'}
                aria-label={`יום ${day.name}`}
              >
                <div className="week-day__head">
                  <h2>
                    <Link to={dayHref(day.dayOfWeek)}>יום {day.name}</Link>
                    {isToday && <span className="badge">היום</span>}
                  </h2>
                </div>
                <div className="week-day__body">
                  {active.length === 0 && <p className="muted week-day__empty">אין שיעורים</p>}
                  {active.map((lesson) => (
                    <WeekLesson key={lesson.id} lesson={lesson} href={dayHref(day.dayOfWeek)} />
                  ))}
                  {isToday && nowOffset > 0 && nowOffset < HOURS && (
                    <div className="week-now" style={{ '--offset': nowOffset } as CSSProperties} title="השעה עכשיו" />
                  )}
                </div>
              </section>
            );
          })}
        </div>
      </div>
    </>
  );
}

function WeekLesson({ lesson, href }: { lesson: Lesson; href: string }) {
  const start = offsetOf(lesson.startTime);
  const span = offsetOf(lesson.endTime) - start;
  const time = formatTimeRange(lesson.startTime, lesson.endTime);
  return (
    <Link
      to={href}
      className={`week-lesson subject-${subjectColor(lesson.subject.id)}`}
      style={{ '--start': start, '--span': span } as CSSProperties}
      title={`${lesson.subject.name}, ${time}, חדר ${lesson.room}`}
    >
      <span className="week-lesson__title">{lesson.subject.name}</span>
      <span className="week-lesson__time">{time}</span>
      {span >= 1 && (
        <span className="week-lesson__meta">
          {lesson.teacher.fullName} · חדר {lesson.room}
        </span>
      )}
      {lesson.changeNote && span >= 1.25 && <span className="week-lesson__note">{lesson.changeNote}</span>}
    </Link>
  );
}

function ChangeItem({ lesson }: { lesson: Lesson }) {
  const cancelled = lesson.status === 'CANCELLED';
  return (
    <li>
      <span className={cancelled ? 'badge badge--danger' : 'badge badge--warning'}>
        {cancelled ? 'בוטל' : 'שינוי'}
      </span>
      <strong>{lesson.subject.name}</strong>
      <span className="week-changes__when">
        יום {dayName(lesson.dayOfWeek)} · {formatTimeRange(lesson.startTime, lesson.endTime)}
      </span>
      {lesson.changeNote && <span>{lesson.changeNote}</span>}
    </li>
  );
}
