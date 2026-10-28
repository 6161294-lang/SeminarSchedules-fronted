import { useQuery } from '@tanstack/react-query';
import type {
  CreateHomeworkInput,
  HomeworkFilters,
  SubmissionFilters,
  UpdateHomeworkInput
} from '@/types/api';
import { homeworksApi, submissionsApi } from '../endpoints';
import { queryKeys } from '../queryKeys';
import { useApiMutation } from './useApiMutation';

export const useHomeworks = (filters: HomeworkFilters = {}) =>
  useQuery({ queryKey: queryKeys.homeworks.list(filters), queryFn: () => homeworksApi.list(filters) });

export const useHomework = (id: string) =>
  useQuery({ queryKey: queryKeys.homeworks.detail(id), queryFn: () => homeworksApi.get(id) });

export const useCreateHomework = () =>
  useApiMutation((input: CreateHomeworkInput) => homeworksApi.create(input), [queryKeys.homeworks.all]);

export const useUpdateHomework = () =>
  useApiMutation(
    ({ id, input }: { id: string; input: UpdateHomeworkInput }) => homeworksApi.update(id, input),
    [queryKeys.homeworks.all]
  );

export const useDeleteHomework = () =>
  useApiMutation((id: string) => homeworksApi.remove(id), [
    queryKeys.homeworks.all,
    queryKeys.submissions.all
  ]);

/** הגשה של תלמידה: מרענן גם את שיעורי הבית (mySubmission) וגם את ההגשות */
export const useSubmitHomework = () =>
  useApiMutation(
    ({ homeworkId, form }: { homeworkId: string; form: FormData }) =>
      homeworksApi.submit(homeworkId, form),
    [queryKeys.homeworks.all, queryKeys.submissions.all]
  );

export const useMySubmissions = () =>
  useQuery({ queryKey: queryKeys.submissions.mine(), queryFn: submissionsApi.mine });

export const useTeacherSubmissions = (filters: SubmissionFilters = {}) =>
  useQuery({
    queryKey: queryKeys.submissions.list(filters),
    queryFn: () => submissionsApi.list(filters)
  });

export const useSaveFeedback = () =>
  useApiMutation(
    ({ submissionId, content }: { submissionId: string; content: string }) =>
      submissionsApi.saveFeedback(submissionId, content),
    [queryKeys.submissions.all]
  );
