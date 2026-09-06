import { apiRequest, clearAuthTokens, storeAuthTokens } from './client';

export type BackendUser = { id: string; email: string; roles: string[]; permissions?: string[]; displayName?: string | null; avatarPath?: string | null };
type AuthMeResponse = { id: string; email: string; roles: string[]; permissions?: string[]; profile?: { displayName?: string | null; avatarPath?: string | null } };
type AuthTokens = { accessToken: string; csrfToken: string; expiresIn: number; tokenType: 'Bearer' };
export type LoginInput = { email: string; password: string };

export async function login(input: LoginInput): Promise<BackendUser> {
  const result = await apiRequest<AuthTokens>('/auth/login', { method: 'POST', body: input, retryOnUnauthorized: false });
  storeAuthTokens(result);
  try { return await apiRequest<BackendUser>('/auth/me', { retryOnUnauthorized: false }); }
  catch (error) { clearAuthTokens(); throw error; }
}

function normalizeUser(user: AuthMeResponse): BackendUser { return { id: user.id, email: user.email, roles: user.roles, permissions: user.permissions, displayName: user.profile?.displayName ?? null, avatarPath: user.profile?.avatarPath ?? null }; }

export async function getCurrentUser() { return normalizeUser(await apiRequest<AuthMeResponse>('/auth/me')); }

export async function updateCurrentUserProfile(displayName: string) { return normalizeUser(await apiRequest<AuthMeResponse>('/auth/profile', { method: 'PATCH', body: { displayName } })); }

export async function logout() {
  try { await apiRequest<void>('/auth/logout', { method: 'POST', headers: { 'X-CSRF-Token': sessionStorage.getItem('buzzerhood_csrf') ?? '' }, retryOnUnauthorized: false }); }
  finally { clearAuthTokens(); }
}
