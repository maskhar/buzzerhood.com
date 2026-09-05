import { environment, hasApiConfig } from '@/app/config/environment';
import { ApiClientError } from './errors';

type ApiErrorBody = { error?: { code?: string; message?: string; requestId?: string; details?: unknown } };
type ApiRequestOptions = Omit<RequestInit, 'body' | 'headers'> & { body?: unknown; headers?: HeadersInit; retryOnUnauthorized?: boolean };

let accessToken: string | null = null;
let csrfToken: string | null = typeof sessionStorage === 'undefined' ? null : sessionStorage.getItem('buzzerhood_csrf');
let refreshInFlight: Promise<string | null> | null = null;

function endpoint(path: string) {
  if (!hasApiConfig || !environment.apiBaseUrl) throw new ApiClientError(0, 'API_NOT_CONFIGURED', 'Backend API belum dikonfigurasi.');
  return `${environment.apiBaseUrl.replace(/\/$/, '')}${path}`;
}

function setCsrfToken(token: string | null) {
  csrfToken = token;
  if (typeof sessionStorage === 'undefined') return;
  if (token) sessionStorage.setItem('buzzerhood_csrf', token);
  else sessionStorage.removeItem('buzzerhood_csrf');
}

function setAccessToken(token: string | null) { accessToken = token; }

async function parseError(response: Response) {
  const body = await response.json().catch(() => null) as ApiErrorBody | null;
  return new ApiClientError(response.status, body?.error?.code ?? 'REQUEST_FAILED', body?.error?.message ?? 'Permintaan tidak dapat diproses.', body?.error?.requestId, body?.error?.details);
}

export function storeAuthTokens(result: { accessToken: string; csrfToken: string }) {
  setAccessToken(result.accessToken);
  setCsrfToken(result.csrfToken);
}

export function clearAuthTokens() {
  setAccessToken(null);
  setCsrfToken(null);
}

export async function refreshAccessToken(): Promise<string | null> {
  if (refreshInFlight) return refreshInFlight;
  if (!csrfToken) return null;
  refreshInFlight = (async () => {
    const response = await fetch(endpoint('/auth/refresh'), {
      method: 'POST', credentials: 'include', headers: { 'X-CSRF-Token': csrfToken },
    });
    if (!response.ok) { clearAuthTokens(); return null; }
    const result = await response.json() as { accessToken: string; csrfToken: string };
    storeAuthTokens(result);
    return result.accessToken;
  })().finally(() => { refreshInFlight = null; });
  return refreshInFlight;
}

export async function apiRequest<T>(path: string, options: ApiRequestOptions = {}): Promise<T> {
  const { body, headers, retryOnUnauthorized = true, ...init } = options;
  const requestHeaders = new Headers(headers);
  if (body !== undefined) requestHeaders.set('Content-Type', 'application/json');
  if (accessToken) requestHeaders.set('Authorization', `Bearer ${accessToken}`);
  const response = await fetch(endpoint(path), { ...init, body: body === undefined ? undefined : JSON.stringify(body), headers: requestHeaders, credentials: 'include' });
  if (response.status === 401 && retryOnUnauthorized && path !== '/auth/refresh') {
    const refreshed = await refreshAccessToken();
    if (refreshed) return apiRequest<T>(path, { ...options, retryOnUnauthorized: false });
  }
  if (!response.ok) throw await parseError(response);
  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}
