import { apiRequest, clearAuthTokens, storeAuthTokens } from './client';

export type BackendUser = { id: string; email: string; roles: string[]; permissions?: string[]; displayName?: string | null };
type AuthTokens = { accessToken: string; csrfToken: string; expiresIn: number; tokenType: 'Bearer' };
export type LoginInput = { email: string; password: string };

export async function login(input: LoginInput): Promise<BackendUser> {
  const result = await apiRequest<AuthTokens>('/auth/login', { method: 'POST', body: input, retryOnUnauthorized: false });
  storeAuthTokens(result);
  try { return await apiRequest<BackendUser>('/auth/me', { retryOnUnauthorized: false }); }
  catch (error) { clearAuthTokens(); throw error; }
}

export function getCurrentUser() { return apiRequest<BackendUser>('/auth/me'); }

export async function logout() {
  try { await apiRequest<void>('/auth/logout', { method: 'POST', headers: { 'X-CSRF-Token': sessionStorage.getItem('buzzerhood_csrf') ?? '' }, retryOnUnauthorized: false }); }
  finally { clearAuthTokens(); }
}
