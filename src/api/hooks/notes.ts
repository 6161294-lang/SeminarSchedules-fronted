import { useQuery } from '@tanstack/react-query';
import type { CreateNoteInput, NoteFilters } from '@/types/api';
import { notesApi } from '../endpoints';
import { queryKeys } from '../queryKeys';
import { useApiMutation } from './useApiMutation';

export const useNotes = (filters: NoteFilters = {}) =>
  useQuery({ queryKey: queryKeys.notes.list(filters), queryFn: () => notesApi.list(filters) });

export const useCreateNote = () =>
  useApiMutation((input: CreateNoteInput) => notesApi.create(input), [queryKeys.notes.all]);

export const useUpdateNote = () =>
  useApiMutation(
    ({ id, content }: { id: string; content: string }) => notesApi.update(id, content),
    [queryKeys.notes.all]
  );

export const useDeleteNote = () =>
  useApiMutation((id: string) => notesApi.remove(id), [queryKeys.notes.all]);
