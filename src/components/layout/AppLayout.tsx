import { NavLink, Outlet } from 'react-router-dom';
import { useAppSelector } from '@/app/hooks';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { selectUser } from '@/features/auth/authSlice';
import { useLogout } from '@/features/auth/hooks';
import { NotificationBell } from '@/features/notifications/NotificationBell';
import { NAV_ITEMS } from '@/routes/navigation';
import { ROLE_LABELS } from '@/routes/paths';

const todayFormat = new Intl.DateTimeFormat('he-IL', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  year: 'numeric',
  timeZone: 'Asia/Jerusalem'
});

/** המסגרת של כל המסכים אחרי התחברות: סרגל צד עם תפריט לפי תפקיד, סרגל עליון והתראות */
export function AppLayout() {
  const user = useAppSelector(selectUser);
  const logout = useLogout();

  if (!user) return null;

  return (
    <div className="layout">
      <aside className="layout__sidebar">
        <span className="layout__brand">
          <span className="layout__brand-mark" aria-hidden="true">
            ס
          </span>
          לוח זמנים לסמינר
        </span>
        <nav className="layout__nav" aria-label="ניווט ראשי">
          {NAV_ITEMS[user.role].map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) => (isActive ? 'nav-link nav-link--active' : 'nav-link')}
            >
              <Icon name={item.icon} />
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="layout__user">
          <span className="layout__avatar" aria-hidden="true">
            {user.fullName.charAt(0)}
          </span>
          <span className="layout__username">
            <strong>{user.fullName}</strong>
            {ROLE_LABELS[user.role]}
          </span>
          <Button
            variant="secondary"
            onClick={() => logout.mutate()}
            loading={logout.isPending}
            loadingText="מתנתקת..."
          >
            התנתקות
          </Button>
        </div>
      </aside>
      <div className="layout__content">
        <div className="layout__topbar">
          <span className="layout__date">{todayFormat.format(new Date())}</span>
          <NotificationBell />
        </div>
        <main className="layout__main">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
