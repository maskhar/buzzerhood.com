import { apiRequest } from '@/lib/api/client';

export type CurrentProfile = { id: string; displayName: string | null; avatarPath: string | null };

type AuthMeResponse = { id: string; profile?: { displayName?: string | null; avatarPath?: string | null } };

export async function getCurrentProfile(): Promise<CurrentProfile | null> {
  const user = await apiRequest<AuthMeResponse>('/auth/me');
  return user.profile ? { id: user.id, displayName: user.profile.displayName ?? null, avatarPath: user.profile.avatarPath ?? null } : null;
}
