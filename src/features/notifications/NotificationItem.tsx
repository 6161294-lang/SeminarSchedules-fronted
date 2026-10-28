import { Button } from '@/components/ui/Button';
import type { AppNotification } from '@/types/api';
import { formatDateTime } from '@/utils/format';

interface NotificationItemProps {
  notification: AppNotification;
  onMarkRead: (id: string) => void;
  busy: boolean;
}

export function NotificationItem({ notification, onMarkRead, busy }: NotificationItemProps) {
  const { id, title, body, createdAt, isRead } = notification;
  return (
    <li className={isRead ? 'notification' : 'notification notification--unread'}>
      <div className="notification__body">
        <strong>{title}</strong>
        <p>{body}</p>
        <small className="muted">{formatDateTime(createdAt)}</small>
      </div>
      {!isRead && (
        <Button variant="secondary" onClick={() => onMarkRead(id)} disabled={busy}>
          סימון כנקרא
        </Button>
      )}
    </li>
  );
}
