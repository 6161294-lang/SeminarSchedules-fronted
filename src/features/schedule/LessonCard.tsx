import { Link } from 'react-router-dom';
import type { Lesson } from '@/types/api';
import { formatTimeRange } from '@/utils/format';

interface LessonCardProps {
  lesson: Lesson;
  /** תלמידה רואה את שם המורה. מורה רואה את שם הכיתה */
  show: 'teacher' | 'class';
  /** כשמוגדר, מוצג קישור לפרטי השיעור (למורה) */
  detailsHref?: string;
}

/** פרטי שיעור במערכת היומית: מקצוע, שעות, חדר, ומי מלמדת או איזו כיתה */
export function LessonCard({ lesson, show, detailsHref }: LessonCardProps) {
  return (
    <li className="card lesson-card">
      <div className="lesson-card__time">{formatTimeRange(lesson.startTime, lesson.endTime)}</div>
      <div className="lesson-card__body">
        <h3>{lesson.subject.name}</h3>
        <p>חדר {lesson.room}</p>
        <p className="muted">
          {show === 'teacher' ? `מורה: ${lesson.teacher.fullName}` : `כיתה: ${lesson.class.name}`}
        </p>
        {lesson.changeNote && <p className="lesson-card__note">{lesson.changeNote}</p>}
        {detailsHref && <Link to={detailsHref}>פרטי שיעור, שיעורי בית והערות</Link>}
      </div>
    </li>
  );
}
