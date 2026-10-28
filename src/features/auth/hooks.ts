import { useMutation, useQueryClient } from '@tanstack/react-query';
import { authApi } from '@/api/endpoints';
import type { ApiError } from '@/api/client';
import { useAppDispatch } from '@/app/hooks';
import type { LoginInput, LoginResponse, RegisterInput } from '@/types/api';
import { loggedIn, loggedOut } from './authSlice';

export function useLogin() {
  const dispatch = useAppDispatch();
  return useMutation<LoginResponse, ApiError, LoginInput>({
    mutationFn: authApi.login,
    onSuccess: (data) => {
      dispatch(loggedIn(data));
    }
  });
}

/** הרשמת מזכירה. השרת יוצר סמינר ריק ומחזיר התחברות */
export function useRegister() {
  const dispatch = useAppDispatch();
  return useMutation<LoginResponse, ApiError, RegisterInput>({
    mutationFn: authApi.register,
    onSuccess: (data) => {
      dispatch(loggedIn(data));
    }
  });
}

/** מנתקת גם אם הבקשה לשרת נכשלה (למשל המפתח כבר פג), כדי שהמשתמשת לא תיתקע */
export function useLogout() {
  const dispatch = useAppDispatch();
  const queryClient = useQueryClient();
  return useMutation<void, ApiError>({
    mutationFn: authApi.logout,
    onSettled: () => {
      dispatch(loggedOut());
      queryClient.clear();
    }
  });
}
