import { QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Lesson } from '@/types/api';
import { configureApiClient } from '../client';
import { createQueryClient } from '../queryClient';
import { queryKeys } from '../queryKeys';
import { useLessons, useUpdateLesson } from './lessons';

const lesson: Lesson = {
  id: 'l1',
  subject: { id: 's1', name: 'מבני נתונים' },
  teacher: { id: 't1', fullName: 'רחל כהן' },
  class: { id: 'c1', name: 'ה1', grade: 'HEH' },
  dayOfWeek: 0,
  startTime: '09:00',
  endTime: '10:30',
  room: '101',
  status: 'ACTIVE',
  changeNote: null
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

function setup() {
  const queryClient = createQueryClient();
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  return { queryClient, wrapper };
}

let fetchMock: ReturnType<typeof vi.fn>;
beforeEach(() => {
  fetchMock = vi.fn();
  vi.stubGlobal('fetch', fetchMock);
  configureApiClient({ getToken: () => 'key', onUnauthorized: () => undefined });
});
afterEach(() => {
  vi.unstubAllGlobals();
});

describe('hooks של React Query', () => {
  it('useLessons מביא נתונים מהשרת עם הסינון שנבחר', async () => {
    fetchMock.mockResolvedValue(json([lesson]));
    const { wrapper } = setup();
    const { result } = renderHook(() => useLessons({ dayOfWeek: 0 }), { wrapper });

    expect(result.current.isLoading).toBe(true);
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual([lesson]);
    expect(String(fetchMock.mock.calls[0]?.[0])).toBe('http://localhost:3000/api/lessons?dayOfWeek=0');
  });

  it('useLessons חושף שגיאה כש-השרת מחזיר 403', async () => {
    fetchMock.mockResolvedValue(json({ error: { code: 'FORBIDDEN', message: 'אין לך הרשאה' } }, 403));
    const { wrapper } = setup();
    const { result } = renderHook(() => useLessons(), { wrapper });
    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error?.message).toBe('אין לך הרשאה');
    expect(fetchMock).toHaveBeenCalledTimes(1); // 4xx לא מנוסה שוב
  });

  it('useUpdateLesson שולח PATCH ומרענן את מטמון השיעורים', async () => {
    fetchMock.mockResolvedValue(json({ ...lesson, room: '202' }));
    const { wrapper, queryClient } = setup();
    const invalidate = vi.spyOn(queryClient, 'invalidateQueries');
    const { result } = renderHook(() => useUpdateLesson(), { wrapper });

    result.current.mutate({ id: 'l1', input: { room: '202' } });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('http://localhost:3000/api/lessons/l1');
    expect(init.method).toBe('PATCH');
    expect(init.body).toBe(JSON.stringify({ room: '202' }));
    expect(invalidate).toHaveBeenCalledWith({ queryKey: queryKeys.lessons.all });
  });
});
