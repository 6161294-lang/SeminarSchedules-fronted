import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { createQueryClient } from './api/queryClient';
import { AppProviders } from './app/AppProviders';
import { setupApi } from './app/setupApi';
import { createAppStore } from './app/store';
import { persistAuth, restoredAuthState } from './features/auth/authStorage';
import './index.css';

const restored = restoredAuthState();
const store = createAppStore(restored ? { auth: restored } : undefined);
const queryClient = createQueryClient();

setupApi(store, queryClient);
persistAuth(store);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppProviders store={store} queryClient={queryClient}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </AppProviders>
  </StrictMode>
);
