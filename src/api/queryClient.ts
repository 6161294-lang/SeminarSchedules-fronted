import { QueryClient } from '@tanstack/react-query';
import { ApiError } from './client';

/** לא מנסים שוב שגיאות שנובעות מהבקשה עצמה (400-499). רק תקלות רשת או שרת, ופעם אחת בלבד */
export function shouldRetry(failureCount: number, error: unknown): boolean {
  if (error instanceof ApiError && error.status >= 400 && error.status < 500) return false;
  return failureCount < 1;
}

export function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        retry: shouldRetry,
        refetchOnWindowFocus: false
      },
      mutations: { retry: false }
    }
  });
}
