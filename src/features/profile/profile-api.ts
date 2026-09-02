import type { Profile } from '@/features/auth/auth-types';

export async function getCurrentProfile(userId: string): Promise<Profile | null> {
  const { getBuzzerhoodDb } = await import('@/lib/supabase/client');
  const { data, error } = await getBuzzerhoodDb()
    .from('profiles')
    .select('id, display_name, avatar_path, created_at, updated_at')
    .eq('id', userId)
    .maybeSingle();
  if (error) throw error;
  return data as Profile | null;
}
