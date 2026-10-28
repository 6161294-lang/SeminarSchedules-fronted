import { Link } from 'react-router-dom';
import { useNotifications } from '@/api/hooks/messaging';
import { paths } from '@/routes/paths';

/** פעמון בכותרת עם מספר ההתראות שלא נקראו. מתרענן לבד כל 30 שניות */
export function NotificationBell() {
  const { data } = useNotifications();
  const unread = data?.unreadCount ?? 0;

  return (
    <Link
      to={paths.notifications}
      className="bell"
      aria-label={unread > 0 ? `התראות, ${unread} חדשות` : 'התראות'}
    >
      <span aria-hidden="true">🔔</span>
      {unread > 0 && (
        <span className="bell__badge" data-testid="unread-badge">
          {unread > 99 ? '99+' : unread}
        </span>
      )}
    </Link>
  );
}
