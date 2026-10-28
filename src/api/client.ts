import { API_URL } from '@/config';

export interface FieldError {
  field: string;
  message: string;
}

/** שגיאה מהשרת, בפורמט אחיד: סטטוס, קוד, הודעה ופרטי שדות */
export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly details: FieldError[] | undefined;
  /** הפרטים כפי שהשרת שלח אותם, למקרים עם מבנה אחר (למשל סיבות להתנגשות בלוח) */
  readonly rawDetails: unknown;

  constructor(status: number, code: string, message: string, details?: FieldError[], rawDetails?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = details;
    this.rawDetails = rawDetails;
  }
}

export function getErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message) return error.message;
  return 'אירעה שגיאה לא צפויה';
}

interface ClientConfig {
  getToken: () => string | null;
  onUnauthorized: () => void;
}

let config: ClientConfig = {
  getToken: () => null,
  onUnauthorized: () => undefined
};

/** מחברת את הלקוח למקום שבו המפתח נשמר (Redux), בלי שהלקוח יכיר אותו ישירות */
export function configureApiClient(next: Partial<ClientConfig>) {
  config = { ...config, ...next };
}

type Method = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

interface RequestOptions {
  method?: Method;
  body?: unknown;
  query?: object;
  /** false עבור Endpoints ציבוריים (התחברות) */
  auth?: boolean;
  signal?: AbortSignal;
  accept?: string;
}

function buildUrl(path: string, query?: object): string {
  const url = new URL(`${API_URL}${path}`);
  for (const [key, value] of Object.entries(query ?? {})) {
    if (value === undefined || value === null || value === '') continue;
    url.searchParams.set(key, String(value));
  }
  return url.toString();
}

const FALLBACK_MESSAGES: Record<number, string> = {
  400: 'הנתונים שנשלחו אינם תקינים',
  401: 'ההתחברות פגה, יש להתחבר מחדש',
  403: 'אין לך הרשאה לבצע פעולה זו',
  404: 'המשאב לא נמצא',
  409: 'קיימת התנגשות עם נתונים קיימים',
  413: 'הקובץ גדול מדי',
  429: 'יותר מדי ניסיונות, אפשר לנסות שוב בעוד כמה דקות'
};

async function toApiError(response: Response): Promise<ApiError> {
  const data = (await response.json().catch(() => null)) as {
    error?: { code?: string; message?: string; details?: unknown };
  } | null;
  const error = data?.error;
  const details = Array.isArray(error?.details)
    ? (error.details as unknown[]).filter(
        (d): d is FieldError =>
          typeof d === 'object' && d !== null && 'field' in d && 'message' in d
      )
    : undefined;
  return new ApiError(
    response.status,
    error?.code ?? 'HTTP_ERROR',
    error?.message ?? FALLBACK_MESSAGES[response.status] ?? 'שגיאה בשרת, נסי שוב מאוחר יותר',
    details,
    error?.details
  );
}

async function send(path: string, options: RequestOptions): Promise<Response> {
  const { method = 'GET', body, query, auth = true, signal, accept = 'application/json' } = options;

  const headers = new Headers({ Accept: accept });
  if (auth) {
    const token = config.getToken();
    if (token) headers.set('Authorization', `Bearer ${token}`);
  }

  let payload: BodyInit | undefined;
  if (body instanceof FormData) {
    // הדפדפן קובע לבד Content-Type עם ה-boundary
    payload = body;
  } else if (body !== undefined) {
    headers.set('Content-Type', 'application/json');
    payload = JSON.stringify(body);
  }

  let response: Response;
  try {
    response = await fetch(buildUrl(path, query), { method, headers, body: payload, signal });
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') throw error;
    throw new ApiError(0, 'NETWORK_ERROR', 'לא ניתן להתחבר לשרת. בדקי את החיבור ונסי שוב.');
  }

  if (!response.ok) {
    if (response.status === 401 && auth) config.onUnauthorized();
    throw await toApiError(response);
  }
  return response;
}

/** בקשה שמחזירה JSON. תשובת 204 מחזירה undefined */
export async function request<T = void>(path: string, options: RequestOptions = {}): Promise<T> {
  const response = await send(path, options);
  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}

function parseFileName(disposition: string | null): string {
  if (!disposition) return 'file';
  const encoded = /filename\*=UTF-8''([^;]+)/i.exec(disposition);
  if (encoded?.[1]) {
    try {
      return decodeURIComponent(encoded[1]);
    } catch {
      /* ממשיכות לשם הרגיל */
    }
  }
  const plain = /filename="?([^";]+)"?/i.exec(disposition);
  return plain?.[1] ?? 'file';
}

/** הורדת קובץ עם הכותרת Authorization (קישור רגיל לא היה שולח אותה) */
export async function download(path: string): Promise<{ blob: Blob; fileName: string }> {
  const response = await send(path, { accept: '*/*' });
  return {
    blob: await response.blob(),
    fileName: parseFileName(response.headers.get('Content-Disposition'))
  };
}
