import { useQuery } from '@tanstack/react-query';
import type { CreateAnnouncementInput, SendThreadMessageInput } from '@/types/api';
import { messagingApi, notificationsApi } from '../endpoints';
import { queryKeys } from '../queryKeys';
import { useApiMutation } from './useApiMutation';

const NOTIFICATIONS_POLL_MS = 30_000;
const THREAD_POLL_MS = 15_000;

/** התראות מתרעננות מעצמן כל 30 שניות, כי השרת לא דוחף אותן */
export const useNotifications = (unreadOnly = false, enabled = true) =>
  useQuery({
    queryKey: queryKeys.notifications.list(unreadOnly),
    queryFn: () => notificationsApi.list(unreadOnly),
    refetchInterval: NOTIFICATIONS_POLL_MS,
    enabled
  });

export const useMarkNotificationRead = () =>
  useApiMutation((id: string) => notificationsApi.markRead(id), [queryKeys.notifications.all]);

export const useMarkAllNotificationsRead = () =>
  useApiMutation<{ updated: number }, void>(() => notificationsApi.markAllRead(), [
    queryKeys.notifications.all
  ]);

export const useAnnouncements = () =>
  useQuery({ queryKey: queryKeys.messaging.announcements(), queryFn: messagingApi.announcements });

export const useCreateAnnouncement = () =>
  useApiMutation(
    (input: CreateAnnouncementInput) => messagingApi.createAnnouncement(input),
    [queryKeys.messaging.all]
  );

export const useThreads = () =>
  useQuery({ queryKey: queryKeys.messaging.threads(), queryFn: messagingApi.threads });

/** teacherId נדרש רק למזכירה. מורה מקבלת את השיחה שלה */
export const useThread = (teacherId?: string, enabled = true) =>
  useQuery({
    queryKey: queryKeys.messaging.thread(teacherId),
    queryFn: () => messagingApi.thread(teacherId),
    refetchInterval: THREAD_POLL_MS,
    enabled
  });

export const useSendThreadMessage = () =>
  useApiMutation(
    (input: SendThreadMessageInput) => messagingApi.sendMessage(input),
    [queryKeys.messaging.all, queryKeys.notifications.all]
  );
