import {
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useNotifications
} from '@/api/hooks/messaging';
import { Button } from '@/components/ui/Button';
import { QueryBoundary } from '@/components/ui/QueryBoundary';
import { useToast } from '@/components/toast/useToast';
import { NotificationItem } from './NotificationItem';

export function NotificationList() {
  const query = useNotifications();
  const markRead = useMarkNotificationRead();
  const markAll = useMarkAllNotificationsRead();
  const toast = useToast();

  return (
    <QueryBoundary
      query={query}
      isEmpty={(data) => data.items.length === 0}
      emptyMessage="אין התראות"
      loadingLabel="טוענת התראות..."
    >
      {(data) => (
        <>
          <div className="toolbar">
            <span>{data.unreadCount} לא נקראו</span>
            <Button
              variant="secondary"
              disabled={data.unreadCount === 0}
              loading={markAll.isPending}
              onClick={() =>
                markAll.mutate(undefined, { onError: (error) => toast.error(error.message) })
              }
            >
              סימון הכול כנקרא
            </Button>
          </div>
          <ul className="notification-list">
            {data.items.map((notification) => (
              <NotificationItem
                key={notification.id}
                notification={notification}
                busy={markRead.isPending}
                onMarkRead={(id) => markRead.mutate(id, { onError: (error) => toast.error(error.message) })}
              />
            ))}
          </ul>
        </>
      )}
    </QueryBoundary>
  );
}
