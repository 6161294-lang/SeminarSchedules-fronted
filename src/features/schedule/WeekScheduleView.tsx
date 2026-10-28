import { useWeekSchedule } from '@/api/hooks/lessons';
import { QueryBoundary } from '@/components/ui/QueryBoundary';
import { WeekGrid } from './WeekGrid';

interface WeekScheduleViewProps {
  dayHref: (dayOfWeek: number) => string;
}

/** טוענת ומציגה את המערכת השבועית. משותפת לתלמידה ולמורה */
export function WeekScheduleView({ dayHref }: WeekScheduleViewProps) {
  const query = useWeekSchedule();
  return (
    <QueryBoundary query={query} loadingLabel="טוענת את המערכת...">
      {(schedule) => <WeekGrid schedule={schedule} dayHref={dayHref} />}
    </QueryBoundary>
  );
}
