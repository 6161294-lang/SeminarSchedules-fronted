import { createContext } from 'react';

export type ToastKind = 'success' | 'error' | 'info';

export interface ToastApi {
  success: (message: string) => void;
  error: (message: string) => void;
  info: (message: string) => void;
}

// Context להודעות קופצות: כל רכיב יכול להציג הודעה בלי להעביר props לאורך העץ
export const ToastContext = createContext<ToastApi | null>(null);
