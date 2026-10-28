import { PageHeader } from '@/components/ui/PageHeader';
import { DayScheduleView } from '@/features/schedule/DayScheduleView';
import { WeekScheduleView } from '@/features/schedule/WeekScheduleView';
import { HomeworkDetail } from '@/features/homework/HomeworkDetail';
import { HomeworkList } from '@/features/homework/HomeworkList';
import { NotebookView } from '@/features/notes/NotebookView';
import { MySubmissions } from '@/features/submissions/MySubmissions';
import { paths } from '@/routes/paths';

// כל עמוד של התלמידה: כותרת, ואז הרכיב שמטפל בתוכן. הלוגיקה נמצאת ב-features

export function WeekSchedulePage() {
  return (
    <>
      <PageHeader title="המערכת השבועית" subtitle="לחיצה על יום מציגה את המערכת היומית" />
      <WeekScheduleView dayHref={(day) => `${paths.student}/day/${day}`} />
    </>
  );
}

export function DaySchedulePage() {
  return <DayScheduleView backTo={paths.student} show="teacher" />;
}

export function HomeworkListPage() {
  return (
    <>
      <PageHeader title="שיעורי בית" subtitle="מה נדרש ממך, ועד מתי" />
      <HomeworkList />
    </>
  );
}

export function HomeworkDetailPage() {
  return <HomeworkDetail />;
}

export function MySubmissionsPage() {
  return (
    <>
      <PageHeader title="ההגשות שלי" subtitle="הקבצים שהגשת והמשוב מהמורות" />
      <MySubmissions />
    </>
  );
}

export function StudentNotebookPage() {
  return (
    <>
      <PageHeader title="המחברת שלי" subtitle="הערות אישיות. רק את רואה אותן" />
      <NotebookView showClass={false} />
    </>
  );
}
