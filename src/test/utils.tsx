import { render } from '@testing-library/react';
import type { ReactElement } from 'react';
import { MemoryRouter } from 'react-router-dom';
import { createQueryClient } from '@/api/queryClient';
import { AppProviders } from '@/app/AppProviders';
import { setupApi } from '@/app/setupApi';
import { createAppStore, type RootState } from '@/app/store';

interface Options {
  route?: string | { pathname: string; state?: unknown };
  preloadedState?: Partial<RootState>;
}

/** מציג רכיב עם Redux, React Query וראוטר, וכל מה שנדרש לבדיקה של מסך שלם */
export function renderWithProviders(ui: ReactElement, { route = '/', preloadedState }: Options = {}) {
  const store = createAppStore(preloadedState);
  const queryClient = createQueryClient();
  setupApi(store, queryClient);

  return {
    store,
    queryClient,
    ...render(
      <AppProviders store={store} queryClient={queryClient}>
        <MemoryRouter initialEntries={[route]}>{ui}</MemoryRouter>
      </AppProviders>
    )
  };
}
