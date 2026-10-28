import { useState, type ReactNode } from 'react';
import { useClasses, useSubjects } from '@/api/hooks/catalog';
import { Button } from '@/components/ui/Button';
import { QueryBoundary } from '@/components/ui/QueryBoundary';
import { GRADE_LABELS } from './catalogSchemas';
import { ClassForm } from './ClassForm';
import { SubjectForm } from './SubjectForm';

/** שורה ברשימה: שם, ובלחיצה על עריכה מוחלפת בטופס. משותפת לכיתות ולמקצועות */
function EditableRow({
  title,
  meta,
  renderForm
}: {
  title: string;
  meta?: string;
  renderForm: (onDone: () => void) => ReactNode;
}) {
  const [editing, setEditing] = useState(false);
  if (editing) return <li className="card">{renderForm(() => setEditing(false))}</li>;
  return (
    <li className="card card__row">
      <span>
        <strong>{title}</strong> {meta && <span className="muted">· {meta}</span>}
      </span>
      <Button variant="secondary" onClick={() => setEditing(true)} aria-label={`עריכת ${title}`}>
        עריכה
      </Button>
    </li>
  );
}

function ClassesSection() {
  const [adding, setAdding] = useState(false);
  const query = useClasses();
  return (
    <section>
      <div className="card__row">
        <h2>כיתות</h2>
        {!adding && <Button onClick={() => setAdding(true)}>הוספת כיתה</Button>}
      </div>
      {adding && (
        <div className="card">
          <ClassForm onDone={() => setAdding(false)} />
        </div>
      )}
      <QueryBoundary query={query} isEmpty={(items) => items.length === 0} emptyMessage="עוד אין כיתות" loadingLabel="טוענת כיתות...">
        {(items) => (
          <ul className="card-list">
            {items.map((item) => (
              <EditableRow
                key={item.id}
                title={item.name}
                meta={GRADE_LABELS[item.grade]}
                renderForm={(onDone) => <ClassForm item={item} onDone={onDone} />}
              />
            ))}
          </ul>
        )}
      </QueryBoundary>
    </section>
  );
}

function SubjectsSection() {
  const [adding, setAdding] = useState(false);
  const query = useSubjects();
  return (
    <section>
      <div className="card__row">
        <h2>מקצועות</h2>
        {!adding && <Button onClick={() => setAdding(true)}>הוספת מקצוע</Button>}
      </div>
      {adding && (
        <div className="card">
          <SubjectForm onDone={() => setAdding(false)} />
        </div>
      )}
      <QueryBoundary query={query} isEmpty={(items) => items.length === 0} emptyMessage="עוד אין מקצועות" loadingLabel="טוענת מקצועות...">
        {(items) => (
          <ul className="card-list">
            {items.map((item) => (
              <EditableRow
                key={item.id}
                title={item.name}
                renderForm={(onDone) => <SubjectForm item={item} onDone={onDone} />}
              />
            ))}
          </ul>
        )}
      </QueryBoundary>
    </section>
  );
}

export function CatalogView() {
  return (
    <>
      <ClassesSection />
      <SubjectsSection />
    </>
  );
}
