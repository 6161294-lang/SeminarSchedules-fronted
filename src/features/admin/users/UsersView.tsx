import { useMemo, useState } from 'react';
import { useClasses, useUsers } from '@/api/hooks/catalog';
import { SelectField } from '@/components/forms/SelectField';
import { TextField } from '@/components/forms/TextField';
import { Button } from '@/components/ui/Button';
import { QueryBoundary } from '@/components/ui/QueryBoundary';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { ROLE_LABELS } from '@/routes/paths';
import type { Role, UserFilters } from '@/types/api';
import { CreateUserForm } from './CreateUserForm';
import { UserItem } from './UserItem';

/** ניהול משתמשים: רשימה עם סינון וחיפוש, יצירה, עריכה, השבתה ואיפוס סיסמה */
export function UsersView() {
  const [adding, setAdding] = useState(false);
  const [role, setRole] = useState('');
  const [classId, setClassId] = useState('');
  const [active, setActive] = useState('');
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search.trim());
  const classes = useClasses().data ?? [];

  const filters = useMemo<UserFilters>(
    () => ({
      role: role === '' ? undefined : (role as Role),
      classId: classId || undefined,
      isActive: active === '' ? undefined : active === 'true',
      search: debouncedSearch || undefined
    }),
    [role, classId, active, debouncedSearch]
  );
  const query = useUsers(filters);

  return (
    <>
      <div className="toolbar">{!adding && <Button onClick={() => setAdding(true)}>הוספת משתמשת</Button>}</div>
      {adding && <CreateUserForm onDone={() => setAdding(false)} />}

      <div className="filters">
        <SelectField label="תפקיד" value={role} onChange={(e) => setRole(e.target.value)}>
          <option value="">כל התפקידים</option>
          {(Object.keys(ROLE_LABELS) as Role[]).map((r) => (
            <option key={r} value={r}>
              {ROLE_LABELS[r]}
            </option>
          ))}
        </SelectField>
        <SelectField label="כיתה" value={classId} onChange={(e) => setClassId(e.target.value)}>
          <option value="">כל הכיתות</option>
          {classes.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </SelectField>
        <SelectField label="מצב חשבון" value={active} onChange={(e) => setActive(e.target.value)}>
          <option value="">פעילות ומושבתות</option>
          <option value="true">פעילות בלבד</option>
          <option value="false">מושבתות בלבד</option>
        </SelectField>
        <TextField label="חיפוש לפי שם או אימייל" type="search" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      <QueryBoundary
        query={query}
        isEmpty={(data) => data.items.length === 0}
        emptyMessage="לא נמצאו משתמשות"
        loadingLabel="טוענת משתמשות..."
      >
        {(data) => (
          <>
            <p className="muted">
              מוצגות {data.items.length} מתוך {data.total}
            </p>
            <ul className="card-list">
              {data.items.map((user) => (
                <UserItem key={user.id} user={user} />
              ))}
            </ul>
          </>
        )}
      </QueryBoundary>
    </>
  );
}
