import { QueryClientProvider, type QueryClient } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { Provider } from 'react-redux';
import { ToastProvider } from '@/components/toast/ToastProvider';
import type { AppStore } from './store';

interface AppProvidersProps {
  store: AppStore;
  queryClient: QueryClient;
  children: ReactNode;
}

/** כל ה-Providers במקום אחד: Redux, React Query והודעות קופצות. הראוטר מתווסף בנפרד */
export function AppProviders({ store, queryClient, children }: AppProvidersProps) {
  return (
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <ToastProvider>{children}</ToastProvider>
      </QueryClientProvider>
    </Provider>
  );
}
