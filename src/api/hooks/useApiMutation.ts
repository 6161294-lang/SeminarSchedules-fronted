import { useMutation, useQueryClient, type QueryKey } from '@tanstack/react-query';
import type { ApiError } from '../client';

/**
 * עוטף useMutation: אחרי הצלחה מרענן את המטמון של הקבוצות שצוינו.
 * כך לא חוזרים על אותו קוד רענון בכל פעולת כתיבה.
 */
export function useApiMutation<TData, TVariables>(
  mutationFn: (variables: TVariables) => Promise<TData>,
  invalidate: readonly QueryKey[] = []
) {
  const queryClient = useQueryClient();
  return useMutation<TData, ApiError, TVariables>({
    mutationFn,
    onSuccess: async () => {
      await Promise.all(invalidate.map((queryKey) => queryClient.invalidateQueries({ queryKey })));
    }
  });
}
