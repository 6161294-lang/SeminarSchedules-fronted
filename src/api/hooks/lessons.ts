import { useQuery } from '@tanstack/react-query';
import type { CreateLessonInput, LessonFilters, UpdateLessonInput } from '@/types/api';
import { lessonsApi } from '../endpoints';
import { queryKeys } from '../queryKeys';
import { useApiMutation } from './useApiMutation';

export const useLessons = (filters: LessonFilters = {}) =>
  useQuery({ queryKey: queryKeys.lessons.list(filters), queryFn: () => lessonsApi.list(filters) });

export const useWeekSchedule = () =>
  useQuery({ queryKey: queryKeys.lessons.week(), queryFn: lessonsApi.week });

export const useDaySchedule = (dayOfWeek: number) =>
  useQuery({
    queryKey: queryKeys.lessons.day(dayOfWeek),
    queryFn: () => lessonsApi.day(dayOfWeek)
  });

export const useLesson = (id: string) =>
  useQuery({ queryKey: queryKeys.lessons.detail(id), queryFn: () => lessonsApi.get(id) });

export const useCreateLesson = () =>
  useApiMutation((input: CreateLessonInput) => lessonsApi.create(input), [queryKeys.lessons.all]);

export const useUpdateLesson = () =>
  useApiMutation(
    ({ id, input }: { id: string; input: UpdateLessonInput }) => lessonsApi.update(id, input),
    [queryKeys.lessons.all]
  );

export const useDeleteLesson = () =>
  useApiMutation((id: string) => lessonsApi.remove(id), [queryKeys.lessons.all]);
