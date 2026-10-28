import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiError, configureApiClient, download, request } from './client';
import { shouldRetry } from './queryClient';

const jsonResponse = (body: unknown, status = 200, headers: Record<string, string> = {}) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...headers }
  });

let fetchMock: ReturnType<typeof vi.fn>;
const lastCall = () => {
  const [url, init] = fetchMock.mock.calls.at(-1) as [string, RequestInit];
  return { url, init, headers: init.headers as Headers };
};

beforeEach(() => {
  fetchMock = vi.fn();
  vi.stubGlobal('fetch', fetchMock);
  configureApiClient({ getToken: () => null, onUnauthorized: () => undefined });
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('request', () => {
  it('בונה כתובת מלאה עם query ומדלג על ערכים ריקים', async () => {
    fetchMock.mockResolvedValue(jsonResponse([]));
    await request('/api/lessons', { query: { classId: 'abc', dayOfWeek: 0, status: undefined, search: '' } });
    const { url, init } = lastCall();
    expect(url).toBe('http://localhost:3000/api/lessons?classId=abc&dayOfWeek=0');
    expect(init.method).toBe('GET');
  });

  it('שולח Authorization: Bearer כשיש מפתח', async () => {
    configureApiClient({ getToken: () => 'my-key' });
    fetchMock.mockResolvedValue(jsonResponse({}));
    await request('/api/auth/me');
    expect(lastCall().headers.get('Authorization')).toBe('Bearer my-key');
  });

  it('לא שולח Authorization כש-auth הוא false', async () => {
    configureApiClient({ getToken: () => 'my-key' });
    fetchMock.mockResolvedValue(jsonResponse({}));
    await request('/api/auth/login', { method: 'POST', body: { email: 'a@b.c', password: 'x' }, auth: false });
    expect(lastCall().headers.get('Authorization')).toBeNull();
  });

  it('שולח JSON עם Content-Type', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ ok: true }, 201));
    await request('/api/notes', { method: 'POST', body: { lessonId: '1', content: 'שלום' } });
    const { init, headers } = lastCall();
    expect(headers.get('Content-Type')).toBe('application/json');
    expect(init.body).toBe(JSON.stringify({ lessonId: '1', content: 'שלום' }));
  });

  it('שולח FormData בלי לקבוע Content-Type ידנית', async () => {
    fetchMock.mockResolvedValue(jsonResponse({}, 201));
    const form = new FormData();
    form.append('comment', 'הערה');
    await request('/api/homeworks/1/submission', { method: 'POST', body: form });
    const { init, headers } = lastCall();
    expect(init.body).toBe(form);
    expect(headers.get('Content-Type')).toBeNull();
  });

  it('תשובת 204 מחזירה undefined', async () => {
    fetchMock.mockResolvedValue(new Response(null, { status: 204 }));
    await expect(request('/api/lessons/1', { method: 'DELETE' })).resolves.toBeUndefined();
  });
});

describe('טיפול בשגיאות', () => {
  it('ממפה שגיאת שרת ל-ApiError עם קוד, הודעה ופרטי שדות', async () => {
    fetchMock.mockResolvedValue(
      jsonResponse(
        {
          error: {
            code: 'VALIDATION_ERROR',
            message: 'הנתונים שנשלחו אינם תקינים',
            details: [{ field: 'email', message: 'אימייל לא תקין' }, 'לא תקין']
          }
        },
        400
      )
    );
    const error = (await request('/api/users', { method: 'POST', body: {} }).catch((e) => e)) as ApiError;
    expect(error).toBeInstanceOf(ApiError);
    expect(error.status).toBe(400);
    expect(error.code).toBe('VALIDATION_ERROR');
    expect(error.message).toBe('הנתונים שנשלחו אינם תקינים');
    expect(error.details).toEqual([{ field: 'email', message: 'אימייל לא תקין' }]);
  });

  it('שומר גם את הפרטים הגולמיים (סיבות התנגשות בלוח)', async () => {
    const details = [{ lessonId: 'l2', reasons: ['המורה כבר מלמדת בשעה זו'] }];
    fetchMock.mockResolvedValue(
      jsonResponse({ error: { code: 'LESSON_CONFLICT', message: 'יש התנגשות', details } }, 409)
    );
    const error = (await request('/api/lessons', { method: 'POST', body: {} }).catch((e) => e)) as ApiError;
    expect(error.code).toBe('LESSON_CONFLICT');
    expect(error.rawDetails).toEqual(details);
    expect(error.details).toEqual([]);
  });

  it('שגיאה בלי גוף JSON מקבלת הודעת ברירת מחדל', async () => {
    fetchMock.mockResolvedValue(new Response('<html>Bad gateway</html>', { status: 502 }));
    const error = (await request('/api/lessons').catch((e) => e)) as ApiError;
    expect(error.status).toBe(502);
    expect(error.code).toBe('HTTP_ERROR');
    expect(error.message).toContain('שגיאה בשרת');
  });

  it('401 מפעיל onUnauthorized', async () => {
    const onUnauthorized = vi.fn();
    configureApiClient({ getToken: () => 'old', onUnauthorized });
    fetchMock.mockResolvedValue(jsonResponse({ error: { code: 'UNAUTHORIZED', message: 'פג' } }, 401));
    await expect(request('/api/auth/me')).rejects.toBeInstanceOf(ApiError);
    expect(onUnauthorized).toHaveBeenCalledTimes(1);
  });

  it('401 בהתחברות (auth false) לא מפעיל onUnauthorized', async () => {
    const onUnauthorized = vi.fn();
    configureApiClient({ onUnauthorized });
    fetchMock.mockResolvedValue(
      jsonResponse({ error: { code: 'INVALID_CREDENTIALS', message: 'אימייל או סיסמה שגויים' } }, 401)
    );
    const error = (await request('/api/auth/login', { method: 'POST', body: {}, auth: false }).catch(
      (e) => e
    )) as ApiError;
    expect(error.code).toBe('INVALID_CREDENTIALS');
    expect(onUnauthorized).not.toHaveBeenCalled();
  });

  it('כשל רשת הופך ל-ApiError עם סטטוס 0', async () => {
    fetchMock.mockRejectedValue(new TypeError('Failed to fetch'));
    const error = (await request('/api/lessons').catch((e) => e)) as ApiError;
    expect(error).toBeInstanceOf(ApiError);
    expect(error.status).toBe(0);
    expect(error.code).toBe('NETWORK_ERROR');
  });

  it('shouldRetry: לא מנסה שוב 4xx, מנסה פעם אחת שגיאות רשת ושרת', () => {
    expect(shouldRetry(0, new ApiError(403, 'FORBIDDEN', 'x'))).toBe(false);
    expect(shouldRetry(0, new ApiError(0, 'NETWORK_ERROR', 'x'))).toBe(true);
    expect(shouldRetry(1, new ApiError(0, 'NETWORK_ERROR', 'x'))).toBe(false);
    expect(shouldRetry(0, new ApiError(500, 'INTERNAL_ERROR', 'x'))).toBe(true);
  });
});

describe('download', () => {
  it('מחזיר את הקובץ ואת שמו בעברית מהכותרת', async () => {
    fetchMock.mockResolvedValue(
      new Response('שלום', {
        status: 200,
        headers: {
          'Content-Disposition': `attachment; filename="?????.txt"; filename*=UTF-8''%D7%AA%D7%A8%D7%92%D7%99%D7%9C.txt`
        }
      })
    );
    const result = await download('/api/submission-files/1');
    expect(result.fileName).toBe('תרגיל.txt');
    // ב-jsdom אין Blob.text(), ולכן בודקות את הגודל בבתים
    expect(result.blob.size).toBe(new TextEncoder().encode('שלום').length);
    expect(lastCall().headers.get('Accept')).toBe('*/*');
  });

  it('שם קובץ רגיל בלי קידוד', async () => {
    fetchMock.mockResolvedValue(
      new Response('x', { headers: { 'Content-Disposition': 'attachment; filename="main.py"' } })
    );
    expect((await download('/api/submission-files/1')).fileName).toBe('main.py');
  });
});
