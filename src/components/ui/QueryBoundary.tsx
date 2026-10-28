import type { UseQueryResult } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { getErrorMessage } from '@/api/client';
import { EmptyState } from './EmptyState';
import { ErrorMessage } from './ErrorMessage';
import { LoadingScreen } from './LoadingScreen';

interface QueryBoundaryProps<T> {
  query: Pick<UseQueryResult<T, Error>, 'isPending' | 'isError' | 'error' | 'data' | 'refetch'>;
  /** מתי להציג "אין נתונים" במקום התוכן */
  isEmpty?: (data: T) => boolean;
  emptyMessage?: string;
  loadingLabel?: string;
  children: (data: T) => ReactNode;
}

/**
 * מטפלת במקום אחד בשלושת המצבים של כל טעינה: טעינה, שגיאה (עם "נסי שוב") ורשימה ריקה.
 * כך כל מסך מציג רק את התוכן עצמו.
 */
export function QueryBoundary<T>({
  query,
  isEmpty,
  emptyMessage = 'אין נתונים להצגה',
  loadingLabel,
  children
}: QueryBoundaryProps<T>) {
  if (query.isPending) return <LoadingScreen label={loadingLabel} />;
  if (query.isError) {
    return <ErrorMessage message={getErrorMessage(query.error)} onRetry={() => void query.refetch()} />;
  }
  // אחרי שהטעינה הסתיימה בלי שגיאה, data תמיד קיים
  const data = query.data as T;
  if (isEmpty?.(data)) return <EmptyState message={emptyMessage} />;
  return <>{children(data)}</>;
}
