import { useState } from 'react';
import { useHomeworks } from '@/api/hooks/homework';
import { SelectField } from '@/components/forms/SelectField';
import { QueryBoundary } from '@/components/ui/QueryBoundary';
import { HomeworkCard } from './HomeworkCard';

type Filter = 'all' | 'upcoming';

export function HomeworkList() {
  const [filter, setFilter] = useState<Filter>('all');
  const query = useHomeworks({ upcoming: filter === 'upcoming' ? true : undefined });

  return (
    <>
      <div className="toolbar">
        <SelectField label="הצגה" value={filter} onChange={(e) => setFilter(e.target.value as Filter)}>
          <option value="all">כל שיעורי הבית</option>
          <option value="upcoming">רק כאלה שמועד ההגשה שלהם לא עבר</option>
        </SelectField>
      </div>
      <QueryBoundary
        query={query}
        isEmpty={(items) => items.length === 0}
        emptyMessage="אין שיעורי בית להצגה"
        loadingLabel="טוענת שיעורי בית..."
      >
        {(items) => (
          <ul className="card-list">
            {items.map((homework) => (
              <HomeworkCard key={homework.id} homework={homework} />
            ))}
          </ul>
        )}
      </QueryBoundary>
    </>
  );
}
