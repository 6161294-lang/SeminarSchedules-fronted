import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { ROLE_LABELS } from '@/routes/paths';
import type { User } from '@/types/api';
import { EditUserForm } from './EditUserForm';

export function UserItem({ user }: { user: User }) {
  const [editing, setEditing] = useState(false);

  return (
    <li className={user.isActive ? 'card' : 'card card--inactive'}>
      <div className="card__row">
        <h2>{user.fullName}</h2>
        <span>
          <span className="badge">{ROLE_LABELS[user.role]}</span>
          {user.class && <span className="badge">{user.class.name}</span>}
          {!user.isActive && <span className="badge badge--warning">מושבתת</span>}
        </span>
      </div>
      <p className="muted">{user.email}</p>
      {editing ? (
        <EditUserForm user={user} onDone={() => setEditing(false)} />
      ) : (
        <Button variant="secondary" onClick={() => setEditing(true)}>
          עריכה
        </Button>
      )}
    </li>
  );
}
