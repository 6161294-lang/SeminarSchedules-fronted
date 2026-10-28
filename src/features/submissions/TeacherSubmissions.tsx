import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useClasses, useSubjects } from '@/api/hooks/catalog';
import { useHomeworks, useTeacherSubmissions } from '@/api/hooks/homework';
import { SelectField } from '@/components/forms/SelectField';
import { TextField } from '@/components/forms/TextField';
import { QueryBoundary } from '@/components/ui/QueryBoundary';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import type { SubmissionFilters } from '@/types/api';
import { TeacherSubmissionItem } from './TeacherSubmissionItem';

const SORT_OPTIONS = [
  { value: 'submittedAt:desc', label: 'הגשות אחרונות קודם' },
  { value: 'submittedAt:asc', label: 'הגשות ראשונות קודם' },
  { value: 'studentName:asc', label: 'שם תלמידה (א-ת)' },
  { value: 'studentName:desc', label: 'שם תלמידה (ת-א)' }
] as const;

/** ההגשות של התלמידות של המורה, עם סינון לפי כיתה, מקצוע ושיעורי בית, חיפוש לפי שם ומיון */
export function TeacherSubmissions() {
  const [params] = useSearchParams();
  const [classId, setClassId] = useState('');
  const [subjectId, setSubjectId] = useState('');
  const [homeworkId, setHomeworkId] = useState(params.get('homeworkId') ?? '');
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<string>(SORT_OPTIONS[0].value);
  const debouncedSearch = useDebouncedValue(search.trim());

  const classes = useClasses().data ?? [];
  const subjects = useSubjects().data ?? [];
  const homeworks = useHomeworks().data ?? [];

  const filters = useMemo<SubmissionFilters>(() => {
    const [sortBy, order] = sort.split(':') as [SubmissionFilters['sortBy'], SubmissionFilters['order']];
    return {
      classId: classId || undefined,
      subjectId: subjectId || undefined,
      homeworkId: homeworkId || undefined,
      search: debouncedSearch || undefined,
      sortBy,
      order
    };
  }, [classId, subjectId, homeworkId, debouncedSearch, sort]);

  const query = useTeacherSubmissions(filters);

  return (
    <>
      <div className="filters">
        <SelectField label="כיתה" value={classId} onChange={(e) => setClassId(e.target.value)}>
          <option value="">כל הכיתות</option>
          {classes.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </SelectField>
        <SelectField label="מקצוע" value={subjectId} onChange={(e) => setSubjectId(e.target.value)}>
          <option value="">כל המקצועות</option>
          {subjects.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </SelectField>
        <SelectField label="שיעורי בית" value={homeworkId} onChange={(e) => setHomeworkId(e.target.value)}>
          <option value="">כל שיעורי הבית</option>
          {homeworks.map((h) => (
            <option key={h.id} value={h.id}>
              {h.title}
            </option>
          ))}
        </SelectField>
        <TextField
          label="חיפוש לפי שם תלמידה"
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <SelectField label="מיון" value={sort} onChange={(e) => setSort(e.target.value)}>
          {SORT_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </SelectField>
      </div>

      <QueryBoundary
        query={query}
        isEmpty={(items) => items.length === 0}
        emptyMessage="אין הגשות שמתאימות לסינון"
        loadingLabel="טוענת הגשות..."
      >
        {(items) => (
          <ul className="card-list">
            {items.map((submission) => (
              <TeacherSubmissionItem key={submission.id} submission={submission} />
            ))}
          </ul>
        )}
      </QueryBoundary>
    </>
  );
}
