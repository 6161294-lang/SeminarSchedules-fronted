import { QueryClient } from '@tanstack/react-query';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { request } from '@/api/client';
import { authenticated, jsonResponse } from '@/test/fixtures';
import { setupApi } from './setupApi';
import { createAppStore } from './store';

let fetchMock: ReturnType<typeof vi.fn>;
beforeEach(() => {
  fetchMock = vi.fn();
  vi.stubGlobal('fetch', fetchMock);
});
afterEach(() => {
  vi.unstubAllGlobals();
});

describe('setupApi', () => {
  it('שולח את המפתח מה-Store בכל בקשה', async () => {
    const store = createAppStore(authenticated('TEACHER'));
    setupApi(store, new QueryClient());
    fetchMock.mockResolvedValue(jsonResponse({}));

    await request('/api/auth/me');
    const headers = (fetchMock.mock.calls[0] as [string, RequestInit])[1].headers as Headers;
    expect(headers.get('Authorization')).toBe('Bearer test-key');
  });

  it('תשובת 401 מנתקת ומנקה את המטמון', async () => {
    const store = createAppStore(authenticated());
    const queryClient = new QueryClient();
    queryClient.setQueryData(['lessons'], [1, 2, 3]);
    setupApi(store, queryClient);
    fetchMock.mockResolvedValue(jsonResponse({ error: { code: 'UNAUTHORIZED', message: 'פג' } }, 401));

    await expect(request('/api/lessons')).rejects.toMatchObject({ status: 401 });
    expect(store.getState().auth.status).toBe('anonymous');
    expect(queryClient.getQueryData(['lessons'])).toBeUndefined();
  });
});
