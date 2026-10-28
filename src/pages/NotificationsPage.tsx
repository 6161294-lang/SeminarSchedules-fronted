import { PageHeader } from '@/components/ui/PageHeader';
import { NotificationList } from '@/features/notifications/NotificationList';

export function NotificationsPage() {
  return (
    <>
      <PageHeader title="התראות" subtitle="שינויים במערכת, שיעורי בית, משוב והודעות" />
      <NotificationList />
    </>
  );
}
