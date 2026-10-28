import { PageHeader } from '@/components/ui/PageHeader';
import { TeacherHomeworkList } from '@/features/homework/TeacherHomeworkList';
import { TodayLessons } from '@/features/homework/TodayLessons';
import { ThreadView } from '@/features/messages/ThreadView';
import { NotebookView } from '@/features/notes/NotebookView';
import { DayScheduleView } from '@/features/schedule/DayScheduleView';
import { LessonDetail } from '@/features/schedule/LessonDetail';
import { WeekScheduleView } from '@/features/schedule/WeekScheduleView';
import { TeacherSubmissions } from '@/features/submissions/TeacherSubmissions';
import { paths } from '@/routes/paths';

// כל עמוד של המורה: כותרת, ואז הרכיב שמטפל בתוכן. הלוגיקה נמצאת ב-features

export function TeacherWeekPage() {
  return (
    <>
      <PageHeader title="המערכת שלי" subtitle="לחיצה על יום מציגה את שיעורי היום" />
      <WeekScheduleView dayHref={(day) => `${paths.teacher}/day/${day}`} />
    </>
  );
}

export function TeacherDayPage() {
  return (
    <DayScheduleView
      backTo={paths.teacher}
      show="class"
      lessonHref={(lessonId) => `${paths.teacher}/lesson/${lessonId}`}
    />
  );
}

export function TeacherLessonPage() {
  return <LessonDetail />;
}

export function TeacherHomeworkPage() {
  return (
    <>
      <PageHeader
        title="שיעורי בית"
        subtitle="שיעורי בית אפשר להוסיף רק לשיעור שמתקיים היום"
      />
      <TodayLessons />
      <h2>כל שיעורי הבית שלי</h2>
      <TeacherHomeworkList />
    </>
  );
}

export function TeacherSubmissionsPage() {
  return (
    <>
      <PageHeader title="הגשות" subtitle="ההגשות של התלמידות בשיעורים שלך" />
      <TeacherSubmissions />
    </>
  );
}

export function TeacherNotebookPage() {
  return (
    <>
      <PageHeader title="ההערות שלי" subtitle="הערות אישיות על שיעורים. רק את רואה אותן" />
      <NotebookView showClass />
    </>
  );
}

export function TeacherMessagesPage() {
  return (
    <>
      <PageHeader title="הודעות למזכירה" subtitle="שיחה פרטית בינך לבין המזכירה" />
      <ThreadView />
    </>
  );
}
