import { useQuery } from '@tanstack/react-query';
import type {
  ClassInput,
  CreateUserInput,
  SubjectInput,
  UpdateUserInput,
  UserFilters
} from '@/types/api';
import { catalogApi, usersApi } from '../endpoints';
import { queryKeys } from '../queryKeys';
import { useApiMutation } from './useApiMutation';

// הרשימות האלה כמעט לא משתנות, ולכן נשמרות זמן ארוך יותר במטמון
const LONG_STALE = 5 * 60_000;

export const useClasses = () =>
  useQuery({ queryKey: queryKeys.classes(), queryFn: catalogApi.classes, staleTime: LONG_STALE });

export const useSubjects = () =>
  useQuery({ queryKey: queryKeys.subjects(), queryFn: catalogApi.subjects, staleTime: LONG_STALE });

export const useCreateClass = () =>
  useApiMutation((input: ClassInput) => catalogApi.createClass(input), [queryKeys.classes()]);

export const useUpdateClass = () =>
  useApiMutation(
    ({ id, input }: { id: string; input: Partial<ClassInput> }) => catalogApi.updateClass(id, input),
    [queryKeys.classes()]
  );

export const useCreateSubject = () =>
  useApiMutation((input: SubjectInput) => catalogApi.createSubject(input), [queryKeys.subjects()]);

export const useUpdateSubject = () =>
  useApiMutation(
    ({ id, input }: { id: string; input: SubjectInput }) => catalogApi.updateSubject(id, input),
    [queryKeys.subjects()]
  );

export const useUsers = (filters: UserFilters = {}) =>
  useQuery({ queryKey: queryKeys.users.list(filters), queryFn: () => usersApi.list(filters) });

export const useCreateUser = () =>
  useApiMutation((input: CreateUserInput) => usersApi.create(input), [queryKeys.users.all]);

export const useUpdateUser = () =>
  useApiMutation(
    ({ id, input }: { id: string; input: UpdateUserInput }) => usersApi.update(id, input),
    [queryKeys.users.all]
  );
